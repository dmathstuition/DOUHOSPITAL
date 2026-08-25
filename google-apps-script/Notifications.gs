/**
 * DOUHC Notification Engine — Notifications.gs
 * Drains the `notifications` queue: claims due, pending rows, sends them via the
 * appropriate channel, records the result, and retries failures up to MAX_RETRIES.
 *
 * IDEMPOTENCY: a row is "claimed" by conditionally flipping status
 * pending -> processing (matching on the current status). Only the invocation
 * whose PATCH returns the row proceeds to send it, so a trigger firing twice
 * never double-sends.
 */
function processNotificationQueue() {
  if (!isSupabaseConfigured_()) {
    Logger.log('Supabase not configured — skipping queue processing.');
    return;
  }
  var c = CONFIG_();
  var nowIso = new Date().toISOString();

  var query =
    'select=*' +
    '&status=eq.pending' +
    '&scheduled_at=lte.' + encodeURIComponent(nowIso) +
    '&order=scheduled_at.asc' +
    '&limit=' + c.BATCH_SIZE;

  var pending = sbSelect_('notifications', query);
  Logger.log('Found %s pending notification(s).', pending.length);

  pending.forEach(function (n) {
    // Claim the row (pending -> processing). If another run claimed it, skip.
    var claimed = sbUpdate_(
      'notifications',
      'id=eq.' + n.id + '&status=eq.pending',
      { status: 'processing' }
    );
    if (!claimed || claimed.length === 0) return;

    sendOneNotification_(n);
  });
}

function sendOneNotification_(n) {
  var attempt = (n.retry_count || 0) + 1;
  var result;
  var provider;

  if (n.channel === 'sms') {
    provider = 'termii';
    result = termiiSendSMS_(n.recipient, n.message || '');
  } else {
    provider = 'mailapp';
    result = emailSend_(n.recipient, n.subject, n.message || '');
  }

  if (result.ok) {
    sbUpdate_('notifications', 'id=eq.' + n.id, {
      status: 'sent',
      sent_at: new Date().toISOString(),
      provider: provider,
      provider_message_id: result.providerMessageId || null,
      retry_count: attempt,
      error_message: null
    });
    logAttempt_(n.id, attempt, 'sent', provider, result.providerMessageId, result.raw || null, null);
  } else {
    var exhausted = attempt >= CONFIG_().MAX_RETRIES;
    sbUpdate_('notifications', 'id=eq.' + n.id, {
      status: exhausted ? 'failed' : 'pending', // pending -> retried next run
      retry_count: attempt,
      provider: provider,
      error_message: result.error || 'unknown error'
    });
    logAttempt_(n.id, attempt, exhausted ? 'failed' : 'pending', provider, null, result.raw || null, result.error);
  }
}
