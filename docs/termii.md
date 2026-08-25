# DOUHC — Termii SMS

Nigerian SMS is sent through [Termii](https://developers.termii.com/) from the
Google Apps Script engine. Termii credentials never touch the web frontend.

## Configuration (Script Properties in Apps Script)

```
TERMII_API_KEY    = <your key>
TERMII_BASE_URL   = https://api.ng.termii.com
TERMII_SENDER_ID  = DOUHC        # must be an approved sender ID
```

## Endpoint

`Termii.gs` posts to `${TERMII_BASE_URL}/api/sms/send` with:

```json
{
  "to": "+2348012345678",
  "from": "DOUHC",
  "sms": "message text",
  "type": "plain",
  "channel": "generic",
  "api_key": "<key>"
}
```

> **Verify the exact endpoint, channel and payload against the current Termii
> docs during implementation** — Termii's API evolves and sender-ID/channel
> rules vary by account. Do not rely on outdated examples.

## Phone numbers

All numbers are normalized to E.164 `+234XXXXXXXXXX` before sending. The web app
uses `src/lib/utils/phone.ts` (`normalizeNigerianPhone`, `isValidNigerianPhone`)
and the `patients_phone_e164` DB check constraint enforces the shape at rest.

Accepted inputs: `08012345678`, `07012345678`, `08123456789`, `+2348012345678`.

## Development mode

When `TERMII_API_KEY` is absent, `termiiSendSMS_()` logs the message and returns
`{ ok:false, mock:true }`. The notification is **not** marked as sent — the
system never pretends an SMS was delivered.
