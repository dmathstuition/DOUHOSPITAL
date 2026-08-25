/**
 * DOUHC Notification Engine — Appointments.gs
 * Shared helpers for querying appointments with related patient/doctor/department
 * data and formatting message variables.
 */

/** yyyy-MM-dd for `offsetDays` from today, in the health center timezone. */
function dateOffsetISO_(offsetDays) {
  var d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return Utilities.formatDate(d, 'Africa/Lagos', 'yyyy-MM-dd');
}

/** Embed query returning appointments with names/phones for messaging. */
function fetchAppointments_(filter) {
  var select =
    'select=id,appointment_date,start_time,status,reminder_sent,follow_up_sent,' +
    'patients(id,first_name,last_name,phone,email),' +
    'doctors(full_name),' +
    'departments(name)';
  return sbSelect_('appointments', select + '&' + filter);
}

function apptVars_(a) {
  var p = a.patients || {};
  return {
    patientId: p.id || null,
    name: [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Patient',
    phone: p.phone || null,
    email: p.email || null,
    date: a.appointment_date,
    time: (a.start_time || '').slice(0, 5),
    doctor: (a.doctors && a.doctors.full_name) || 'Doctor',
    department: (a.departments && a.departments.name) || 'Clinic'
  };
}

/** Insert a notification row idempotently via dedupe_key. */
function enqueueNotification_(row) {
  return sbInsert_('notifications', row);
}
