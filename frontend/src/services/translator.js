/**
 * ReadEase Translation Bridge Service
 */
export async function translateText(text, targetLang) {
  if (!text || !text.trim()) return '';

  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: text.trim(),
      targetLang,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Translation failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.translatedText;
}
