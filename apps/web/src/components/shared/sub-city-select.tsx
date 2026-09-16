"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SubCitySelect({
  name,
  subCities,
  defaultValue,
  placeholder,
}: {
  name: string;
  subCities: { id: number; name: string }[];
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder ?? "Select sub-city"} />
      </SelectTrigger>
      <SelectContent>
        {subCities.map((sc) => (
          <SelectItem key={sc.id} value={String(sc.id)}>
            {sc.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
