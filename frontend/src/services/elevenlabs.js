// Pre-configured curated ElevenLabs voices
export const CURATED_ELEVENLABS_VOICES = [
  { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'premade', description: 'Calm, Warm & Soothing (American)' },
  { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', category: 'premade', description: 'Deep, Clear & Engaging Narrator' },
  { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'premade', description: 'Well-Rounded & Friendly' },
  { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', category: 'premade', description: 'Expressive & Gentle' },
  { voice_id: 'MF3mGyEYCl7XYWbN9VBM', name: 'Elli', category: 'premade', description: 'Young, Bright & Clear' },
  { voice_id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', category: 'premade', description: 'Natural, Conversational & Warm' },
  { voice_id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', category: 'premade', description: 'Dynamic, Confident Reader' },
  { voice_id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', category: 'premade', description: 'Casual, Australian Accent' },
  { voice_id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', category: 'premade', description: 'Warm British Narrator' },
];

/**
 * Check if ElevenLabs is configured in backend
 */
export async function checkElevenLabsStatus() {
  try {
    const res = await fetch('/api/tts/elevenlabs/status');
    if (!res.ok) return { configured: false };
    return await res.json();
  } catch (e) {
    console.warn('ElevenLabs status check failed:', e);
    return { configured: false };
  }
}

/**
 * Fetch available voices from ElevenLabs API
 */
export async function fetchElevenLabsVoices(apiKey = '') {
  try {
    const headers = {};
    if (apiKey) headers['x-api-key'] = apiKey.trim();

    const res = await fetch('/api/tts/elevenlabs/voices', { headers });
    if (!res.ok) return CURATED_ELEVENLABS_VOICES;

    const data = await res.json();
    return data.voices && data.voices.length > 0 ? data.voices : CURATED_ELEVENLABS_VOICES;
  } catch (e) {
    console.warn('Failed to fetch ElevenLabs voices:', e);
    return CURATED_ELEVENLABS_VOICES;
  }
}

/**
 * Request synthesized speech from ElevenLabs
 */
export async function generateElevenLabsAudio({
  text,
  voiceId = '21m00Tcm4TlvDq8ikWAM',
  stability = 0.5,
  similarityBoost = 0.75,
  speed = 1.0,
  apiKey = '',
}) {
  const res = await fetch('/api/tts/elevenlabs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voiceId,
      stability,
      similarityBoost,
      speed,
      apiKey: apiKey ? apiKey.trim() : undefined,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `ElevenLabs synthesis failed (${res.status})`);
  }

  return await res.json();
}
