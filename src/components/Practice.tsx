import { useMemo, useState } from 'react';
import { generateQuiz } from '../engine/quiz';
import type { AlgorithmKey } from '../engine/registry';

interface Props {
  algorithmKey: AlgorithmKey;
}

/**
 * Practice section: questions generated from a real run of the algorithm, so
 * the answer key is whatever the engine actually did. Immediate feedback plus
 * an explanation that points back at the runner above.
 */
export function Practice({ algorithmKey }: Props) {
  const [seed, setSeed] = useState(1);
  const questions = useMemo(() => generateQuiz(algorithmKey, seed), [algorithmKey, seed]);
  const [picked, setPicked] = useState<Record<number, number>>({});

  const answered = Object.keys(picked).length;
  const correct = questions.reduce(
    (n, q, i) => n + (picked[i] === q.answerIndex ? 1 : 0),
    0,
  );
  const allDone = answered === questions.length;

  const newSet = () => {
    setSeed((s) => s + 1);
    setPicked({});
  };

  return (
    <div className="rounded-[1rem] border border-subtle bg-surface-2/50 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-display text-xl italic text-primary">Practice</h4>
        <div className="flex items-center gap-3">
          {answered > 0 && (
            <span
              className={`font-mono text-xs ${allDone && correct === questions.length ? 'text-lime' : 'text-secondary'}`}
            >
              {correct} / {questions.length} correct
            </span>
          )}
          <button
            type="button"
            onClick={newSet}
            className="rounded-full border border-subtle px-3 py-1.5 text-[11px] text-secondary transition-colors duration-fast hover:border-accent hover:text-accent"
          >
            New questions
          </button>
        </div>
      </div>

      <ol className="flex flex-col gap-5">
        {questions.map((q, qi) => {
          const choice = picked[qi];
          const done = choice !== undefined;
          return (
            <li key={`${seed}-${qi}`} className="flex flex-col gap-2">
              <p className="text-sm leading-snug text-primary">
                <span className="mr-1.5 font-mono text-xs text-muted">{qi + 1}.</span>
                {q.prompt}
              </p>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt, oi) => {
                  const isAnswer = oi === q.answerIndex;
                  const isPick = choice === oi;
                  let cls =
                    'border-subtle text-secondary hover:border-strong hover:text-primary';
                  if (done && isAnswer) cls = 'border-lime bg-lime/10 text-lime';
                  else if (done && isPick) cls = 'border-bar-swapping bg-bar-swapping/10 text-bar-swapping';
                  else if (done) cls = 'border-subtle text-muted opacity-60';
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={done}
                      onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                      className={`rounded-full border px-3.5 py-1.5 text-left font-mono text-xs transition-colors duration-fast disabled:cursor-default ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {done && (
                <p className="rise-in rounded-lg bg-surface-3/60 px-3 py-2 text-xs leading-snug text-secondary">
                  {choice === q.answerIndex ? '✓ Correct. ' : '✗ Not quite. '}
                  {q.explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
