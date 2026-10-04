import React from 'react';

export function SpeechPlayer({
  speakingState, // 'idle' | 'loading' | 'playing' | 'paused'
  onPlay,
  onPause,
  onResume,
  onStop,
  rate,
  onRateChange,
  voices = [],
  selectedVoice,
  onVoiceChange,
  hasSelection,
  onSpeakSelection,
  errorMessage,
}) {
  const isLoading = speakingState === 'loading';
  const isPlaying = speakingState === 'playing';
  const isPaused = speakingState === 'paused';
  const isIdle = speakingState === 'idle';

  return (
    <div className={`speech-player-bar ${isPlaying ? 'is-playing' : ''}`}>
      {/* Controls & Status */}
      <div className="player-left">
        {isLoading ? (
          <button type="button" className="play-btn loading" disabled>
            <span className="spinner">⟳</span>
            <span>Generating Audio...</span>
          </button>
        ) : isIdle ? (
          <button
            type="button"
            className="play-btn primary"
            onClick={onPlay}
            title="Read aloud (Alt + S)"
          >
            ▶ Listen
          </button>
        ) : isPlaying ? (
          <button
            type="button"
            className="play-btn pause"
            onClick={onPause}
            title="Pause (Alt + S)"
          >
            ⏸ Pause
          </button>
        ) : (
          <button
            type="button"
            className="play-btn resume"
            onClick={onResume}
            title="Resume (Alt + S)"
          >
            ▶ Resume
          </button>
        )}

        {!isIdle && !isLoading && (
          <button
            type="button"
            className="stop-icon-btn"
            onClick={onStop}
            title="Stop audio"
          >
            ⏹ Stop
          </button>
        )}

        {/* Status text */}
        <span className="player-status">
          {isLoading
            ? 'Generating ElevenLabs voice...'
            : isPlaying
            ? hasSelection
              ? 'Reading selection...'
              : 'Reading aloud...'
            : isPaused
            ? 'Paused'
            : 'ElevenLabs AI Ready'}
        </span>

        {errorMessage && (
          <span className="player-error" title={errorMessage}>
            ⚠️ {errorMessage.length > 30 ? `${errorMessage.slice(0, 30)}…` : errorMessage}
          </span>
        )}
      </div>

      {/* Right: Selection, Voice & Speed */}
      <div className="player-right">
        {hasSelection && isIdle && !isLoading && (
          <button
            type="button"
            className="speak-selection-btn"
            onClick={onSpeakSelection}
          >
            ✨ Speak Selection
          </button>
        )}

        {/* Speed options */}
        <div className="speed-selector">
          {[1.0, 1.25, 1.5].map((s) => (
            <button
              key={s}
              type="button"
              className={`speed-btn ${Math.abs(rate - s) < 0.05 ? 'active' : ''}`}
              onClick={() => onRateChange(s)}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Voice selector */}
        {voices.length > 0 && (
          <select
            className="voice-select"
            value={selectedVoice || ''}
            onChange={(e) => onVoiceChange(e.target.value)}
            aria-label="Select AI Voice"
          >
            {voices.map((v) => (
              <option key={v.voice_id || v.name} value={v.voice_id || v.name}>
                {v.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
