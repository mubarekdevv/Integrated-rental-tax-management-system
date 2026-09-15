import { randomUUID } from "crypto";

function pad(n: number, width: number) {
  return String(n).padStart(width, "0");
}

function randomDigits(length: number) {
  let out = "";
  for (let i = 0; i < length; i++) out += Math.floor(Math.random() * 10);
  return out;
}

/** ቴ/<subCityId>/<random6> — mirrors the legacy WUL numbering scheme. */
export function generateAgreementNumber(subCityId: number) {
  return `TE/${pad(subCityId, 2)}/${randomDigits(6)}`;
}

export function generateWulNumber(subCityId: number) {
  return `WUL/${pad(subCityId, 2)}/${randomDigits(6)}`;
}

export function generatePropertyCode(subCityId: number, houseNumber: string) {
  return `P-${pad(subCityId, 2)}-${houseNumber}-${randomDigits(4)}`;
}

export function generatePaymentReference(purpose: string) {
  return `PAY-${purpose.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${randomDigits(4)}`;
}

export function generateQrToken() {
  return randomUUID();
}
