/* ════════════════════════════════════════════════════════════
   stripUndefinedDeep: make plain data safe for Firestore, which rejects
   `undefined` anywhere in a document ("Unsupported field value:
   undefined"). One stray undefined (an omitted prop, an optional field
   spread in as undefined) used to block every cloud save.

   - Plain objects: keys whose value is undefined are dropped.
   - Arrays: undefined items become null, so positions are kept.
   - Anything else (class instances such as Firestore Timestamp, Dates)
     is returned as is.
   Pure: the input is never mutated.
   ════════════════════════════════════════════════════════════ */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => (item === undefined ? null : stripUndefinedDeep(item))) as T;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) out[key] = stripUndefinedDeep(item);
    }
    return out as T;
  }
  return value;
}

/** Paths to every undefined in plain data, e.g. ".messages[0].messageType". */
export function findUndefinedPaths(value: unknown, path = "", out: string[] = []): string[] {
  if (value === undefined) {
    out.push(path);
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => findUndefinedPaths(item, `${path}[${i}]`, out));
  } else if (isPlainObject(value)) {
    for (const [key, item] of Object.entries(value)) findUndefinedPaths(item, `${path}.${key}`, out);
  }
  return out;
}
