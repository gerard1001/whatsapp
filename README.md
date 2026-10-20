# @saltcorn/whatsapp

WhatsApp for Saltcorn: send text, templates and files from a WhatsApp
Business number, through Meta's
[WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api).

This is a data-layer module. It adds actions, and no UI of its own. It talks
to Meta directly - there is no reseller in between, so Meta's per-message
price is the only one you pay.

| You want to | Use |
| --- | --- |
| Reply to someone who messaged you in the last 24 hours | `whatsapp_send_text` |
| Start a conversation, or message anyone at any time | `whatsapp_send_template` |
| Send an image, PDF, audio clip or video | `whatsapp_send_media` |

## The 24-hour rule

WhatsApp only delivers free-form messages - text and media - within 24 hours
of the recipient's last message to you. Outside that window, and to anyone
who has never messaged you, only an **approved template** can be sent.
Create templates in WhatsApp Manager; approval usually takes minutes.

Meta charges per delivered template, by category (marketing, utility,
authentication) and the recipient's country. See
[Meta's pricing](https://developers.facebook.com/docs/whatsapp/pricing).

## Setup

1. In [Meta for Developers](https://developers.facebook.com/apps), create an
   app of type **Business** and add the **WhatsApp** product.
2. On **WhatsApp → API Setup**, copy the **Phone number ID**. It is a number
   of its own: not the phone number, and not the WhatsApp Business Account ID.
3. In **Business Settings → Users → System users**, create a system user,
   assign it the app and the WhatsApp account, and generate a token with the
   `whatsapp_business_messaging` permission and no expiry. The token shown on
   API Setup is temporary and stops working after 24 hours.
4. In Saltcorn, install the plugin and paste the token and phone number ID
   into its configuration.

Meta gives every new app a **test number**. It is free to use, but only sends
to up to five numbers you add under **API Setup → To**. A `hello_world`
template comes pre-approved, so it is the quickest first test. Add your own
number to send for real.

### Configuration

| Field | |
| --- | --- |
| Access token | The permanent system user token |
| Phone number ID | From API Setup |
| Default country code | Optional, digits only, e.g. `1`. Prefixed to recipients written as national numbers with a leading 0 |
| Graph API version | Default `v23.0`. Meta retires each version about two years after release |

## Actions

Every action takes a **To** expression: a phone number in any common form,
`+1 415 555 0100`, `0014155550100`, or a national number starting with 0
when a default country code is set. Expressions are JavaScript evaluated against the row, the same as in
Saltcorn's built-in actions.

Each action can store the message ID (`wamid…`) in a String column on the
row, under **Save message ID to**. In a workflow, **Result variable** receives
`{ id, wa_id }`.

### `whatsapp_send_text`

| Field | |
| --- | --- |
| Text | Up to 4096 characters. `` `Your order ${ref} has shipped` `` |
| Link preview | Show a preview of the first link |

### `whatsapp_send_template`

| Field | |
| --- | --- |
| Template name | As in WhatsApp Manager, e.g. `order_shipped` |
| Language | The approved language code, exactly: `en_US` and `en` are different templates |
| Body parameters | An array for numbered placeholders - `[name, ref]` fills `{{1}}` and `{{2}}` - or an object for named ones - `{customer: name}` fills `{{customer}}` |
| Components | Advanced. The full Cloud API [`components`](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates) array, for header, button or media parameters. Replaces Body parameters when set |

### `whatsapp_send_media`

| Field | |
| --- | --- |
| Media | A File field, a Saltcorn file path, a public `https` URL, or `{filename, mimetype, content}` |
| Send as | `auto` picks from the file type: JPEG and PNG as images, WebP as a sticker, video and audio as themselves, anything else as a document |
| Caption | Up to 1024 characters. Ignored for audio and stickers |

Saltcorn files are uploaded to Meta first, then sent; URLs are fetched by
Meta directly, so they must be publicly reachable. The user running the
action must be able to read the file.

WhatsApp's limits: images 5 MB, video and audio 16 MB, documents 100 MB.

## Sent is not delivered

An action succeeds when Meta accepts the message, not when it reaches the
phone. A number that is not on WhatsApp, or a template sent outside its
rules, can still fail afterwards; Meta reports that through a webhook, which
a later version of this plugin will receive.

## Errors

Errors carry Meta's own message, its error code, and what to change. Rate
limits (codes 4, 80007, 130429) and Meta outages are retried up to four times
with backoff. The codes you are most likely to meet:

| Code | Means |
| --- | --- |
| 190 | The token is invalid or expired - use a permanent system user token |
| 131030 | The recipient is not on the test number's allowed list |
| 131047 | Outside the 24-hour window - send a template |
| 132001 | No approved template with that name in that language |
| 132000 | Parameter count does not match the template |
| 133010 | The business number is not registered with the Cloud API |

## Development

```
npm test
```

Tests run against an in-memory fake of the Cloud API; nothing is sent.
