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

The plugin needs two values from Meta: an **access token** and a **phone
number ID**. Meta's dashboard changes often. The labels below were checked
in October 2026.

### 1. Create the app

1. Go to [Meta for Developers](https://developers.facebook.com/) and log in.
2. Click **My Apps**, then **Create App**. The wizard has five steps:
   **App details**, **Use cases**, **Business**, **Requirements** and
   **Overview**.
3. **App details:** enter an app name and a contact email.
4. **Use cases:** choose one of these.
   - **Connect with customers through WhatsApp** (recommended). It is listed
     under **Featured** and **Business messaging**.
   - **Other**, at the bottom of the list, then the app type **Business**.
     Meta marks this path as going away soon. Once the app exists, click
     **Set up** next to **WhatsApp** in the product list.
5. **Business:** pick a business portfolio, or create one. WhatsApp needs one.
6. Go through **Requirements** and **Overview**, and create the app.

Meta then guides you through WhatsApp's own setup, under **WhatsApp** in the
app's menu. Follow it. The **Phone Number ID** you need is shown next to the
test number, under **WhatsApp → Step 1. Try it out**.

### 2. Create a token that lasts

The token from **Generate token** on Meta's WhatsApp setup pages expires
within about a day. For Saltcorn, create a system user token instead:

1. Open [Business settings](https://business.facebook.com/latest/settings)
   for the same business portfolio, and go to **Users → System users**.
2. Click **Add**, name the system user, and give it the **Admin** role.
3. Select the system user and click **Assign assets**. Give it **Full
   control** of your app (**Manage app**) and of your WhatsApp account
   (**Manage WhatsApp Business accounts**).
4. Click **Generate token**, choose your app, and tick `whatsapp_business_messaging`, `whatsapp_business_management`<!-- and `business_management` -->. <!-- If Meta asks for an expiry, choose **Never**. -->
5. Copy the token now. Meta does not show it again.

### 3. Configure the plugin

In Saltcorn, install the plugin and open its configuration.

| Value | Where to find it | How long it lasts | Put it in the plugin? |
| --- | --- | --- | --- |
| Phone number ID | **WhatsApp → Step 1. Try it out**, next to the test number | As long as the number | Yes, **Phone number ID** |
| System user token | Business settings → System users → **Generate token** | Until revoked, if set to never expire | Yes, **Access token** |
| Temporary access token | **WhatsApp → Step 1. Try it out** → **Generate token** | About a day | Only to try things out |
| WhatsApp Business Account ID | **WhatsApp → Step 1. Try it out**, next to the phone number ID | Permanent | No |
| App ID | Top of the app dashboard | Permanent | No |

The other two fields are optional:

| Field | |
| --- | --- |
| Default country code | Digits only, e.g. `1`. Added in front of recipients written as national numbers with a leading 0 |
| Graph API version | Default `v23.0`. Meta retires each version about two years after release |

The test number is free, and fine for development, but it only sends to the
recipients you add to its list. To message anyone else, add your own
business number under **WhatsApp → Step 2. Production setup**. Then put
that number's phone number ID in the plugin.

## Actions

Every action takes a **To** expression: a phone number in any common form,
`+1 415 555 0100`, `0014155550100`, or a national number starting with 0
when a default country code is set. Expressions are JavaScript evaluated
against the row, the same as in Saltcorn's built-in actions.

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

## Troubleshooting

Problems come from three places: the plugin, the app setup, and the business
account behind it. The first step is to work out which one it is.

### 1. Try Meta's own test

Send a message from the test number under **WhatsApp → Step 1. Try it
out**.

- **The test fails:** the problem is on Meta's side, in the app, the
  business account or the phone number. The plugin is not involved. Go to
  [Business account and phone number](#business-account-and-phone-number).
- **The test works but the plugin's sends don't:** check that the plugin's
  phone number ID and token match the ones on that page, then read the error
  below.

### 2. Read the error in Saltcorn

**The error has no code.** For example "the plugin is not configured", "is
a national number", or "produced no text". The plugin caught the problem
before sending, so nothing reached Meta. Fix the action or the plugin
configuration as the message says.

**The error has a code** (`code 190, trace …`). Meta refused the request,
and the message says what to change. These are usually app configuration
problems:

| Code | Means |
| --- | --- |
| 190 | The token is invalid or expired. Use a system user token |
| 10, 200 | The token lacks `whatsapp_business_messaging`, or has no access to this WhatsApp account |
| 100 | A wrong phone number ID, or a wrong template name or language |
| 131030 | The recipient is not on the test number's recipient list (**Manage phone number list**) |
| 131047 | More than 24 hours since the recipient last wrote. Send a template |
| 132001 | No approved template with that name in that language |
| 132000 | The number of parameters does not match the template |
| 133010 | The business number is not registered with the Cloud API |

Rate limits (codes 4, 80007, 130429) and Meta outages are retried
automatically, up to four times.

**Saltcorn says the message was sent, but it never arrives.** The action
succeeds when Meta accepts a message, not when it reaches the phone. Meta
reports later failures only through a webhook, and this version of the
plugin does not receive webhooks yet. If you have a webhook set up in the
app (**WhatsApp → Configuration**), the failure appears there under
`statuses[].errors`.

### Business account and phone number

If Meta's own test fails, or a webhook reports a failure that is not in the
table above, check these:

- **Account restrictions:** open
  [Business Support Home](https://business.facebook.com/business-support-home).
  It lists any restriction on the business portfolio or WhatsApp account,
  with a **Request review** option.
- **Business verification:** in Business settings → **Business info**, check
  **Business verification status**. Some Meta products need a verified
  business.
- **Phone number:** in WhatsApp Manager, check the number's status, its
  quality rating, and two-step verification.
- **Payment method:** in WhatsApp Manager, check that the WhatsApp account
  has a valid payment method.

Error **131031, "Business Account locked"**, means Meta has restricted the
WhatsApp Business Account. Meta's documentation lists two reasons: a
platform policy violation, or Meta being unable to verify data in the
request, such as the two-step verification PIN.

While testing this plugin, one business portfolio got 131031 on every
message, while a new portfolio with the same app setup worked. The cause was
not found. If one portfolio keeps failing after the checks above, trying
another is a quick way to tell whether the problem belongs to that
portfolio.

## Development

```
npm test
```

Tests run against an in-memory fake of the Cloud API; nothing is sent.
