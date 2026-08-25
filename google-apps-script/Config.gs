/**
 * DOUHC Notification Engine — Config.gs
 *
 * Secrets are read from Script Properties (PropertiesService), never hard-coded.
 * Configure them once via File > Project properties > Script properties, or by
 * running `setupProperties_()` below after pasting values (then delete them).
 *
 * Required Script Properties:
 *   SUPABASE_URL               e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  (server-only; bypasses RLS — keep secret)
 *   TERMII_API_KEY
 *   TERMII_BASE_URL            e.g. https://api.ng.termii.com
 *   TERMII_SENDER_ID           e.g. DOUHC
 *   DOUHC_EMAIL                From/reply-to address for outbound mail
 */

function CONFIG_() {
  var props = PropertiesService.getScriptProperties();
  return {
    SUPABASE_URL: props.getProperty('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: props.getProperty('SUPABASE_SERVICE_ROLE_KEY'),
    TERMII_API_KEY: props.getProperty('TERMII_API_KEY'),
    TERMII_BASE_URL: props.getProperty('TERMII_BASE_URL') || 'https://api.ng.termii.com',
    TERMII_SENDER_ID: props.getProperty('TERMII_SENDER_ID') || 'DOUHC',
    DOUHC_EMAIL: props.getProperty('DOUHC_EMAIL') || Session.getEffectiveUser().getEmail(),
    // Tunables
    MAX_RETRIES: 3,
    BATCH_SIZE: 25,
    REMINDER_HOURS_BEFORE: 24,
    FOLLOW_UP_DAYS_AFTER: 2
  };
}

/** True when the SMS provider credentials are present. */
function isTermiiConfigured_() {
  var c = CONFIG_();
  return !!(c.TERMII_API_KEY && c.TERMII_BASE_URL && c.TERMII_SENDER_ID);
}

/** True when Supabase access is configured. */
function isSupabaseConfigured_() {
  var c = CONFIG_();
  return !!(c.SUPABASE_URL && c.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * One-time convenience to set properties. Paste values, run once, then REMOVE
 * the values from this function. Prefer the Project properties UI in practice.
 */
function setupProperties_() {
  // PropertiesService.getScriptProperties().setProperties({
  //   SUPABASE_URL: '',
  //   SUPABASE_SERVICE_ROLE_KEY: '',
  //   TERMII_API_KEY: '',
  //   TERMII_BASE_URL: 'https://api.ng.termii.com',
  //   TERMII_SENDER_ID: 'DOUHC',
  //   DOUHC_EMAIL: ''
  // });
  throw new Error('Edit setupProperties_() before running, or use Project properties UI.');
}
