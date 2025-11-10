// Avoid referencing undeclared globals; use Vite's import.meta.env
const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
console.log('VITE_SUPABASE_URL:', VITE_SUPABASE_URL);
