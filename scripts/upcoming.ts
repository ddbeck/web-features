import { Temporal } from "@js-temporal/polyfill";
import { features } from "../index";
import { defaultCompat } from "../packages/compute-baseline/dist/browser-compat-data/compat";
import yargs from "yargs";
import winston from "winston";
import { FeatureData } from "../types";

const argv = yargs(process.argv.slice(2))
  .scriptName("unmapped-compat-keys")
  .usage(
    "$0",
    "Print keys from mdn/browser-compat-data not assigned to a feature",
  )
  .option("format", {
    choices: ["json", "markdown"],
    default: "markdown",
    describe:
      "Choose the output format. JSON has more detail, while Markdown is suited to pasting into GitHub comments.",
  })
  .option("verbose", {
    alias: "v",
    describe: "Show more information",
    type: "count",
    default: 0,
    defaultDescription: "warn",
  })
  .parseSync();

const logger = winston.createLogger({
  level: argv.verbose > 0 ? "debug" : "warn",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
  ),
  transports: new winston.transports.Console(),
});

const timestamp: string = (defaultCompat.data as any).__meta.timestamp;
const nowish = Temporal.Instant.from(timestamp)
  .toZonedDateTimeISO("UTC")
  .toPlainDate();

const featuresByTimeSinceLow = new Map<string, Temporal.Duration>();

for (const [id, feature] of Object.entries(features)) {
  if (
    feature.kind !== "feature" ||
    feature.status.baseline === false ||
    feature.status.baseline === "high"
  ) {
    continue;
  }

  const timeSinceLow = timeSinceBaselineLow(feature);
  featuresByTimeSinceLow.set(id, timeSinceLow);
}

const upcomingFeatures = Array.from(
  featuresByTimeSinceLow.entries().filter(filterUpcoming),
);
upcomingFeatures.sort((a, b) => Temporal.Duration.compare(a[1], b[1]));

for (const [id, duration] of upcomingFeatures) {
  const monthsAgo = duration.round({
    largestUnit: "months",
    relativeTo: nowish,
  }).months;
  if (monthsAgo > 30 - 3) {
    console.log(`${id} - ${monthsAgo} since low`);
  }
}

function timeSinceBaselineLow(feature: FeatureData): Temporal.Duration | null {
  if (feature.status.baseline === false) {
    return null;
  }

  const { baseline_low_date } = feature.status;
  return nowish.since(Temporal.PlainDate.from(stripLTE(baseline_low_date)));
}

function filterUpcoming(
  entry: [string, Temporal.Duration | null],
): entry is [string, Temporal.Duration] {
  const [, durationOrNull] = entry;
  if (durationOrNull === null) {
    return false;
  }
  if (durationOrNull.sign === -1) {
    return false;
  }
  return true;
}

function stripLTE(s: string) {
  if (s.startsWith("≤")) {
    return s.slice(1);
  }
  return s;
}
