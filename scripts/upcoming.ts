import { Temporal } from "@js-temporal/polyfill";
import { features } from "../index";
import { defaultCompat } from "../packages/compute-baseline/dist/browser-compat-data/compat";

const featuresByMonthsInBaseline = new Map<number, string[]>();
const notificationFloor = Temporal.Duration.from({ months: 20 });

const timestamp: string = (defaultCompat.data as any).__meta.timestamp;
const nowish = Temporal.Instant.from(timestamp)
  .toZonedDateTimeISO("UTC")
  .toPlainDate();

for (const [id, feature] of Object.entries(features)) {
  if (feature.kind !== "feature") {
    continue;
  }

  const { baseline_low_date, baseline_high_date } = feature.status;

  if (baseline_low_date && !baseline_high_date) {
    const baselineLowDate = baseline_low_date.startsWith("≤")
      ? baseline_low_date.slice(1)
      : baseline_low_date;
    const sinceBaselineLow = nowish.since(
      Temporal.PlainDate.from(baselineLowDate),
      { largestUnit: "months" },
    );
    const isInsideNotificationWindow =
      Temporal.Duration.compare(notificationFloor, sinceBaselineLow, {
        relativeTo: nowish,
      }) < 1;
    if (isInsideNotificationWindow) {
      featuresByMonthsInBaseline.set(sinceBaselineLow.months, [
        ...(featuresByMonthsInBaseline.get(sinceBaselineLow.months) ?? []),
        id,
      ]);
    }
  }
}

for (const [count, keys] of Array.from(
  featuresByMonthsInBaseline.entries(),
).sort((a, b) => a[0] - b[0])) {
  console.log(`## ${count}`);
  for (const key of keys) {
    console.log(` - ${key}`);
  }
}
