import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('ERRO: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontrados no arquivo .env!');
}

// Ensure the client doesn't crash on import if variables are missing, 
// using a placeholder that will fail gracefully on actual calls rather than on startup.
export const supabase = createClient(
    supabaseUrl || 'https://missing-url.supabase.co',
    supabaseAnonKey || 'missing-key'
);


