/**
 * ReadEase Backend Server
 * Express API supporting ElevenLabs Text-to-Speech with alignment timestamps
 * and Cohere AI-powered text simplification and multilingual translation.
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

// Middleware: CORS & JSON body parsing
app.use(cors({ origin: true, credentials: true }));
app.options('*', cors());
app.use(express.json());

// Curated high-quality ElevenLabs voices
const CURATED_VOICES = [
  { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Calm & Warm' },
  { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'Deep Narrator' },
  { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'Friendly' },
  { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', description: 'Expressive' },
  { voice_id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', description: 'Natural' },
  { voice_id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', description: 'Dynamic' },
  { voice_id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'British Narrator' },
];

/**
 * 1. Health Check
 */
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ReadEase API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * 2. ElevenLabs Configuration Status
 */
app.get('/api/tts/elevenlabs/status', (req, res) => {
  const isKeyAvailable = Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim());
  res.json({ configured: isKeyAvailable });
});

/**
 * 3. ElevenLabs Voices Directory
 */
app.get('/api/tts/elevenlabs/voices', async (req, res) => {
  const apiKey = (req.headers['x-api-key'] || process.env.ELEVENLABS_API_KEY || '').trim();

  if (!apiKey) {
    return res.json({ voices: CURATED_VOICES, source: 'curated' });
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok) {
      return res.json({ voices: CURATED_VOICES, source: 'curated' });
    }

    const data = await response.json();
    const formatted = (data.voices || []).map((v) => ({
      voice_id: v.voice_id,
      name: v.name,
      description: v.labels?.accent ? `${v.labels.accent}` : v.description || 'AI Voice',
    }));

    res.json({ voices: formatted.length > 0 ? formatted : CURATED_VOICES, source: 'elevenlabs' });
  } catch (error) {
    res.json({ voices: CURATED_VOICES, source: 'curated' });
  }
});

/**
 * 4. ElevenLabs Text-to-Speech (with Millisecond Word Alignments)
 */
app.post('/api/tts/elevenlabs', async (req, res) => {
  try {
    const { text, voiceId = '21m00Tcm4TlvDq8ikWAM', speed = 1.0, apiKey: clientKey } = req.body;
    const apiKey = (clientKey || process.env.ELEVENLABS_API_KEY || '').trim();

    if (!apiKey) {
      return res.status(400).json({ error: 'Missing ElevenLabs API key. Please check server .env' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text cannot be empty.' });
    }

    const payload = {
      text: text.trim(),
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        speed: Number(speed) || 1.0,
      },
    };

    // Primary: Request with character/word alignments
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({
        audioBase64: data.audio_base64,
        alignment: data.alignment,
      });
    }

    // Fallback: Standard audio-only stream
    const fallbackResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!fallbackResponse.ok) {
      const errText = await fallbackResponse.text();
      return res.status(fallbackResponse.status).json({ error: errText });
    }

    const rawData =
      typeof fallbackResponse.arrayBuffer === 'function'
        ? await fallbackResponse.arrayBuffer()
        : await fallbackResponse.buffer();
    const buffer = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData);

    res.json({
      audioBase64: buffer.toString('base64'),
      alignment: null,
    });
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 5. Cohere AI Translation Endpoint
 */
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLang = 'Hindi', language } = req.body;
    const apiKey = (process.env.COHERE_API_KEY || '').trim();

    if (!apiKey) {
      return res.status(400).json({ error: 'COHERE_API_KEY is not configured in server .env' });
    }

    const target = language || targetLang || 'Hindi';
    const langMap = {
      hi: 'Hindi',
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
    };
    const languageName = langMap[target] || target;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text cannot be empty.' });
    }

    const response = await fetch('https://api.cohere.ai/v2/chat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command-r-plus-08-2024',
        messages: [
          {
            role: 'user',
            content: `Translate the following text into ${languageName}. Maintain the exact paragraph formatting and meaning accurately. Output ONLY the translated text without any explanation, prefix, or quotes:\n\n${text.trim()}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const translatedText = data.message?.content?.[0]?.text?.trim() || '';

    // Compatible with both { text } and { translatedText }
    res.json({
      text: translatedText,
      translatedText,
      targetLang: languageName,
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 6. Cohere AI Text Simplification / Rewriting
 */
app.post('/api/modify', async (req, res) => {
  try {
    const { text, prompt } = req.body;
    const apiKey = (process.env.COHERE_API_KEY || '').trim();

    if (!apiKey) {
      return res.status(400).json({ error: 'COHERE_API_KEY is not configured in server .env' });
    }

    const userPrompt = prompt
      ? prompt.replace('{{text}}', text || '')
      : `Rewrite the following text to be simpler, clearer, and easier to understand. Output ONLY the simplified text:\n\n${text}`;

    const response = await fetch('https://api.cohere.ai/v2/chat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command-r-plus-08-2024',
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const result = data.message?.content?.[0]?.text?.trim() || '';

    res.json({ text: result });
  } catch (error) {
    console.error('Modification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Launch Express server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`ReadEase backend server running on http://localhost:${PORT}`);
});