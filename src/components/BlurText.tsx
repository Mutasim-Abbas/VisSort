import { useEffect, useRef, useState } from 'react';

interface Props {
  text: string;
  className?: string;
  /** Per-word stagger in ms. */
  stagger?: number;
  /** Extra delay before the first word, in ms. */
  delay?: number;
}

/**
 * Cinematic word-by-word blur-in headline. Words animate when the element
 * enters the viewport (10% visibility). Pure CSS keyframes — no animation
 * library needed. The parent is a flex-wrap row so tight letter-spacing
 * can't swallow the word gaps.
 */
export function BlurText({ text, className = '', stagger = 100, delay = 0 }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    // Throttled/background tabs may never deliver IO callbacks — show anyway.
    const fallback = window.setTimeout(() => setVisible(true), 1200);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <p
      ref={ref}
      className={className}
      style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', rowGap: '0.1em' }}
    >
      {text.split(' ').map((word, i) => (
        <span
          key={`${word}-${i}`}
          className={visible ? 'blur-word' : ''}
          style={{
            marginRight: '0.28em',
            animationDelay: `${delay + i * stagger}ms`,
            opacity: visible ? undefined : 0,
          }}
        >
          {word}
        </span>
      ))}
    </p>
  );
}
