/**
 * Whether public Supabase configuration is present. Public marketing pages use
 * this to decide between live data and graceful placeholders, so the site
 * always renders even before the backend is provisioned.
 */
export function isSupabaseConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
