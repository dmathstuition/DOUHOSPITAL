/**
 * DOUHC Notification Engine — Code.gs (entry points & triggers)
 *
 * Time-driven triggers:
 *   - processNotificationQueue   every 15 minutes
 *   - processAppointmentReminders  daily
 *   - processFollowUps             daily
 *
 * All jobs are idempotent (see Notifications/Reminders/FollowUps), so a trigger
 * firing more than once never causes duplicate messages.
 */

/** Install (or reinstall) all time-driven triggers. Run once after setup. */
function installTriggers() {
  // Remove existing triggers owned by this project to avoid duplicates.
  ScriptApp.getProjectTriggers().forEach(function (t) {
    ScriptApp.deleteTrigger(t);
  });

  ScriptApp.newTrigger('processNotificationQueue')
    .timeBased().everyMinutes(15).create();

  ScriptApp.newTrigger('processAppointmentReminders')
    .timeBased().everyDays(1).atHour(7).create();

  ScriptApp.newTrigger('processFollowUps')
    .timeBased().everyDays(1).atHour(9).create();

  Logger.log('Triggers installed.');
}

/** Manual run of the full cycle — useful for testing from the editor. */
function runAll() {
  processAppointmentReminders();
  processFollowUps();
  processNotificationQueue();
}

/** Health check: verifies Supabase connectivity and config presence. */
function healthCheck() {
  Logger.log('Supabase configured: %s', isSupabaseConfigured_());
  Logger.log('Termii configured: %s', isTermiiConfigured_());
  if (isSupabaseConfigured_()) {
    var rows = sbSelect_('system_settings', 'select=key&limit=1');
    Logger.log('Supabase reachable, sample rows: %s', JSON.stringify(rows));
  }
}

/**
 * Secured webhook so the web app can nudge the engine to process the queue
 * immediately (e.g. right after an appointment is booked). Authenticated with a
 * shared secret stored in Script Property CRON_SECRET. Without a valid secret
 * the request is rejected — this is NOT an open SMS endpoint.
 */
function doPost(e) {
  var expected = PropertiesService.getScriptProperties().getProperty('CRON_SECRET');
  var provided = e && e.parameter && e.parameter.secret;
  // Also accept a header-style body field.
  if (!provided && e && e.postData && e.postData.contents) {
    try { provided = JSON.parse(e.postData.contents).secret; } catch (err) {}
  }

  if (!expected || provided !== expected) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  processNotificationQueue();
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
