import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wwucatnjiaglqsyvazyk.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3dWNhdG5qaWFnbHFzeXZhenlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTc5MDUsImV4cCI6MjA2ODg3MzkwNX0.jLKaV3fU9iOEHWFiLdpCCkXHsJRw2BYF5uHfGVE2Dkc';

export const supabase = createClient(supabaseUrl, supabaseKey);
