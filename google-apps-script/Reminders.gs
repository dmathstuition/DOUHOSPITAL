/**
 * DOUHC Notification Engine — Reminders.gs
 * Enqueues 24-hour appointment reminders exactly once per appointment.
 *
 * Runs daily. Finds tomorrow's active appointments that have not been reminded,
 * enqueues an SMS (dedupe_key = "reminder:<id>"), and marks reminder_sent so it
 * is never enqueued again — idempotent even if the trigger fires twice.
 */
function processAppointmentReminders() {
  if (!isSupabaseConfigured_()) { Logger.log('Supabase not configured.'); return; }

  var tomorrow = dateOffsetISO_(1);
  var filter =
    'appointment_date=eq.' + tomorrow +
    '&reminder_sent=is.false' +
    '&status=in.(pending,confirmed)';

  var appts = fetchAppointments_(filter);
  Logger.log('Reminders: %s appointment(s) for %s', appts.length, tomorrow);

  appts.forEach(function (a) {
    var v = apptVars_(a);
    if (!v.phone) { return; } // cannot SMS without a phone

    var message =
      'Hello ' + v.name + ', reminder: Your appointment at DOUHC ' + v.department +
      ' with Dr ' + v.doctor + ' is tomorrow ' + v.date + ' ' + v.time + '.';

    enqueueNotification_({
      patient_id: v.patientId,
      appointment_id: a.id,
      channel: 'sms',
      notification_type: 'appointment_reminder',
      recipient: v.phone,
      message: message,
      status: 'pending',
      scheduled_at: new Date().toISOString(),
      dedupe_key: 'reminder:' + a.id
    });

    // Mark the appointment so we never enqueue a second reminder.
    sbUpdate_('appointments', 'id=eq.' + a.id, { reminder_sent: true });
  });
}
