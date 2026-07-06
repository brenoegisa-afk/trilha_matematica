import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('ERRO: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontrados no arquivo .env!');
    // Failing explicitly as requested in Phase 1
    throw new Error('Configuração de ambiente ausente. Verifique o arquivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


