/**
 * DOUHC Notification Engine — Email.gs
 * Sends email via MailApp today. The web app's NotificationService is
 * provider-independent, so email delivery can later move to Resend without any
 * change to how notifications are queued.
 *
 * Returns { ok, error }.
 */
function emailSend_(to, subject, body) {
  var c = CONFIG_();
  try {
    MailApp.sendEmail({
      to: to,
      subject: subject || 'DOUHC Notification',
      body: body || '',
      name: 'Dennis Osadebay University Health Center',
      replyTo: c.DOUHC_EMAIL
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
