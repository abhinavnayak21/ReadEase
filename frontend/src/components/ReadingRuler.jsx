import React, { useEffect, useState } from 'react';

export function ReadingRuler({ enabled, height = 44, containerRef }) {
  const [topPos, setTopPos] = useState(120);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      // Only show ruler if mouse is within container bounds
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        setVisible(true);
        const relativeY = e.clientY - rect.top;
        setTopPos(relativeY - height / 2);
      } else {
        setVisible(false);
      }
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (container) container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, height, containerRef]);

  if (!enabled || !visible) return null;

  return (
    <div
      className="reading-ruler"
      style={{
        top: `${Math.max(0, topPos)}px`,
        height: `${height}px`,
      }}
      aria-hidden="true"
    />
  );
}
