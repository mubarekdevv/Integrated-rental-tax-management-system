"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, isSupportedLocale } from "@/i18n/request";

export async function setLocaleAction(locale: string) {
  if (!isSupportedLocale(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  // The locale is consumed by the root layout (NextIntlClientProvider wraps
  // every route there), so the whole layout tree must be revalidated — not
  // just the literal "/" page. Without `"layout"`, a Server Action only
  // updates the UI "if viewing the affected path" (here, just "/"), so
  // switching language from any other page had no visible effect.
  revalidatePath("/", "layout");
}
