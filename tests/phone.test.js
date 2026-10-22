const test = require("node:test");
const assert = require("node:assert");
const { normalise } = require("../lib/phone");

test("international forms become bare E.164 digits", () => {
  assert.equal(normalise("+1 415 555 0100"), "14155550100");
  assert.equal(normalise("0014155550100"), "14155550100");
  assert.equal(normalise("+1 (415) 555-0100"), "14155550100");
  assert.equal(normalise(14155550100), "14155550100");
});

test("a national number takes the default country code", () => {
  assert.equal(normalise("0415 555 0100", "1"), "14155550100");
  assert.equal(normalise("04155550100", "+1"), "14155550100");
});

test("a national number without a default country code is refused", () => {
  assert.throws(() => normalise("04155550100"), /default country code/);
});

test("nothing, or something that is not a number, is refused", () => {
  assert.throws(() => normalise(""), /no phone number/);
  assert.throws(() => normalise(null), /no phone number/);
  assert.throws(() => normalise("+12 34"), /not a valid phone number/);
  assert.throws(() => normalise("call me"), /not a valid phone number/);
});
