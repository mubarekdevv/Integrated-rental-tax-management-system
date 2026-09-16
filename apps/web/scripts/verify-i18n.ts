import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

/**
 * Focused regression check for the language-switching flow.
 *
 * There is no headless browser available to click the language switcher and
 * observe the DOM, so this script verifies the two things that actually
 * caused the "switching language does nothing" bug and would cause it to
 * regress silently if undone:
 *
 * 1. The message catalogs (en/am/om) are valid, structurally identical
 *    JSON — no missing/extra/duplicate keys — so every route has a
 *    translation in every locale.
 * 2. `setLocaleAction` revalidates the *layout* at "/", not just the page.
 *    The root layout (where NextIntlClientProvider lives) wraps every
 *    route in the app; revalidating only the "/" *page* means a Server
 *    Action "updates the UI immediately... if viewing the affected path"
 *    (Next.js docs) — i.e. only when the user happens to be on "/" itself.
 *    Switching language from any other page silently did nothing. This is
 *    a static guard against that regressing.
 *
 * Run with: npx tsx scripts/verify-i18n.ts
 */

const MESSAGES_DIR = path.join(__dirname, "../src/messages");
const LOCALES = ["en", "am", "om"] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return flattenKeys(value as Record<string, unknown>, full);
    }
    return [full];
  });
}

function loadWithDuplicateCheck(locale: string): Record<string, unknown> {
  const raw = fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), "utf8");

  // JSON.parse silently keeps the last value on a duplicate key, so scan the
  // raw text for repeated keys within the same nesting level ourselves.
  const seenPerDepth: Map<number, Set<string>> = new Map();
  let depth = 0;
  const keyPattern = /"((?:[^"\\]|\\.)*)"\s*:/g;
  let match: RegExpExecArray | null;
  const lines = raw.split("\n");
  for (const line of lines) {
    for (const ch of line) {
      if (ch === "{") depth++;
      if (ch === "}") {
        seenPerDepth.delete(depth);
        depth--;
      }
    }
    keyPattern.lastIndex = 0;
    while ((match = keyPattern.exec(line))) {
      const set = seenPerDepth.get(depth) ?? new Set<string>();
      assert(!set.has(match[1]), `duplicate key "${match[1]}" in ${locale}.json`);
      set.add(match[1]);
      seenPerDepth.set(depth, set);
    }
  }

  return JSON.parse(raw);
}

function main() {
  console.log("== Verifying i18n message catalogs ==\n");

  const catalogs: Record<string, Record<string, unknown>> = {};
  for (const locale of LOCALES) {
    catalogs[locale] = loadWithDuplicateCheck(locale);
    console.log(`${locale}.json: valid JSON, no duplicate keys.`);
  }

  const keysByLocale = Object.fromEntries(
    LOCALES.map((l) => [l, new Set(flattenKeys(catalogs[l]))])
  ) as Record<(typeof LOCALES)[number], Set<string>>;

  const [reference, ...rest] = LOCALES;
  for (const locale of rest) {
    const missing = [...keysByLocale[reference]].filter((k) => !keysByLocale[locale].has(k));
    const extra = [...keysByLocale[locale]].filter((k) => !keysByLocale[reference].has(k));
    assert(missing.length === 0, `${locale}.json is missing keys present in en.json: ${missing.join(", ")}`);
    assert(extra.length === 0, `${locale}.json has extra keys not present in en.json: ${extra.join(", ")}`);
  }
  console.log(`All locales have the same ${keysByLocale[reference].size} keys.\n`);

  console.log("== Verifying the locale-switch server action ==\n");
  const localeActionSrc = fs.readFileSync(
    path.join(__dirname, "../src/server/actions/locale.ts"),
    "utf8"
  );
  assert(
    /revalidatePath\(\s*["']\/["']\s*,\s*["']layout["']\s*\)/.test(localeActionSrc),
    'setLocaleAction must call revalidatePath("/", "layout") — revalidating only the "page" type ' +
      "leaves every route other than the exact homepage showing the old locale after switching."
  );
  console.log("setLocaleAction revalidates the root layout (not just the \"/\" page). \n");

  console.log("ALL CHECKS PASSED ✔");
}

main();
