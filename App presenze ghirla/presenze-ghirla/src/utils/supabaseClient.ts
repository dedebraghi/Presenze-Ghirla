import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gwqxkzgfedgasibjjfhz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UgMKjITrcfP5aKueG0qUOQ_L-8qh8wl';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
