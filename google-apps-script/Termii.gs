/**
 * DOUHC Notification Engine — Termii.gs
 * Nigerian SMS via Termii. Endpoint/shape must be verified against current docs:
 *   https://developers.termii.com/
 *
 * When Termii is NOT configured, this logs the message and returns a clearly
 * marked mock result — it never pretends the SMS was actually delivered.
 */

/**
 * Send an SMS. Returns { ok, providerMessageId, mock, error }.
 * @param {string} to  E.164 phone, e.g. +2348012345678
 * @param {string} message
 */
function termiiSendSMS_(to, message) {
  var c = CONFIG_();

  if (!isTermiiConfigured_()) {
    Logger.log('[TERMII MOCK] SMS to %s: %s', to, message);
    return { ok: false, mock: true, error: 'Termii not configured (message logged, not sent)' };
  }

  var url = c.TERMII_BASE_URL + '/api/sms/send';
  var payload = {
    to: to,
    from: c.TERMII_SENDER_ID,
    sms: message,
    type: 'plain',
    channel: 'generic',
    api_key: c.TERMII_API_KEY
  };

  try {
    var res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    var body = {};
    try { body = JSON.parse(res.getContentText()); } catch (e) {}

    if (code >= 200 && code < 300) {
      return { ok: true, providerMessageId: body.message_id || body.messageId || null, raw: body };
    }
    return { ok: false, error: 'Termii HTTP ' + code + ': ' + res.getContentText(), raw: body };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
