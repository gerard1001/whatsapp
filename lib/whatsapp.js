const api = require("./api");

/**
 * The Cloud API calls the actions make, each one request. Messages go to
 * /messages with `messaging_product` set; media is uploaded first, to /media,
 * and sent by the id that comes back.
 */

/**
 * Send one message.
 *
 * @param {string} to - E.164 digits
 * @param {string} type - text, template, image, document, audio, video, sticker
 * @param {object} content - the object for that type, e.g. {body} for text
 * @param {object} [opts] - passed to graphFetch
 * @returns {Promise<{id: string, wa_id: string}>} the message id (a wamid)
 *   and the recipient's WhatsApp id
 */
const sendMessage = async (to, type, content, opts = {}) => {
  const res = await api.graphFetch("/messages", {
    ...opts,
    body: { messaging_product: "whatsapp", recipient_type: "individual", to, type, [type]: content },
  });
  const message = (res.messages || [])[0] || {};
  const contact = (res.contacts || [])[0] || {};
  if (!message.id)
    throw new Error("whatsapp: Meta accepted the request but returned no message id.");
  return { id: message.id, wa_id: contact.wa_id || to };
};

/**
 * Upload media, for sending by id.
 *
 * @param {{filename: string, mimetype: string, content: Buffer}} file
 * @param {object} [opts] - passed to graphFetch
 * @returns {Promise<string>} the media id, valid for 30 days
 */
const uploadMedia = async (file, opts = {}) => {
  const res = await api.graphFetch("/media", {
    ...opts,
    formData: () => {
      const fd = new FormData();
      fd.append("messaging_product", "whatsapp");
      fd.append("type", file.mimetype);
      fd.append("file", new Blob([file.content], { type: file.mimetype }), file.filename);
      return fd;
    },
  });
  if (!res.id) throw new Error("whatsapp: Meta accepted the upload but returned no media id.");
  return res.id;
};

module.exports = { sendMessage, uploadMedia };
