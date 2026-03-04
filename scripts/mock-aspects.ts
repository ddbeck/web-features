import assert from "node:assert/strict";
import fs from "node:fs";
import { features } from "../index";
import { BaselineHighLow, Status } from "../types";
import { StatusHeadline } from "../types.quicktype";

const todos = [
  "a",
  "array",
  "array-at",
  "array-by-copy",
  "array-copywithin",
  "array-fill",
  "array-find",
  "array-findlast",
  "array-flat",
  "array-from",
  "array-fromasync",
  "array-group",
  "array-includes",
  "array-isarray",
  "array-iteration-methods",
  "array-iterators",
  "array-of",
  "array-splice",
  "array-living",
];

function preflight() {
  const selectedFeature = features["array-living"];
  assert(selectedFeature.kind === "feature");

  assert(
    !isInitial(
      selectedFeature.status.by_compat_key["javascript.builtins.Array.every"],
      selectedFeature.status,
    ),
  );
}

preflight();

for (const todo of todos) {
  const selectedFeature = features[todo];
  assert(selectedFeature.kind === "feature");

  const map = new Map<"initial" | "principal" | "associate", string[]>();
  map.set("initial", []);
  map.set("principal", []);
  map.set("associate", []);

  const headlineStatus = {
    baseline: selectedFeature.status.baseline,
    baseline_low_date: selectedFeature.status.baseline_low_date,
    baseline_high_date: selectedFeature.status.baseline_high_date,
    support: selectedFeature.status.support,
  } as Status;
  assert("by_compat_key" in selectedFeature.status);
  const { by_compat_key } = selectedFeature.status;

  for (const [key, value] of Object.entries(by_compat_key)) {
    if (isInitial(value, headlineStatus)) {
      map.get("initial").push(key);
    } else if (isSameStatusLevel(value, headlineStatus)) {
      map.get("principal").push(key);
    } else {
      map.get("associate").push(key);
    }
  }

  const output = [];
  output.push(`name: ${selectedFeature.name}`);
  output.push("compat_features:");
  for (const [key, values] of map.entries()) {
    if (values.length) {
      output.push(`  ${key}:`);
      values.map((value) => `    - ${value}`).forEach((v) => output.push(v));
    }
  }
  output.push("");
  fs.mkdirSync("/Users/ddbeck/Downloads/array-features/", { recursive: true });
  fs.writeFileSync(
    `/Users/ddbeck/Downloads/array-features/${todo}.yml`,
    output.join("\n"),
    { encoding: "utf-8" },
  );
  fs.copyFileSync(
    `./features/${todo}.yml.dist`,
    `/Users/ddbeck/Downloads/array-features/${todo}.yml.dist`,
  );
  console.log(output.join("\n"));
}

function isInitial(
  compat: Status | StatusHeadline,
  headline: Status | StatusHeadline,
) {
  // console.log(
  //   `Comparing ${compat.baseline} (compat) to ${headline.baseline} (headline)`,
  // );
  if (!isSameStatusLevelOrBetter(compat, headline)) {
    return false;
  }

  if (headline.baseline === "high") {
    // console.log(
    //   `Comparing ${compat.baseline_high_date} (compat) to ${headline.baseline_high_date} (headline)`,
    // );
    if (
      !(
        compat.baseline_high_date.localeCompare(headline.baseline_high_date) <=
        0
      )
    ) {
      return false;
    }
  }

  if (headline.baseline === "low" || headline.baseline === "high") {
    // console.log(
    //   `Comparing ${compat.baseline_low_date} (compat) to ${headline.baseline_low_date} (headline)`,
    // );
    if (
      !(compat.baseline_low_date.localeCompare(headline.baseline_low_date) <= 0)
    ) {
      return false;
    }
  }

  for (const key of Object.keys(headline.support)) {
    // console.log(
    //   `Comparing ${key} ${compat.support[key]} (compat) to ${key} ${headline.support[key]} (headline)`,
    // );
    if (headline.support[key] !== compat.support[key]) {
      return false;
    }
  }
  return true;
}

function isSameStatusLevelOrBetter(
  compat: Status | StatusHeadline,
  headline: Status | StatusHeadline,
): boolean {
  const toNumber = new Map<boolean | BaselineHighLow, number>([
    [true, NaN],
    [false, 0],
    ["low", 1],
    ["high", 2],
  ]);
  return toNumber.get(compat.baseline) >= toNumber.get(headline.baseline);
}

function isSameStatusLevel(
  a: Status | StatusHeadline,
  b: Status | StatusHeadline,
): boolean {
  return a.baseline === b.baseline;
}
