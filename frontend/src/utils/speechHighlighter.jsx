import React, { useEffect, useRef } from 'react';
import { formatBionicText } from './bionicReader';

/**
 * Renders paragraphs with an optional follow-along spoken word highlight and auto-scroll.
 */
export function HighlightedTextContent({
  text,
  charIndex,
  charLength,
  isHighlightActive,
  isBionic = false,
}) {
  const activeWordRef = useRef(null);

  // Auto-scroll gently to keep the active spoken word in view
  useEffect(() => {
    if (isHighlightActive && activeWordRef.current) {
      activeWordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [charIndex, isHighlightActive]);

  if (!text) return null;

  // If no highlight is active or text is in bionic mode without active speech
  if (!isHighlightActive || charIndex < 0 || charIndex >= text.length) {
    if (isBionic) {
      return formatBionicText(text);
    }
    return text.split('\n\n').map((para, idx) => (
      <p key={idx}>{para}</p>
    ));
  }

  // Calculate paragraph boundaries to place the highlighted word accurately
  const paragraphs = text.split('\n\n');
  let cumulativeLength = 0;

  return (
    <>
      {paragraphs.map((para, pIdx) => {
        const pStart = cumulativeLength;
        const pEnd = pStart + para.length;
        // +2 accounts for the '\n\n' separator between paragraphs
        cumulativeLength = pEnd + 2;

        // Check if the currently spoken word is inside this paragraph
        if (charIndex >= pStart && charIndex < pEnd) {
          const localIndex = charIndex - pStart;
          const safeLength = Math.max(1, Math.min(charLength || 4, para.length - localIndex));

          const before = para.slice(0, localIndex);
          const word = para.slice(localIndex, localIndex + safeLength);
          const after = para.slice(localIndex + safeLength);

          return (
            <p key={pIdx}>
              {before}
              <mark
                ref={activeWordRef}
                className="tts-spoken-word"
                aria-current="location"
              >
                {word}
              </mark>
              {after}
            </p>
          );
        }

        return <p key={pIdx}>{para}</p>;
      })}
    </>
  );
}
