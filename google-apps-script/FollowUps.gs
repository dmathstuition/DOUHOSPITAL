/**
 * DOUHC Notification Engine — FollowUps.gs
 * Enqueues a 2-day post-visit follow-up SMS exactly once per completed visit.
 *
 * Runs daily. Finds appointments completed 2 days ago that have not had a
 * follow-up, enqueues an SMS (dedupe_key = "followup:<id>"), and marks
 * follow_up_sent.
 */
function processFollowUps() {
  if (!isSupabaseConfigured_()) { Logger.log('Supabase not configured.'); return; }

  var twoDaysAgo = dateOffsetISO_(-CONFIG_().FOLLOW_UP_DAYS_AFTER);
  var filter =
    'appointment_date=eq.' + twoDaysAgo +
    '&status=eq.completed' +
    '&follow_up_sent=is.false';

  var appts = fetchAppointments_(filter);
  Logger.log('Follow-ups: %s completed appointment(s) for %s', appts.length, twoDaysAgo);

  appts.forEach(function (a) {
    var v = apptVars_(a);
    if (!v.phone) { return; }

    var message =
      'Hello ' + v.name + ', this is DOUHC. How are you feeling? ' +
      'Please reply if you need a follow-up.';

    enqueueNotification_({
      patient_id: v.patientId,
      appointment_id: a.id,
      channel: 'sms',
      notification_type: 'follow_up',
      recipient: v.phone,
      message: message,
      status: 'pending',
      scheduled_at: new Date().toISOString(),
      dedupe_key: 'followup:' + a.id
    });

    sbUpdate_('appointments', 'id=eq.' + a.id, { follow_up_sent: true });
  });
}
