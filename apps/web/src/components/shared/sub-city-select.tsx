"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SubCitySelect({
  name,
  subCities,
  defaultValue,
}: {
  name: string;
  subCities: { id: number; name: string }[];
  defaultValue?: string;
}) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select sub-city" />
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
