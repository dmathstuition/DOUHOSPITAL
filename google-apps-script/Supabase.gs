/**
 * DOUHC Notification Engine — Supabase.gs
 * Thin PostgREST client using the service-role key (server-side only).
 */

function sb_headers_() {
  var c = CONFIG_();
  return {
    'apikey': c.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': 'Bearer ' + c.SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json'
  };
}

/** GET rows. `query` is a PostgREST query string, e.g. "select=*&status=eq.pending". */
function sbSelect_(table, query) {
  var c = CONFIG_();
  var url = c.SUPABASE_URL + '/rest/v1/' + table + '?' + (query || 'select=*');
  var res = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: sb_headers_(),
    muteHttpExceptions: true
  });
  return sb_parse_(res, 'select ' + table);
}

/** PATCH rows matching `match` (PostgREST filter string) with `patch` object. */
function sbUpdate_(table, match, patch) {
  var c = CONFIG_();
  var url = c.SUPABASE_URL + '/rest/v1/' + table + '?' + match;
  var res = UrlFetchApp.fetch(url, {
    method: 'patch',
    headers: Object.assign({ 'Prefer': 'return=representation' }, sb_headers_()),
    payload: JSON.stringify(patch),
    muteHttpExceptions: true
  });
  return sb_parse_(res, 'update ' + table);
}

/** INSERT one row. Returns inserted representation. */
function sbInsert_(table, row) {
  var c = CONFIG_();
  var url = c.SUPABASE_URL + '/rest/v1/' + table;
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: Object.assign({ 'Prefer': 'return=representation' }, sb_headers_()),
    payload: JSON.stringify(row),
    muteHttpExceptions: true
  });
  var code = res.getResponseCode();
  // 23505 duplicate is an acceptable idempotent outcome for dedupe inserts.
  if (code === 409) return { duplicate: true };
  return sb_parse_(res, 'insert ' + table);
}

function sb_parse_(res, ctx) {
  var code = res.getResponseCode();
  var text = res.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('Supabase ' + ctx + ' failed (' + code + '): ' + text);
  }
  try {
    return text ? JSON.parse(text) : [];
  } catch (e) {
    return [];
  }
}
