import { buildSteps } from './player';
import { getAlgorithm, type AlgorithmKey } from './registry';
import { PSEUDOCODE } from './pseudocode';
import { applyStepsToArray } from './replay';
import { countersAt } from './counters';

/**
 * Practice questions are *derived from a real run* of the algorithm, never
 * hand-written. The answer key is whatever the engine actually did, so a
 * question can never disagree with the visualizer.
 */
export interface Question {
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

/** Deterministic shuffle driven by a seed, so options aren't always in order. */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build a multiple-choice item from a correct answer + distractors. */
function mc(
  prompt: string,
  correct: string,
  distractors: string[],
  explanation: string,
  seed: number,
): Question {
  const unique = [...new Set(distractors.filter((d) => d !== correct))].slice(0, 3);
  const options = seededShuffle([correct, ...unique], seed);
  return { prompt, options, answerIndex: options.indexOf(correct), explanation };
}

const fmtArr = (a: readonly number[]) => `[${a.join(', ')}]`;

export function generateQuiz(key: AlgorithmKey, seed: number): Question[] {
  const algo = getAlgorithm(key);
  const lines = PSEUDOCODE[key];

  // A small, readable array — the questions must be answerable by hand.
  const base = [5, 2, 8, 1, 9];
  const input = seededShuffle(base, seed);
  const steps = buildSteps(algo.generator, input);
  const total = countersAt(steps, steps.length);

  const questions: Question[] = [];

  // 1. Trace: what does the array look like after the first N real operations?
  const firstMutation = steps.findIndex((s) => s.type === 'swap' || s.type === 'overwrite');
  if (firstMutation >= 0) {
    const after = applyStepsToArray(input, steps.slice(0, firstMutation + 1));
    const wrong1 = applyStepsToArray(input, steps.slice(0, firstMutation + 2));
    const sorted = input.slice().sort((x, y) => x - y);
    questions.push(
      mc(
        `Starting from ${fmtArr(input)}, what is the array right after ${algo.name} performs its very first ${steps[firstMutation].type === 'swap' ? 'swap' : 'write'}?`,
        fmtArr(after),
        [fmtArr(input), fmtArr(wrong1), fmtArr(sorted)],
        `The first ${steps[firstMutation].type} produces ${fmtArr(after)}. Run it in the panel above and press "step" once past the first ${steps[firstMutation].type} to see it.`,
        seed + 1,
      ),
    );
  }

  // 2. Cost: how many comparisons does this exact run take?
  const c = total.comparisons;
  questions.push(
    mc(
      `On ${fmtArr(input)}, exactly how many comparisons does ${algo.name} make?`,
      String(c),
      [String(c + 2), String(Math.max(0, c - 3)), String(c * 2)],
      `The engine counts ${c} comparisons for this run. Comparison counts depend on the input, which is why "Nearly sorted" data is so much cheaper for insertion sort.`,
      seed + 2,
    ),
  );

  // 3. Complexity in the worst case.
  const others = ['O(n)', 'O(n log n)', 'O(n²)', 'O(nk)', 'O(log n)'];
  questions.push(
    mc(
      `What is the WORST-case time complexity of ${algo.name}?`,
      algo.complexity.worst,
      others,
      `${algo.name} is ${algo.complexity.worst} in the worst case (best: ${algo.complexity.best}, average: ${algo.complexity.average}).`,
      seed + 3,
    ),
  );

  // 4. Stability.
  questions.push(
    mc(
      `Is ${algo.name} stable — does it preserve the original order of equal elements?`,
      algo.stable ? 'Yes, it is stable' : 'No, it is not stable',
      ['Yes, it is stable', 'No, it is not stable', 'Only on sorted input'],
      algo.stable
        ? `${algo.name} never moves an element past an equal one, so equal values keep their original relative order.`
        : `${algo.name} can move an element past an equal one (it makes long-distance moves), so equal values may end up reordered.`,
      seed + 4,
    ),
  );

  // 5. Read the code: which line does the real work?
  const busiest = new Map<number, number>();
  for (const s of steps) {
    if (s.line === undefined) continue;
    if (s.type === 'swap' || s.type === 'overwrite') {
      busiest.set(s.line, (busiest.get(s.line) ?? 0) + 1);
    }
  }
  const topLine = [...busiest.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (topLine !== undefined) {
    const distractors = lines
      .map((l, i) => ({ l, i }))
      .filter((x) => x.i !== topLine)
      .map((x) => `Line ${x.i + 1}: ${x.l.text.trim()}`);
    questions.push(
      mc(
        `In the pseudocode above, which line actually MOVES the data (performs the most swaps/writes)?`,
        `Line ${topLine + 1}: ${lines[topLine].text.trim()}`,
        seededShuffle(distractors, seed).slice(0, 3),
        `Line ${topLine + 1} runs ${busiest.get(topLine)} times on this input. Run the code above and watch which line lights up when the bars move.`,
        seed + 5,
      ),
    );
  }

  // 6. Swap-model insight (radix/merge do zero swaps by design).
  if (algo.writesModel === 'overwrite') {
    questions.push(
      mc(
        `How many SWAPS does ${algo.name} perform?`,
        'Zero — it never swaps, it writes values into place',
        [
          'About n log n swaps',
          'The same number as its comparisons',
          'One swap per element',
        ],
        `${algo.name} is not swap-based: it copies values into their target positions, so its swap counter stays at 0 while its write counter grows.`,
        seed + 6,
      ),
    );
  }

  return questions;
}
