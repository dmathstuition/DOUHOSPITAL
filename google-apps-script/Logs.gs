/**
 * DOUHC Notification Engine — Logs.gs
 * Records each delivery attempt in notification_logs (append-only history).
 */
function logAttempt_(notificationId, attempt, status, provider, providerMessageId, response, errorMessage) {
  try {
    sbInsert_('notification_logs', {
      notification_id: notificationId,
      attempt: attempt,
      status: status,
      provider: provider || null,
      provider_message_id: providerMessageId || null,
      response: response || null,
      error_message: errorMessage || null
    });
  } catch (e) {
    Logger.log('Failed to write notification_log: ' + e);
  }
}
