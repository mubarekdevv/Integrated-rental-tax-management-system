"use client";

import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ID_TYPES = ["FAYDA", "KEBELE_ID", "PASSPORT", "DRIVER_LICENSE", "STUDENT_ID", "OTHER"];

export function IdTypeSelect({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const t = useTranslations("enums.idType");
  const tProfile = useTranslations("profile");
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={tProfile("selectIdType")} />
      </SelectTrigger>
      <SelectContent>
        {ID_TYPES.map((value) => (
          <SelectItem key={value} value={value}>
            {t(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
