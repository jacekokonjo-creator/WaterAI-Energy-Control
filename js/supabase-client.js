// WaterAI Energy Control
// Klient Supabase v1.0.0 — połączenie z bazą, logowanie (Auth), profil (rola).
// Ładowane PO bibliotece supabase-js (CDN), PRZED modułami danych.
//
// Klucz poniżej to klucz PUBLICZNY (publishable) — z założenia jawny.
// Bezpieczeństwa danych pilnuje RLS w bazie (patrz supabase/schema.sql).

const WaterAISupabase = {
  URL: 'https://ysupfhzvfwnqrfmaqqoc.supabase.co',
  KEY: 'sb_publishable_5ATD7RaBq6BV2dargRt7sg_Imu7e0ln',

  client: null,
  profile: null,   // { id, full_name, role, client_id } zalogowanego użytkownika

  init() {
    if (!window.supabase || !window.supabase.createClient) {
      console.error('[WaterAISupabase] Biblioteka supabase-js nie załadowała się (CDN).');
      return;
    }
    this.client = window.supabase.createClient(this.URL, this.KEY);
  },

  // Czy jest zapamiętana sesja (użytkownik logował się wcześniej w tej przeglądarce)?
  async getSession() {
    if (!this.client) return null;
    const { data } = await this.client.auth.getSession();
    return (data && data.session) || null;
  },

  async signIn(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session;
  },

  async signOut() {
    if (this.client) await this.client.auth.signOut();
    this.profile = null;
  },

  // Profil (rola) zalogowanego użytkownika z tabeli `profiles`.
  async loadProfile() {
    const { data: u } = await this.client.auth.getUser();
    if (!u || !u.user) throw new Error('Brak zalogowanego użytkownika.');
    const { data, error } = await this.client
      .from('profiles').select('id, full_name, role, client_id')
      .eq('id', u.user.id).single();
    if (error) throw error;
    this.profile = data;
    return data;
  }
};

WaterAISupabase.init();
window.WaterAISupabase = WaterAISupabase;
