const { getState } = require("@saltcorn/data/db/state");

const PLUGIN_NAME = "whatsapp";
const NPM_NAME = "@saltcorn/whatsapp";

/** The Graph API root. The version goes after it, from the configuration. */
const GRAPH_BASE = "https://graph.facebook.com";
/** Meta supports each Graph version for about two years; it is configurable. */
const DEFAULT_API_VERSION = "v23.0";

/**
 * The plugin configuration as it stands *now*.
 *
 * `actions` is evaluated once, when the plugin is registered, so anything
 * closing over that `cfg` holds a snapshot taken at load time. Reading through
 * here means a token pasted in later is used without a restart.
 *
 * @param {object} [fallback] - used when there is no state (unit tests)
 * @returns {object} the live plugin configuration
 */
const liveCfg = (fallback = {}) => {
  const state = getState();
  if (!state || !state.plugin_cfgs) return fallback;
  const cfgs = state.plugin_cfgs;
  if (cfgs[NPM_NAME]) return cfgs[NPM_NAME];
  if (cfgs[PLUGIN_NAME]) return cfgs[PLUGIN_NAME];
  // installed from a local directory or a fork, under some other key
  const key = Object.keys(cfgs).find((k) => k.endsWith(PLUGIN_NAME));
  return key ? cfgs[key] : fallback;
};

/**
 * The credentials every call needs, or an error saying which is missing.
 *
 * @param {object} cfg - plugin configuration
 * @returns {{token: string, phoneNumberId: string, version: string}}
 */
const credentials = (cfg) => {
  const token = (cfg.access_token || "").trim();
  const phoneNumberId = String(cfg.phone_number_id || "").trim();
  if (!token || !phoneNumberId)
    throw new Error(
      "whatsapp: the plugin is not configured. Set the access token and " +
        "phone number ID in the plugin configuration.",
    );
  return {
    token,
    phoneNumberId,
    version: (cfg.api_version || "").trim() || DEFAULT_API_VERSION,
  };
};

module.exports = {
  PLUGIN_NAME,
  NPM_NAME,
  GRAPH_BASE,
  DEFAULT_API_VERSION,
  liveCfg,
  credentials,
};
