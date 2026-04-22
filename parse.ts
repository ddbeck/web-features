import winston from "winston";
import { tagsToFeatures } from "./compat-helpers";
import { FeatureData } from "./types";

const logger = winston.createLogger({
  level: "error",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
  ),
  transports: new winston.transports.Console(),
});

interface CompatSets {
  core: string[];
  modifiers: string[];
  incidentals: string[];
}

interface AuthoredCompatSets {
  core_name_tbc: string[];
  modifiers_name_tbc?: string[];
  incidentals_name_tbc?: string[];
}

interface ParsedFeatureData extends Partial<FeatureData> {
  compatFeatures: CompatSets & { all: string[] };
}

export function parseFeature(id: string, authored: unknown): ParsedFeatureData {
  // NB: This function doesn't actually parse most of a feature entry. Right
  // now, it handles compat_features and compute_from statuses. There's more to
  // be done here to get "real" parsing, but it's probably not time well spent
  // before writing a JSONSchema for authored YAML files or perhaps adopting a
  // validation library like zod.

  if (!isRecord(authored)) {
    throw new Error(`Expected authored data object, got ${authored}`);
  }

  // There are six ways to specify the compat keys for a feature and which of
  // those keys to use to compute a status. In order of precedence, they are:
  //
  // - compat sets
  //     compat_features object with sets of keys in an authored YAML file
  // - compute_from and flat compat_features
  //     compute_from and compat_features array in an authored YAML file
  // - compute_from and implicit keys
  //    compute_from in an authored YAML file and keys from a BCD tag
  // - flat compat_features
  //    compat_features array in an authored YAML file
  // - implicit keys
  //    keys from a BCD tag
  // - keyless
  //    no enumerated keys
  //
  // This if statement finds the first matching style, then sorts the keys into
  // buckets accordingly.

  let compatFeatures: CompatSets;
  if (isAuthoredCompatSets(authored.compat_features)) {
    logger.debug(`${id} has explicit compat sets`);
    compatFeatures = makeCompatSets(authored.compat_features);
  } else if (
    isComputeFromOverride(authored.status) &&
    Array.isArray(authored.compat_features)
  ) {
    logger.debug(`${id} has compute_from and flat compat_features`);
    compatFeatures = makeCompatSets(
      authored.compat_features,
      parseComputeFrom(authored.status.compute_from),
    );
  } else if (
    isComputeFromOverride(authored.status) &&
    authored.compat_features === undefined
  ) {
    logger.debug(`${id} has compute_from and implicit keys`);
    compatFeatures = makeCompatSets(
      id,
      parseComputeFrom(authored.status.compute_from),
    );
  } else if (Array.isArray(authored.compat_features)) {
    logger.debug(`${id} has flat compat_features`);
    compatFeatures = makeCompatSets(authored.compat_features);
  } else {
    logger.debug(`${id} has implicit keys or is keyless`);
    compatFeatures = makeCompatSets(id);
  }

  return {
    name: authored.name as string,
    description: authored.description as string,
    compatFeatures: {
      all: Array.from(
        new Set([
          ...compatFeatures.core,
          ...compatFeatures.modifiers,
          ...compatFeatures.incidentals,
        ]),
      ).toSorted(),
      ...compatFeatures,
    },
  };
}

export function makeCompatSets(set: AuthoredCompatSets): CompatSets; // done
export function makeCompatSets(
  keys: string[],
  computeFrom: [string, ...string[]],
): CompatSets; // done
export function makeCompatSets(
  id: string,
  computeFrom: [string, ...string[]],
): CompatSets;
export function makeCompatSets(keys: string[]): CompatSets;
export function makeCompatSets(
  id: string,
  computeFrom: [string, ...string[]],
): CompatSets;
export function makeCompatSets(id: string): CompatSets;
export function makeCompatSets(): CompatSets;
export function makeCompatSets(
  setsOrKeysOrId?: AuthoredCompatSets | string[] | string,
  computeFrom?: [string, ...string[]],
): CompatSets {
  if (setsOrKeysOrId === undefined) {
    return {
      core: [],
      modifiers: [],
      incidentals: [],
    };
  }

  if (isAuthoredCompatSets(setsOrKeysOrId)) {
    const sets = setsOrKeysOrId;
    return {
      core: (sets.core_name_tbc ? sets.core_name_tbc : []).toSorted(),
      modifiers: (sets.modifiers_name_tbc
        ? sets.modifiers_name_tbc
        : []
      ).toSorted(),
      incidentals: (sets.incidentals_name_tbc
        ? sets.incidentals_name_tbc
        : []
      ).toSorted(),
    };
  }

  const keys: string[] = Array.isArray(setsOrKeysOrId)
    ? setsOrKeysOrId
    : idToKeys(setsOrKeysOrId);

  if (computeFrom) {
    for (const key of computeFrom) {
      if (!keys.includes(key)) {
        throw new Error(`${key} is not a member of ${keys}`);
      }
    }

    return {
      core: computeFrom.toSorted(),
      modifiers: [],
      incidentals: keys.filter((k) => !computeFrom.includes(k)).toSorted(),
    };
  }
  return {
    core: keys.toSorted(),
    modifiers: [],
    incidentals: [],
  };
}

function idToKeys(id: string): string[] {
  const expectedTag = `web-features:${id}`;
  const result = tagsToFeatures.get(expectedTag);
  if (result === undefined) {
    logger.debug(`No BCD keys have tag: ${expectedTag}`);
  }
  return result.map((f) => f.id) ?? [];
}

function isRecord(
  value: unknown,
): value is Record<string | number | symbol, unknown> {
  return typeof value === "object" && value !== null;
}

function isComputeFromOverride(
  value: unknown,
): value is { compute_from: string[] | string } {
  return isRecord(value) && "compute_from" in value;
}

function isAuthoredCompatSets(value: unknown): value is AuthoredCompatSets {
  return (
    isRecord(value) &&
    ["core_name_tbc", "modifiers_name_tbc", "incidentals_name_tbc"].some(
      (key) => key in value,
    )
  );
}

function parseComputeFrom(value: unknown): [string, ...string[]] | null {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    const first = value[0];
    if (first === undefined) {
      throw new Error(`compute_from must have a minimum length of 1: ${value}`);
    }
    for (const key of value) {
      if (typeof key !== "string") {
        throw new Error(
          `${key} in compute value array ${JSON.stringify(value)} is not a string`,
        );
      }
    }
    return [first, ...value.slice(1)];
  }
  return null;
}
