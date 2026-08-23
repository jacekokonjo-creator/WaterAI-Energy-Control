// ─────────────────────────────────────────────────────────────────────────
// translate-note — Supabase Edge Function (Deno)
//
// Tłumaczy maszynowo swobodny tekst analityka (uwagi do protokołu TYM, notatki
// okresu bazowego) na język interfejsu. Klucz API dostawcy NIE może trafić do
// przeglądarki — stąd funkcja serwerowa.
//
// Wejście  (POST, JSON): { text: string, lang: 'en'|'de'|'cs'|'sk'|'es'|'at' }
// Wyjście  (JSON):       { translated: string, cached: boolean, provider: string }
//
// Dostawca: DeepL, jeśli ustawiony DEEPL_API_KEY (lepszy dla PL→CS/SK i terminów
// technicznych), w przeciwnym razie Anthropic. Wynik ląduje w note_translations,
// więc drugi odczyt tego samego opisu nic nie kosztuje.
//
// Sekrety (supabase secrets set …):
//   DEEPL_API_KEY        — opcjonalny
//   ANTHROPIC_API_KEY    — opcjonalny (wymagany, gdy brak DeepL)
//   ANTHROPIC_MODEL      — opcjonalny, domyślnie claude-sonnet-5
// SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY wstrzykuje platforma.
//
// Deploy:  supabase functions deploy translate-note
// ─────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LANGS: Record<string, { deepl: string; name: string }> = {
  en: { deepl: 'EN-GB', name: 'English' },
  de: { deepl: 'DE', name: 'German' },
  at: { deepl: 'DE', name: 'German (Austrian usage)' },
  cs: { deepl: 'CS', name: 'Czech' },
  sk: { deepl: 'SK', name: 'Slovak' },
  es: { deepl: 'ES', name: 'Spanish' },
};

const MAX_CHARS = 20000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function viaDeepL(text: string, lang: string, key: string): Promise<string> {
  // Klucze darmowego planu kończą się na ':fx' i mają inny host.
  const host = key.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
  const body = new URLSearchParams({
    text,
    source_lang: 'PL',
    target_lang: LANGS[lang].deepl,
    preserve_formatting: '1',
    formality: 'prefer_more',
  });
  const r = await fetch(host + '/v2/translate', {
    method: 'POST',
    headers: {
      Authorization: 'DeepL-Auth-Key ' + key,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!r.ok) throw new Error('DeepL ' + r.status + ': ' + (await r.text()).slice(0, 300));
  const d = await r.json();
  const out = d?.translations?.[0]?.text;
  if (!out) throw new Error('DeepL: pusta odpowiedź.');
  return out;
}

async function viaAnthropic(text: string, lang: string, key: string): Promise<string> {
  const model = Deno.env.get('ANTHROPIC_MODEL') || 'claude-sonnet-5';
  const system =
    'You translate technical documentation for an ESCO energy-savings settlement system ' +
    'from Polish into ' + LANGS[lang].name + '. Rules: preserve every number, unit, date and ' +
    'formula exactly as written; keep paragraph and line breaks; use established energy-engineering ' +
    'terminology (degree days, domestic hot water, space heating, baseline period); do not add, ' +
    'omit or comment on anything. Reply with the translation only.';
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      system,
      messages: [{ role: 'user', content: text }],
    }),
  });
  if (!r.ok) throw new Error('Anthropic ' + r.status + ': ' + (await r.text()).slice(0, 300));
  const d = await r.json();
  const out = (d?.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim();
  if (!out) throw new Error('Anthropic: pusta odpowiedź.');
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Tylko POST.' }, 405);

  try {
    const { text, lang } = await req.json();
    const src = String(text ?? '').trim();

    if (!src) return json({ translated: '', cached: true, provider: 'none' });
    if (!LANGS[lang]) return json({ error: 'Nieobsługiwany język: ' + lang }, 400);
    if (src.length > MAX_CHARS) return json({ error: 'Tekst dłuższy niż ' + MAX_CHARS + ' znaków.' }, 413);

    const hash = (await sha256(src)) + ':' + lang;

    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: hit } = await db
      .from('note_translations').select('translated, provider').eq('hash', hash).maybeSingle();
    if (hit) return json({ translated: hit.translated, cached: true, provider: hit.provider || '' });

    const deepl = Deno.env.get('DEEPL_API_KEY');
    const anthropic = Deno.env.get('ANTHROPIC_API_KEY');
    let translated: string, provider: string;

    if (deepl) { translated = await viaDeepL(src, lang, deepl); provider = 'deepl'; }
    else if (anthropic) { translated = await viaAnthropic(src, lang, anthropic); provider = 'anthropic'; }
    else return json({ error: 'Brak klucza dostawcy (DEEPL_API_KEY / ANTHROPIC_API_KEY).' }, 500);

    // Zapis cache nie może wywrócić odpowiedzi — tłumaczenie już mamy.
    const { error: insErr } = await db
      .from('note_translations').insert({ hash, lang, source: src, translated, provider });
    if (insErr) console.warn('[translate-note] Cache nie zapisany:', insErr.message);

    return json({ translated, cached: false, provider });
  } catch (e) {
    console.error('[translate-note]', e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
