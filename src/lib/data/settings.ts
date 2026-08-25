import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type SettingsMap = Record<string, Record<string, unknown>>;

/** Load all system settings as a { key: value } map. */
export async function getSettings(): Promise<SettingsMap> {
  const supabase = await createClient();
  const { data } = await supabase.from('system_settings').select('key, value');
  const map: SettingsMap = {};
  for (const row of data ?? []) {
    map[row.key] = (row.value as Record<string, unknown>) ?? {};
  }
  return map;
}
