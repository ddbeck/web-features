import assert from "node:assert/strict";
import { makeCompatSets, parseFeature } from "./parse";

describe("makeCompatSets", function () {
  it("from explicit compat sets", function () {
    const set = makeCompatSets({
      core_name_tbc: ["html.elements.a"],
      modifiers_name_tbc: ["api.HTMLAnchorElement"],
      incidentals_name_tbc: ["html.elements.a.href.href_sms"],
    });
    assert.deepEqual(set.core, ["html.elements.a"]);
    assert.deepEqual(set.modifiers, ["api.HTMLAnchorElement"]);
    assert.deepEqual(set.incidentals, ["html.elements.a.href.href_sms"]);
  });

  it("from compute_from and flat compat_features", function () {
    const set = makeCompatSets(
      [
        "api.HTMLAnchorElement",
        "html.elements.a",
        "html.elements.a.href.href_sms",
      ],
      ["html.elements.a"],
    );
    assert.deepEqual(set.core, ["html.elements.a"]);
    assert.deepEqual(set.modifiers, []);
    assert.deepEqual(set.incidentals, [
      "api.HTMLAnchorElement",
      "html.elements.a.href.href_sms",
    ]);
  });

  it("from compute_from and implicit keys", function () {
    const set = makeCompatSets("a", ["html.elements.a"]);
    assert.deepEqual(set.core, ["html.elements.a"]);
    assert(set.incidentals.includes("api.HTMLAnchorElement"));
  });

  it("from flat compat_features", function () {
    const set = makeCompatSets([
      "api.HTMLAnchorElement",
      "html.elements.a",
      "html.elements.a.href.href_sms",
    ]);
    assert.deepEqual(set.core, [
      "api.HTMLAnchorElement",
      "html.elements.a",
      "html.elements.a.href.href_sms",
    ]);
  });

  it("from implicit keys", function () {
    const set = makeCompatSets("a");
    assert(set.core.includes("html.elements.a"));
  });

  it("from implicit keys, keylessly", function () {
    const set = makeCompatSets("http3");
    assert.equal(set.core.length, 0);
    assert.equal(set.modifiers.length, 0);
    assert.equal(set.incidentals.length, 0);
  });

  it("keylessly", function () {
    const set = makeCompatSets();
    assert.deepEqual(set.core, []);
    assert.deepEqual(set.modifiers, []);
    assert.deepEqual(set.incidentals, []);
  });

  it("throws if compute_from is not a strict subset of a feature's keys", function () {
    assert.throws(() => {
      makeCompatSets(["a", "b", "c"], ["d"]);
    });
  });
});

const authoredExplicit = {
  name: "::backdrop",
  description: "The `::backdrop` CSS pseudo-element…",
  spec: "https://drafts.csswg.org/css-position-4/#backdrop",
  group: "selectors",
  compat_features: {
    core_name_tbc: ["css.selectors.backdrop"],
    modifiers_name_tbc: ["css.selectors.backdrop.dialog"],
    incidentals_name_tbc: [
      "css.selectors.backdrop.inherit_from_originating_element",
    ],
  },
};

describe("parseFeature", function () {
  it("throws with non-object inputs", function () {
    assert.throws(
      () => parseFeature("foo", null),
      Error,
      "expected throw for authored null",
    );
    assert.throws(
      () => parseFeature("bar", undefined),
      Error,
      "expected throw for authored undefined",
    );
    assert.throws(
      () => parseFeature("baz", 123),
      Error,
      "expected throw for authored number",
    );
    assert.throws(
      () => parseFeature("quux", "somestring"),
      Error,
      "expected throw for authored string",
    );
  });

  it("passes through name and description", function () {
    const parsed = parseFeature("backdrop", authoredExplicit);
    assert.equal(parsed.name, authoredExplicit.name);
    assert.equal(parsed.description, authoredExplicit.description);
  });
});
