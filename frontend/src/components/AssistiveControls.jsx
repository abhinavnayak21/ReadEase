import React from 'react';
import { SUPPORTED_LANGUAGES } from '../data/sampleArticles';

export function AssistiveControls({
  settings,
  updateSetting,
  onLanguageChange,
  isTranslating = false,
  elevenVoices = [],
  resetToDefaults,
}) {
  return (
    <aside className="controls-panel" aria-label="Reading Settings">
      {/* 0. Language */}
      <section className="control-group">
        <h2 className="group-title">
          <span>🌐</span> Language / भाषा
        </h2>
        <div className="field-group">
          <select
            id="language-select"
            value={settings.language || 'en'}
            disabled={isTranslating}
            onChange={(e) => onLanguageChange ? onLanguageChange(e.target.value) : updateSetting('language', e.target.value)}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
          {isTranslating && (
            <span style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: 4, fontWeight: 600 }}>
              🔄 Converting text...
            </span>
          )}
        </div>
      </section>

      {/* 1. Reading Aids */}
      <section className="control-group">
        <h2 className="group-title">
          <span>👓</span> Reading Aids
        </h2>
        <div className="toggle-list">
          <label className="toggle-row">
            <span>Dyslexia Font</span>
            <input
              type="checkbox"
              checked={settings.dyslexiaMode}
              onChange={(e) => {
                const checked = e.target.checked;
                updateSetting('dyslexiaMode', checked);
                updateSetting('font', checked ? 'OpenDyslexic' : 'Roboto');
              }}
            />
          </label>

          <label className="toggle-row">
            <span>Bionic Reading</span>
            <input
              type="checkbox"
              checked={settings.bionicReading}
              onChange={(e) => updateSetting('bionicReading', e.target.checked)}
            />
          </label>

          <label className="toggle-row">
            <span>Reading Ruler</span>
            <input
              type="checkbox"
              checked={settings.readingRuler}
              onChange={(e) => updateSetting('readingRuler', e.target.checked)}
            />
          </label>
        </div>
      </section>

      {/* 2. Typography & Appearance */}
      <section className="control-group">
        <h2 className="group-title">
          <span>🔤</span> Typography & Size
        </h2>

        {/* Font Family */}
        <div className="field-group">
          <label htmlFor="font-family-select">Typeface</label>
          <select
            id="font-family-select"
            value={settings.font}
            onChange={(e) => {
              const val = e.target.value;
              updateSetting('font', val);
              updateSetting('dyslexiaMode', val === 'OpenDyslexic');
            }}
          >
            <option value="OpenDyslexic">OpenDyslexic (Dyslexia-friendly)</option>
            <option value="Roboto">Roboto (Clean Modern)</option>
            <option value="Nunito">Nunito (Friendly Rounded)</option>
            <option value="Georgia">Georgia (Classic Serif)</option>
            <option value="ComicSans">Comic Sans MS (High Legibility)</option>
          </select>
        </div>

        {/* Font Size */}
        <div className="field-group">
          <div className="field-label-row">
            <label htmlFor="font-size-slider">Text Size</label>
            <span className="value-badge">{settings.fontSize}px</span>
          </div>
          <input
            id="font-size-slider"
            type="range"
            min="14"
            max="28"
            step="1"
            value={settings.fontSize}
            onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
          />
        </div>

        {/* Theme */}
        <div className="field-group">
          <label>Reading Theme</label>
          <div className="theme-options">
            <button
              type="button"
              className={`theme-btn light ${settings.theme === 'theme-light' ? 'active' : ''}`}
              onClick={() => updateSetting('theme', 'theme-light')}
            >
              White
            </button>
            <button
              type="button"
              className={`theme-btn sepia ${settings.theme === 'theme-sepia' ? 'active' : ''}`}
              onClick={() => updateSetting('theme', 'theme-sepia')}
            >
              Sepia
            </button>
            <button
              type="button"
              className={`theme-btn dark ${settings.theme === 'theme-dark' ? 'active' : ''}`}
              onClick={() => updateSetting('theme', 'theme-dark')}
            >
              Dark
            </button>
          </div>
        </div>
      </section>

      {/* 3. ElevenLabs Voice Settings */}
      <section className="control-group">
        <h2 className="group-title">
          <span>🔊</span> ElevenLabs Voice
        </h2>

        {/* Voice Selector */}
        <div className="field-group">
          <label htmlFor="eleven-voice-select">AI Voice</label>
          <select
            id="eleven-voice-select"
            value={settings.elevenVoiceId || '21m00Tcm4TlvDq8ikWAM'}
            onChange={(e) => updateSetting('elevenVoiceId', e.target.value)}
          >
            {elevenVoices.map((v) => (
              <option key={v.voice_id} value={v.voice_id}>
                {v.name} {v.description ? `(${v.description})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Speed */}
        <div className="field-group">
          <div className="field-label-row">
            <label htmlFor="tts-speed">Speech Speed</label>
            <span className="value-badge">{settings.speechRate || 1.0}x</span>
          </div>
          <input
            id="tts-speed"
            type="range"
            min="0.75"
            max="1.75"
            step="0.05"
            value={settings.speechRate || 1.0}
            onChange={(e) => updateSetting('speechRate', parseFloat(e.target.value))}
          />
        </div>

        {/* Highlight Word Toggle */}
        <div className="toggle-list" style={{ marginTop: 10 }}>
          <label className="toggle-row">
            <span>Highlight spoken words</span>
            <input
              type="checkbox"
              checked={settings.speechHighlight !== false}
              onChange={(e) => updateSetting('speechHighlight', e.target.checked)}
            />
          </label>
        </div>
      </section>

      {/* Reset */}
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <button
          type="button"
          className="reset-btn"
          onClick={resetToDefaults}
        >
          ↺ Reset to Defaults
        </button>
      </div>
    </aside>
  );
}
