import { useState, useEffect, useRef, useCallback } from 'react';
import { generateElevenLabsAudio } from '../services/elevenlabs';

export function useTextToSpeech({
  engine = 'elevenlabs', // 'elevenlabs' | 'browser'
  voice: browserVoiceName,
  elevenVoiceId = '21m00Tcm4TlvDq8ikWAM',
  elevenApiKey = '',
  elevenStability = 0.5,
  elevenSimilarityBoost = 0.75,
  rate = 1.0,
  pitch = 1.0,
  volume = 1.0,
  onWordBoundary,
} = {}) {
  const [browserVoices, setBrowserVoices] = useState([]);
  const [speakingState, setSpeakingState] = useState('idle'); // 'idle' | 'loading' | 'playing' | 'paused'
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [currentWordLength, setCurrentWordLength] = useState(0);
  const [spokenText, setSpokenText] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  const utteranceRef = useRef(null);
  const audioRef = useRef(null);
  const alignmentRef = useRef(null);
  const currentTextRef = useRef('');

  // Initialize Web Speech API for browser mode / fallback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.speechSynthesis) {
      setIsSupported(false);
    } else {
      const updateVoices = () => {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          setBrowserVoices(available);
        }
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    // Initialize Audio instance for ElevenLabs
    const audio = new Audio();
    audioRef.current = audio;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Calculate full word bounds around a character index
  const getWordBoundsAt = (text, charIdx) => {
    if (!text || charIdx < 0 || charIdx >= text.length) {
      return { start: charIdx, length: 4 };
    }

    let start = charIdx;
    while (start > 0 && /\w|['-]/.test(text[start - 1])) {
      start--;
    }

    let end = charIdx;
    while (end < text.length && /\w|['-]/.test(text[end])) {
      end++;
    }

    return {
      start,
      length: Math.max(1, end - start),
    };
  };

  // Stop playback across both engines
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    alignmentRef.current = null;
    setSpeakingState('idle');
    setCurrentWordIndex(-1);
    setCurrentWordLength(0);
    setErrorMessage(null);
  }, []);

  // Pause playback
  const pause = useCallback(() => {
    if (engine === 'elevenlabs') {
      if (audioRef.current && speakingState === 'playing') {
        audioRef.current.pause();
        setSpeakingState('paused');
      }
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        if (speakingState === 'playing') {
          window.speechSynthesis.pause();
          setSpeakingState('paused');
        }
      }
    }
  }, [engine, speakingState]);

  // Resume playback
  const resume = useCallback(() => {
    if (engine === 'elevenlabs') {
      if (audioRef.current && speakingState === 'paused') {
        audioRef.current.play().catch((err) => console.warn('Resume error:', err));
        setSpeakingState('playing');
      }
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        if (speakingState === 'paused') {
          window.speechSynthesis.resume();
          setSpeakingState('playing');
        }
      }
    }
  }, [engine, speakingState]);

  // Speak via Browser Native Synthesis
  const speakBrowser = useCallback(
    (text) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      if (browserVoiceName && browserVoices.length > 0) {
        const chosen = browserVoices.find(
          (v) => v.name === browserVoiceName || v.voiceURI === browserVoiceName
        );
        if (chosen) utterance.voice = chosen;
      }

      utterance.rate = Math.max(0.5, Math.min(2.5, rate));
      utterance.pitch = Math.max(0.5, Math.min(1.5, pitch));
      utterance.volume = Math.max(0, Math.min(1, volume));

      utterance.onstart = () => setSpeakingState('playing');
      utterance.onpause = () => setSpeakingState('paused');
      utterance.onresume = () => setSpeakingState('playing');
      utterance.onend = () => {
        setSpeakingState('idle');
        setCurrentWordIndex(-1);
        setCurrentWordLength(0);
        utteranceRef.current = null;
      };
      utterance.onerror = (e) => {
        if (e.error === 'canceled' || e.error === 'interrupted') return;
        console.warn('SpeechSynthesis error:', e);
        setSpeakingState('idle');
        setCurrentWordIndex(-1);
      };

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const charIndex = event.charIndex;
          let len = event.charLength;
          if (!len || len === 0) {
            const bounds = getWordBoundsAt(text, charIndex);
            len = bounds.length;
          }
          setCurrentWordIndex(charIndex);
          setCurrentWordLength(len);
          if (onWordBoundary) onWordBoundary({ charIndex, length: len });
        }
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [browserVoiceName, browserVoices, rate, pitch, volume, onWordBoundary]
  );

  // Speak via ElevenLabs Neural Engine
  const speakElevenLabs = useCallback(
    async (text) => {
      stop();
      setSpeakingState('loading');
      setErrorMessage(null);
      currentTextRef.current = text;

      try {
        const data = await generateElevenLabsAudio({
          text,
          voiceId: elevenVoiceId,
          stability: elevenStability,
          similarityBoost: elevenSimilarityBoost,
          speed: rate,
          apiKey: elevenApiKey,
        });

        if (!data.audioBase64) {
          throw new Error('No audio returned by ElevenLabs.');
        }

        alignmentRef.current = data.alignment;

        const audio = audioRef.current || new Audio();
        audioRef.current = audio;
        audio.src = `data:audio/mp3;base64,${data.audioBase64}`;
        audio.volume = Math.max(0, Math.min(1, volume));

        // Time update handler for synchronized word highlighting
        audio.ontimeupdate = () => {
          const currentTime = audio.currentTime;
          const alignment = alignmentRef.current;

          if (alignment && alignment.character_start_times_seconds) {
            const starts = alignment.character_start_times_seconds;
            const ends = alignment.character_end_times_seconds;

            // Find matching character timestamp
            let charIdx = -1;
            for (let i = 0; i < starts.length; i++) {
              if (currentTime >= starts[i] && currentTime <= ends[i]) {
                charIdx = i;
                break;
              }
            }

            if (charIdx !== -1) {
              const bounds = getWordBoundsAt(text, charIdx);
              setCurrentWordIndex(bounds.start);
              setCurrentWordLength(bounds.length);
            }
          }
        };

        audio.onplay = () => setSpeakingState('playing');
        audio.onpause = () => {
          if (audio.currentTime < audio.duration) {
            setSpeakingState('paused');
          }
        };
        audio.onended = () => {
          setSpeakingState('idle');
          setCurrentWordIndex(-1);
          setCurrentWordLength(0);
          alignmentRef.current = null;
        };

        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setErrorMessage('Playback error. Falling back to browser voice.');
          speakBrowser(text);
        };

        await audio.play();
      } catch (err) {
        console.warn('ElevenLabs TTS failed, falling back to browser synthesis:', err);
        setErrorMessage(err.message || 'ElevenLabs failed. Switched to offline voice.');
        // Graceful fallback to browser speech synthesis
        speakBrowser(text);
      }
    },
    [
      stop,
      elevenVoiceId,
      elevenStability,
      elevenSimilarityBoost,
      rate,
      elevenApiKey,
      volume,
      speakBrowser,
    ]
  );

  // Main Speak Entrypoint
  const speak = useCallback(
    (text) => {
      if (!text || !text.trim()) return;
      setSpokenText(text);

      if (engine === 'elevenlabs') {
        speakElevenLabs(text);
      } else {
        stop();
        speakBrowser(text);
      }
    },
    [engine, speakElevenLabs, speakBrowser, stop]
  );

  return {
    isSupported,
    browserVoices,
    speakingState,
    currentWordIndex,
    currentWordLength,
    spokenText,
    errorMessage,
    speak,
    pause,
    resume,
    stop,
  };
}
