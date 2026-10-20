/**
 * Turn a phone number as people write it into the digits-only E.164 form the
 * Cloud API wants: country code first, no "+", no spaces or punctuation.
 *
 * "+1 415 555 0100", "0014155550100" and, with a default country code of
 * 1, "0415 555 0100" all become "14155550100".
 *
 * @param {string|number} raw - the number as stored on the row
 * @param {string} [defaultCountryCode] - prefixed to numbers written with a
 *   leading national 0
 * @returns {string} E.164 digits
 */
const normalise = (raw, defaultCountryCode) => {
  if (raw === undefined || raw === null || String(raw).trim() === "")
    throw new Error("whatsapp: the recipient expression produced no phone number.");
  const written = String(raw).trim();
  let digits = written.replace(/[\s().\-/]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) {
    const cc = String(defaultCountryCode || "").replace(/\D/g, "");
    if (!cc)
      throw new Error(
        `whatsapp: "${written}" is a national number. Write it with its ` +
          `country code, or set a default country code in the plugin ` +
          `configuration.`,
      );
    digits = cc + digits.replace(/^0+/, "");
  }
  // E.164 allows at most 15 digits; nothing real is shorter than 8 with its
  // country code
  if (!/^\d{8,15}$/.test(digits))
    throw new Error(`whatsapp: "${written}" is not a valid phone number.`);
  return digits;
};

module.exports = { normalise };
