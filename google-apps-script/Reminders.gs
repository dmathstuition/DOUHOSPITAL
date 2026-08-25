/**
 * DOUHC Notification Engine — Reminders.gs
 * Enqueues appointment reminders at TWO lead times: 2 days before and 1 day
 * before. Each (appointment, lead-time) pair is enqueued at most once thanks to
 * a distinct dedupe_key protected by a unique index — idempotent even if the
 * daily trigger runs more than once.
 *
 * Runs daily. Finds active appointments dated 2 days out and 1 day out.
 */
function processAppointmentReminders() {
  if (!isSupabaseConfigured_()) { Logger.log('Supabase not configured.'); return; }

  // [offsetDays, dedupe-suffix, human phrase]
  var LEADS = [
    [2, '2d', 'in 2 days'],
    [1, '1d', 'tomorrow']
  ];

  LEADS.forEach(function (lead) {
    var offset = lead[0];
    var suffix = lead[1];
    var phrase = lead[2];
    var date = dateOffsetISO_(offset);

    var filter =
      'appointment_date=eq.' + date +
      '&status=in.(pending,confirmed)';
    var appts = fetchAppointments_(filter);
    Logger.log('Reminders (%s): %s appointment(s) for %s', suffix, appts.length, date);

    appts.forEach(function (a) {
      var v = apptVars_(a);
      if (!v.phone) { return; }

      var message =
        'Hello ' + v.name + ', reminder: Your appointment at DOUHC ' + v.department +
        ' with Dr ' + v.doctor + ' is ' + phrase + ' (' + v.date + ' ' + v.time + ').';

      enqueueNotification_({
        patient_id: v.patientId,
        appointment_id: a.id,
        channel: 'sms',
        notification_type: 'appointment_reminder',
        recipient: v.phone,
        message: message,
        status: 'pending',
        scheduled_at: new Date().toISOString(),
        dedupe_key: 'reminder:' + suffix + ':' + a.id
      });
    });
  });

  // Mark appointments whose reminders have all been enqueued (best-effort flag
  // for reporting; idempotency is guaranteed by the dedupe keys above).
  var tomorrow = dateOffsetISO_(1);
  var due = fetchAppointments_(
    'appointment_date=eq.' + tomorrow + '&reminder_sent=is.false&status=in.(pending,confirmed)'
  );
  due.forEach(function (a) {
    sbUpdate_('appointments', 'id=eq.' + a.id, { reminder_sent: true });
  });
}
