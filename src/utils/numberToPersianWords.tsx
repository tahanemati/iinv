import React from "react";

const ones = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
const teens = [
  "ده",
  "یازده",
  "دوازده",
  "سیزده",
  "چهارده",
  "پانزده",
  "شانزده",
  "هفده",
  "هجده",
  "نوزده",
];
const tens = [
  "",
  "",
  "بیست",
  "سی",
  "چهل",
  "پنجاه",
  "شصت",
  "هفتاد",
  "هشتاد",
  "نود",
];
const hundreds = [
  "",
  "یکصد",
  "دویست",
  "سیصد",
  "چهارصد",
  "پانصد",
  "ششصد",
  "هفتصد",
  "هشتصد",
  "نهصد",
];
const scales = ["", "هزار", "میلیون", "میلیارد", "هزار میلیارد"];

export function parsePersianNumber(
  input: string | number | undefined | null,
): number {
  if (input === undefined || input === null || input === "") return 0;
  if (typeof input === "number") return isNaN(input) ? 0 : Math.floor(input);

  const normalized = String(input)
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[^0-9.-]/g, "");

  const parsed = Number(normalized);
  return isNaN(parsed) ? 0 : Math.floor(parsed);
}

function convertThreeDigits(num: number): string {
  if (num === 0) return "";
  const parts: string[] = [];
  const h = Math.floor(num / 100);
  const rem = num % 100;

  if (h > 0) parts.push(hundreds[h]);

  if (rem >= 10 && rem <= 19) {
    parts.push(teens[rem - 10]);
  } else {
    const t = Math.floor(rem / 10);
    const o = rem % 10;
    if (t > 0) parts.push(tens[t]);
    if (o > 0) parts.push(ones[o]);
  }

  return parts.join(" و ");
}

export function numberToPersianWords(
  input: number | string | undefined | null,
): string {
  const amount = parsePersianNumber(input);
  if (!amount || amount <= 0) return "";

  let num = amount;
  const groups: string[] = [];
  let scaleIndex = 0;

  while (num > 0) {
    const chunk = num % 1000;
    if (chunk > 0) {
      const chunkWords = convertThreeDigits(chunk);
      const scaleWord = scales[scaleIndex];
      groups.unshift(scaleWord ? `${chunkWords} ${scaleWord}` : chunkWords);
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  return `${groups.join(" و ")} تومان`;
}

// کامپوننت آماده برای قرار دادن دقیقاً زیر فیلدهای مبلغ مورد نظر
export const AmountWords: React.FC<{ value: string | number }> = ({
  value,
}) => {
  const words = numberToPersianWords(value);
  if (!words) return null;

  return (
    <p className="text-[11px] font-bold text-blue-600 mt-1.5 pr-1">
      معادل: {words}
    </p>
  );
};
