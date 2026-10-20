const test = require("node:test");
const assert = require("node:assert");
const actions = require("../lib/actions");
const { withGraph } = require("./fake-graph");

const { bodyParameters, typeForMime } = actions._internal;

const run = (name, configuration, row = {}, extra = {}) =>
  actions[name].run({ row, configuration, user: { id: 1, role_id: 1 }, ...extra });

const sent = (fake) => fake.to("/messages")[0].body;

test("send_text sends the evaluated text to the normalised number", async () => {
  await withGraph({}, async ({ fake }) => {
    const res = await run(
      "whatsapp_send_text",
      { to_expr: "phone", text_expr: "`Order ${ref} shipped`" },
      { phone: "+1 415 555 0100", ref: "A1" },
    );
    assert.deepEqual(sent(fake), {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "14155550100",
      type: "text",
      text: { body: "Order A1 shipped", preview_url: false },
    });
    assert.equal(res.notify, "WhatsApp message sent to +14155550100");
  });
});

test("send_text uses the default country code", async () => {
  await withGraph(
    {},
    async ({ fake }) => {
      await run("whatsapp_send_text", { to_expr: "'04155550100'", text_expr: "'hi'" });
      assert.equal(sent(fake).to, "14155550100");
    },
    { default_country_code: "1" },
  );
});

test("send_text refuses empty or overlong text before calling Meta", async () => {
  await withGraph({}, async ({ fake }) => {
    await assert.rejects(
      run("whatsapp_send_text", { to_expr: "'+14155550100'", text_expr: "''" }),
      /produced no text/,
    );
    await assert.rejects(
      run("whatsapp_send_text", { to_expr: "'+14155550100'", text_expr: "'x'.repeat(4097)" }),
      /4097 characters/,
    );
    assert.equal(fake.calls.length, 0);
  });
});

test("the message id is written back, and returned in a workflow", async () => {
  await withGraph({}, async () => {
    const updates = [];
    const table = {
      name: "orders",
      pk_name: "id",
      fields: [{ name: "phone" }, { name: "wamid" }],
      updateRow: async (patch, id) => updates.push({ patch, id }),
    };
    const res = await run(
      "whatsapp_send_text",
      {
        to_expr: "phone",
        text_expr: "'hi'",
        message_id_field: "wamid",
        result_variable: "msg",
      },
      { id: 7, phone: "+14155550100" },
      { table },
    );
    assert.deepEqual(updates, [{ patch: { wamid: "wamid.1" }, id: 7 }]);
    assert.deepEqual(res, { msg: { id: "wamid.1", wa_id: "14155550100" } });
  });
});

test("send_template fills numbered placeholders from an array", async () => {
  await withGraph({}, async ({ fake }) => {
    await run(
      "whatsapp_send_template",
      {
        to_expr: "phone",
        template_name: "order_shipped",
        language: "en_US",
        parameters_expr: "[name, ref]",
      },
      { phone: "+14155550100", name: "Ana", ref: 42 },
    );
    assert.deepEqual(sent(fake).template, {
      name: "order_shipped",
      language: { code: "en_US" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: "Ana" },
            { type: "text", text: "42" },
          ],
        },
      ],
    });
  });
});

test("send_template without parameters sends no components", async () => {
  await withGraph({}, async ({ fake }) => {
    await run("whatsapp_send_template", {
      to_expr: "'+14155550100'",
      template_name: "hello_world",
      language: "en_US",
    });
    assert.deepEqual(sent(fake).template, {
      name: "hello_world",
      language: { code: "en_US" },
    });
  });
});

test("send_template passes a components expression through as is", async () => {
  await withGraph({}, async ({ fake }) => {
    const components = [
      { type: "header", parameters: [{ type: "image", image: { link: "https://x.org/a.png" } }] },
    ];
    await run("whatsapp_send_template", {
      to_expr: "'+14155550100'",
      template_name: "promo",
      language: "en",
      parameters_expr: "['ignored']",
      components_expr: JSON.stringify(components),
    });
    assert.deepEqual(sent(fake).template.components, components);
  });
});

test("named and empty template parameters", () => {
  assert.deepEqual(bodyParameters({ customer: "Ana" }), [
    { type: "text", parameter_name: "customer", text: "Ana" },
  ]);
  assert.throws(() => bodyParameters(["a", ""]), /\{\{2\}\} is empty/);
  assert.throws(() => bodyParameters("a"), /array or an object/);
  assert.deepEqual(bodyParameters(undefined), []);
});

test("send_media sends a URL by link, typed from its extension", async () => {
  await withGraph({}, async ({ fake }) => {
    await run("whatsapp_send_media", {
      to_expr: "'+14155550100'",
      media_expr: "'https://example.com/files/report.pdf'",
      media_type: "auto",
      caption_expr: "'Your report'",
    });
    const body = sent(fake);
    assert.equal(body.type, "document");
    assert.deepEqual(body.document, {
      link: "https://example.com/files/report.pdf",
      filename: "report.pdf",
      caption: "Your report",
    });
    assert.equal(fake.to("/media").length, 0);
  });
});

test("send_media uploads supplied bytes, then sends by media id", async () => {
  await withGraph({}, async ({ fake }) => {
    await run(
      "whatsapp_send_media",
      {
        to_expr: "'+14155550100'",
        media_expr: "({filename: 'a.png', mimetype: 'image/png', content: 'PNG'})",
        media_type: "auto",
        caption_expr: "'look'",
      },
    );
    const [upload] = fake.to("/media");
    assert.equal(upload.body.messaging_product, "whatsapp");
    assert.equal(upload.body.type, "image/png");
    assert.equal(upload.body.file.name, "a.png");
    const body = sent(fake);
    assert.equal(body.type, "image");
    assert.deepEqual(body.image, { id: "media-1", caption: "look" });
  });
});

test("send_media drops the caption on audio", async () => {
  await withGraph({}, async ({ fake }) => {
    await run("whatsapp_send_media", {
      to_expr: "'+14155550100'",
      media_expr: "'https://example.com/note.ogg'",
      media_type: "auto",
      caption_expr: "'ignored'",
    });
    assert.deepEqual(sent(fake).audio, { link: "https://example.com/note.ogg" });
  });
});

test("MIME types map to the message types WhatsApp accepts", () => {
  assert.equal(typeForMime("image/jpeg"), "image");
  assert.equal(typeForMime("image/png"), "image");
  assert.equal(typeForMime("image/gif"), "document");
  assert.equal(typeForMime("image/webp"), "sticker");
  assert.equal(typeForMime("video/mp4"), "video");
  assert.equal(typeForMime("audio/mpeg"), "audio");
  assert.equal(typeForMime("application/pdf"), "document");
});
