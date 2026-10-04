import React from 'react';

/**
 * Transforms plain text into Bionic Reading spans with bold visual fixations.
 * Bolds initial characters based on word length to guide saccadic movement.
 */
export function formatBionicText(text) {
  if (!text) return null;

  const paragraphs = text.split(/\n+/);

  return paragraphs.map((para, pIdx) => {
    // Match words and non-words
    const tokens = para.split(/(\s+)/);

    const bionicTokens = tokens.map((token, tIdx) => {
      // If whitespace, return as is
      if (/^\s+$/.test(token)) {
        return <span key={tIdx}>{token}</span>;
      }

      // Separate leading punctuation, alphanumeric core, trailing punctuation
      const match = token.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9]+)([^a-zA-Z0-9]*)$/);

      if (!match) {
        return <span key={tIdx}>{token}</span>;
      }

      const [, prefix, core, suffix] = match;
      const len = core.length;
      let fixLen = 1;

      if (len === 1) fixLen = 1;
      else if (len <= 3) fixLen = 1;
      else if (len <= 5) fixLen = 2;
      else if (len <= 8) fixLen = 3;
      else fixLen = Math.ceil(len * 0.45);

      const fix = core.slice(0, fixLen);
      const rest = core.slice(fixLen);

      return (
        <span key={tIdx} className="bionic-word">
          {prefix && <span>{prefix}</span>}
          <span className="bionic-fix">{fix}</span>
          <span className="bionic-rest">{rest}</span>
          {suffix && <span>{suffix}</span>}
        </span>
      );
    });

    return (
      <p key={pIdx}>
        {bionicTokens}
      </p>
    );
  });
}
