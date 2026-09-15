"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ID_TYPES = [
  { value: "FAYDA", label: "Fayda / National ID" },
  { value: "KEBELE_ID", label: "Kebele ID" },
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVER_LICENSE", label: "Driver's License" },
  { value: "STUDENT_ID", label: "Student ID" },
  { value: "OTHER", label: "Other" },
];

export function IdTypeSelect({ name, defaultValue }: { name: string; defaultValue?: string }) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select ID type" />
      </SelectTrigger>
      <SelectContent>
        {ID_TYPES.map((t) => (
          <SelectItem key={t.value} value={t.value}>
            {t.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
