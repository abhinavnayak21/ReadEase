import React, { useState, useEffect, useRef } from 'react';
import { SUPPORTED_LANGUAGES } from './data/sampleArticles';
import { AssistiveControls } from './components/AssistiveControls';
import { ReadingRuler } from './components/ReadingRuler';
import { SpeechPlayer } from './components/SpeechPlayer';
import { HighlightedTextContent } from './utils/speechHighlighter';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { CURATED_ELEVENLABS_VOICES, fetchElevenLabsVoices } from './services/elevenlabs';
import { translateText } from './services/translator';
import './App.css';

const DEFAULT_SETTINGS = {
  font: 'OpenDyslexic',
  fontSize: 18,
  theme: 'theme-light', // Pure White default
  language: 'en',
  dyslexiaMode: true,
  bionicReading: false,
  readingRuler: false,
  speechEngine: 'elevenlabs',
  elevenVoiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
  elevenApiKey: '',
  speechRate: 1.0,
  speechHighlight: true,
};

const DEFAULT_TEXT = `Welcome to ReadEase!

Paste or type any text here, and use the Language dropdown above to instantly convert and translate it to Hindi (हिन्दी), Spanish, French, or German.

Click 'Listen' to hear ElevenLabs read your text aloud with live word highlighting.`;

export default function App() {
  // Settings initialization (enforcing white page)
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('readease_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.theme || parsed.theme === 'theme-default' || parsed.theme === 'theme-dark') {
          parsed.theme = 'theme-light';
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // User's custom text for copy-pasting and reading
  const [text, setText] = useState(() => {
    try {
      const saved = localStorage.getItem('readease_text');
      return saved !== null ? saved : DEFAULT_TEXT;
    } catch {
      return DEFAULT_TEXT;
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showSettings, setShowSettings] = useState(true);
  const [elevenVoices, setElevenVoices] = useState(CURATED_ELEVENLABS_VOICES);

  // Translation state
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);
  const [originalText, setOriginalText] = useState('');
  const [originalLang, setOriginalLang] = useState('en');

  const canvasRef = useRef(null);
  const textareaRef = useRef(null);

  // Enforce white background
  useEffect(() => {
    document.documentElement.style.backgroundColor = '#ffffff';
    document.body.style.backgroundColor = '#ffffff';
  }, []);

  // Sync settings
  useEffect(() => {
    try {
      localStorage.setItem('readease_settings', JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  // Persist text
  useEffect(() => {
    try {
      localStorage.setItem('readease_text', text);
    } catch (e) {
      console.error(e);
    }
  }, [text]);

  // Load ElevenLabs voices
  useEffect(() => {
    fetchElevenLabsVoices(settings.elevenApiKey).then((list) => {
      if (list && list.length > 0) setElevenVoices(list);
    });
  }, [settings.elevenApiKey]);

  // Text-to-Speech hook
  const {
    speakingState,
    currentWordIndex,
    currentWordLength,
    errorMessage: ttsError,
    speak,
    pause: pauseSpeech,
    resume: resumeSpeech,
    stop: stopSpeech,
  } = useTextToSpeech({
    engine: settings.speechEngine,
    elevenVoiceId: settings.elevenVoiceId,
    elevenApiKey: settings.elevenApiKey,
    rate: settings.speechRate,
  });

  // Track text selection for "Speak Selection"
  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      setSelectedText(sel ? sel.toString().trim() : '');
    };
    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Language selector & Automatic AI Translation
  const handleLanguageChange = async (newLang) => {
    stopSpeech();
    const prevLang = settings.language || 'en';
    updateSetting('language', newLang);

    const cleanText = text.trim();
    if (!cleanText) return;

    // If user selects the same language, no-op
    if (newLang === prevLang) return;

    // If user switches back to original language and we have original text, restore it
    if (originalText && newLang === originalLang) {
      setText(originalText);
      setTranslationError(null);
      return;
    }

    // Save current text as original before first translation
    if (!originalText) {
      setOriginalText(cleanText);
      setOriginalLang(prevLang);
    }

    // Translate to the chosen language
    try {
      setIsTranslating(true);
      setTranslationError(null);
      const translated = await translateText(cleanText, newLang);
      if (translated && translated.trim()) {
        setText(translated.trim());
      }
    } catch (err) {
      console.error('Translation error:', err);
      setTranslationError(err.message || 'Translation failed.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Restore original text before translation
  const handleRestoreOriginal = () => {
    if (originalText) {
      stopSpeech();
      setText(originalText);
      updateSetting('language', originalLang);
      setTranslationError(null);
    }
  };

  // User edits text directly
  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    // Reset original text so subsequent translations use this new base
    setOriginalText(val);
    setOriginalLang(settings.language || 'en');
  };

  // One-click clipboard paste handler
  const handlePasteClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText && clipText.trim()) {
        stopSpeech();
        const clean = clipText.trim();
        setText(clean);
        setOriginalText(clean);
        setOriginalLang(settings.language || 'en');
        setIsEditing(false);
      }
    } catch {
      stopSpeech();
      setIsEditing(true);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  // Clear text handler
  const handleClearText = () => {
    stopSpeech();
    setText('');
    setOriginalText('');
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  // Playback trigger
  const handlePlay = (forceSelection = false) => {
    if (speakingState === 'paused') {
      resumeSpeech();
      return;
    }

    const cleanText = text.replace(/\r\n/g, '\n').trim();
    if (!cleanText) {
      setIsEditing(true);
      return;
    }

    if (isEditing) {
      setIsEditing(false);
    }

    if (forceSelection && selectedText) {
      const cleanSelection = selectedText.replace(/\r\n/g, '\n').trim();
      const foundIdx = cleanText.indexOf(cleanSelection);
      speak(cleanSelection, foundIdx !== -1 ? foundIdx : 0);
      return;
    }

    speak(cleanText, 0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (speakingState === 'playing') pauseSpeech();
        else if (speakingState === 'paused') resumeSpeech();
        else handlePlay(false);
      } else if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const next = !settings.dyslexiaMode;
        updateSetting('dyslexiaMode', next);
        updateSetting('font', next ? 'OpenDyslexic' : 'Roboto');
      } else if (e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        updateSetting('bionicReading', !settings.bionicReading);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [speakingState, selectedText, text, isEditing, settings]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  const isHighlightActive = settings.speechHighlight && (speakingState === 'playing' || speakingState === 'paused');

  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === (settings.language || 'en'));

  return (
    <div className={`app-wrapper ${settings.theme}`}>
      {/* 1. Header */}
      <header className="app-header">
        <div className="brand">
          <span className="logo-icon">👓</span>
          <span className="brand-name">ReadEase</span>
        </div>

        {/* Quick Actions & Toggles */}
        <div className="header-actions">
          {/* Language Selector (Triggers Translation) */}
          <select
            className="lang-select"
            value={settings.language || 'en'}
            disabled={isTranslating}
            onChange={(e) => handleLanguageChange(e.target.value)}
            title="Convert and translate text to this language / भाषा बदलें"
            aria-label="Choose Language / भाषा चुनें"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>

          {/* Paste Button */}
          <button
            type="button"
            className="chip-btn"
            onClick={handlePasteClipboard}
            title="Paste text from clipboard"
          >
            📋 Paste Text
          </button>

          <button
            type="button"
            className={`chip-btn ${settings.dyslexiaMode ? 'active' : ''}`}
            onClick={() => {
              const next = !settings.dyslexiaMode;
              updateSetting('dyslexiaMode', next);
              updateSetting('font', next ? 'OpenDyslexic' : 'Roboto');
            }}
            title="Toggle Dyslexia Font (Alt + D)"
          >
            Dyslexia Font
          </button>

          <button
            type="button"
            className={`chip-btn ${settings.bionicReading ? 'active' : ''}`}
            onClick={() => updateSetting('bionicReading', !settings.bionicReading)}
            title="Toggle Bionic Reading (Alt + B)"
          >
            Bionic
          </button>

          <button
            type="button"
            className={`chip-btn ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Settings Panel"
          >
            ⚙️ Settings
          </button>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <div className="main-content">
        {/* Settings Sidebar */}
        {showSettings && (
          <AssistiveControls
            settings={settings}
            updateSetting={updateSetting}
            onLanguageChange={handleLanguageChange}
            isTranslating={isTranslating}
            elevenVoices={elevenVoices}
            resetToDefaults={() => setSettings(DEFAULT_SETTINGS)}
          />
        )}

        {/* Reading & Listening Workspace */}
        <main className="reading-workspace">
          {/* ElevenLabs Player Bar */}
          <SpeechPlayer
            speakingState={speakingState}
            onPlay={() => handlePlay(false)}
            onPause={pauseSpeech}
            onResume={resumeSpeech}
            onStop={stopSpeech}
            rate={settings.speechRate || 1.0}
            onRateChange={(r) => updateSetting('speechRate', r)}
            voices={elevenVoices}
            selectedVoice={settings.elevenVoiceId}
            onVoiceChange={(v) => updateSetting('elevenVoiceId', v)}
            hasSelection={Boolean(selectedText)}
            onSpeakSelection={() => handlePlay(true)}
            errorMessage={ttsError}
          />

          {/* Reader Card */}
          <div
            ref={canvasRef}
            className={`reader-card ${settings.font}`}
            style={{
              fontFamily: settings.font,
              fontSize: `${settings.fontSize}px`,
              lineHeight: 1.7,
            }}
          >
            {/* Reading Ruler */}
            <ReadingRuler
              enabled={settings.readingRuler}
              height={44}
              containerRef={canvasRef}
            />

            {/* Toolbar: Stats & Direct Actions */}
            <div className="reader-toolbar">
              <div className="toolbar-left">
                <span className="article-meta">
                  ⏱️ ~{readTime} min read • {wordCount} words
                </span>

                {/* Translating Indicator */}
                {isTranslating && (
                  <span className="translating-indicator">
                    <span className="spinner"></span> Converting to {activeLangObj?.name || 'language'}...
                  </span>
                )}

                {/* Restore Original Button */}
                {originalText && originalText !== text && !isTranslating && (
                  <button
                    type="button"
                    className="card-action-btn restore-btn"
                    onClick={handleRestoreOriginal}
                    title="Restore original text"
                  >
                    ↩️ Restore Original ({originalLang.toUpperCase()})
                  </button>
                )}

                {/* Translation Error */}
                {translationError && (
                  <span className="translation-error-msg">
                    ⚠️ {translationError}
                  </span>
                )}
              </div>

              <div className="toolbar-right">
                <button
                  type="button"
                  className="card-action-btn"
                  onClick={handlePasteClipboard}
                  title="Paste from clipboard"
                >
                  📋 Paste
                </button>
                <button
                  type="button"
                  className={`card-action-btn ${isEditing ? 'active' : ''}`}
                  onClick={() => {
                    stopSpeech();
                    setIsEditing(!isEditing);
                  }}
                  title={isEditing ? 'Preview reading mode' : 'Edit or paste text'}
                >
                  {isEditing ? '✓ View' : '✏️ Edit'}
                </button>
                {text.trim() && (
                  <button
                    type="button"
                    className="card-action-btn"
                    onClick={handleClearText}
                    title="Clear text"
                  >
                    🗑️ Clear
                  </button>
                )}
              </div>
            </div>

            {/* Document Body */}
            <div className="article-body">
              {isEditing || !text.trim() ? (
                <div className="custom-edit-box">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Paste or write any text here (English, हिन्दी, Español, etc.)..."
                    rows={14}
                    className="custom-textarea"
                    autoFocus
                  />
                  <div className="edit-actions-row">
                    <button
                      type="button"
                      className="save-edit-btn"
                      onClick={() => {
                        if (text.trim()) setIsEditing(false);
                      }}
                    >
                      ✓ Done Editing
                    </button>
                    <button
                      type="button"
                      className="listen-now-btn"
                      onClick={() => handlePlay(false)}
                    >
                      ▶ Listen with ElevenLabs
                    </button>
                  </div>
                </div>
              ) : (
                <HighlightedTextContent
                  text={text}
                  charIndex={isHighlightActive && currentWordIndex >= 0 ? currentWordIndex : -1}
                  charLength={currentWordLength}
                  isHighlightActive={isHighlightActive}
                  isBionic={settings.bionicReading}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* 3. Footer */}
      <footer className="app-footer">
        <div className="shortcuts">
          <span>Shortcuts: </span>
          <kbd>Alt + S</kbd> Listen / Pause
          <kbd>Alt + D</kbd> Dyslexia Font
          <kbd>Alt + B</kbd> Bionic
        </div>
        <div className="footer-credits">
          <span>ReadEase • Accessible Reading Studio</span>
        </div>
      </footer>
    </div>
  );
}
