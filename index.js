const Workflow = require("@saltcorn/data/models/workflow");
const Form = require("@saltcorn/data/models/form");
const { a, div, p, ol, li, strong, code } = require("@saltcorn/markup/tags");

const actions = require("./lib/actions");
const { DEFAULT_API_VERSION } = require("./lib/config");

const DEVELOPERS_URL = "https://developers.facebook.com/";
const BUSINESS_SETTINGS_URL = "https://business.facebook.com/latest/settings";

/**
 * The Meta side of the setup, short enough to follow beside the form. The
 * README has the long version and the troubleshooting.
 *
 * Returned as an array: Form renders an array blurb verbatim, where a single
 * string is wrapped in a <p>.
 */
const setupBlurb = () => [
  div(
    { class: "mb-3" },
    p("This plugin needs two values from Meta: a phone number ID and an access token."),
    ol(
      li(
        "On ",
        a({ href: DEVELOPERS_URL, target: "_blank" }, "Meta for Developers"),
        ", go to ",
        strong("My Apps → Create App"),
        ". Under ",
        strong("Use cases"),
        ", choose ",
        strong("Connect with customers through WhatsApp"),
        " (recommended). Another option is ",
        strong("Other"),
        " with the app type ",
        strong("Business"),
        ", then ",
        strong("Set up"),
        " on WhatsApp. Either way, pick or create a business portfolio.",
      ),
      li(
        "Follow the WhatsApp setup Meta shows in the app. Copy the ",
        strong("Phone Number ID"),
        " shown next to the test number under ",
        strong("WhatsApp → Step 1. Try it out"),
        ".",
      ),
      li(
        "In ",
        a({ href: BUSINESS_SETTINGS_URL, target: "_blank" }, "Business settings"),
        ", go to ",
        strong("Users → System users"),
        ". Add a system user. Under ",
        strong("Assign assets"),
        ", give it full control of the app and the WhatsApp account. Then click ",
        strong("Generate token"),
        " with ",
        code("whatsapp_business_messaging"),
        " and ",
        code("whatsapp_business_management"),
        ", and choose an expiry of ",
        strong("Never"),
        ". The token from ",
        strong("Generate token"),
        " on the WhatsApp setup pages expires within about a day.",
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
                sublabel:
                  "The system user token. The one from the WhatsApp setup " +
                  "pages expires within about a day.",
                type: "String",
                required: true,
                input_type: "password",
              },
              {
                name: "phone_number_id",
                label: "Phone number ID",
                sublabel:
                  "From WhatsApp → Step 1. Try it out, next to the test " +
                  "number. It is not the phone number itself.",
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
