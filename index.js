const Workflow = require("@saltcorn/data/models/workflow");
const Form = require("@saltcorn/data/models/form");
const { a, div, p, ol, li, strong, code } = require("@saltcorn/markup/tags");

const actions = require("./lib/actions");
const { DEFAULT_API_VERSION } = require("./lib/config");

const APPS_URL = "https://developers.facebook.com/apps";
const BUSINESS_URL = "https://business.facebook.com/settings/system-users";

/**
 * The Meta side of the setup.
 *
 * Returned as an array: Form renders an array blurb verbatim, where a single
 * string is wrapped in a <p>.
 */
const setupBlurb = () => [
  div(
    { class: "mb-3" },
    ol(
      li(
        "In ",
        a({ href: APPS_URL, target: "_blank" }, "Meta for Developers"),
        ", create an app of type ",
        strong("Business"),
        " and add the ",
        strong("WhatsApp"),
        " product to it.",
      ),
      li(
        "On ",
        strong("WhatsApp → API Setup"),
        ", copy the ",
        strong("Phone number ID"),
        ". It is a long number of its own - not the phone number, and not " +
          "the WhatsApp Business Account ID.",
      ),
      li(
        "In ",
        a({ href: BUSINESS_URL, target: "_blank" }, "Business Settings → System users"),
        ", create a system user, assign it the app and the WhatsApp account, " +
          "and generate a token with the ",
        code("whatsapp_business_messaging"),
        " permission that never expires. The temporary token on API Setup " +
          "stops working after 24 hours.",
      ),
      li(
        "Testing with Meta's test number? Add each recipient under ",
        strong("API Setup → To"),
        " first; it only sends to numbers on that list.",
      ),
    ),
    p(
      { class: "text-muted" },
      "Text and media are only delivered within 24 hours of the recipient's " +
        "last message to you. To start a conversation, send an approved " +
        "template.",
    ),
  ),
];

const configuration_workflow = () =>
  new Workflow({
    steps: [
      {
        name: "WhatsApp Cloud API",
        form: async () =>
          new Form({
            blurb: setupBlurb(),
            fields: [
              {
                name: "access_token",
                label: "Access token",
                sublabel: "A permanent system user token",
                type: "String",
                required: true,
                input_type: "password",
              },
              {
                name: "phone_number_id",
                label: "Phone number ID",
                sublabel: "From WhatsApp → API Setup",
                type: "String",
                required: true,
              },
              {
                name: "default_country_code",
                label: "Default country code",
                sublabel:
                  "Optional, digits only, e.g. 1. Lets recipients be " +
                  "written as national numbers starting with 0.",
                type: "String",
              },
              {
                name: "api_version",
                label: "Graph API version",
                sublabel:
                  "Meta retires each version about two years after release.",
                type: "String",
                required: true,
                default: DEFAULT_API_VERSION,
              },
            ],
          }),
      },
    ],
  });

const { _internal, ...exportedActions } = actions;

module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: "whatsapp",
  configuration_workflow,
  actions: () => exportedActions,
};
