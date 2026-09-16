"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PROPERTY_TYPES = ["APARTMENT", "CONDOMINIUM", "SHARED_HOUSE", "VILLA", "COMMERCIAL", "OTHER"];
const FURNISHED_STATUSES = ["UNFURNISHED", "SEMI_FURNISHED", "FURNISHED"];

export function PropertyFilters({ subCities }: { subCities: { id: number; name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ANY") params.set(key, value);
    else params.delete(key);
    router.push(`/properties?${params.toString()}` as never);
  }

  return (
    <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-1.5">
        <Label>Sub-city</Label>
        <Select defaultValue={searchParams.get("subCityId") ?? "ANY"} onValueChange={(v) => setParam("subCityId", v)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ANY">Any sub-city</SelectItem>
            {subCities.map((sc) => (
              <SelectItem key={sc.id} value={String(sc.id)}>
                {sc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Property Type</Label>
        <Select defaultValue={searchParams.get("propertyType") ?? "ANY"} onValueChange={(v) => setParam("propertyType", v)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ANY">Any type</SelectItem>
            {PROPERTY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.replaceAll("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Furnished</Label>
        <Select defaultValue={searchParams.get("furnishedStatus") ?? "ANY"} onValueChange={(v) => setParam("furnishedStatus", v)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ANY">Any</SelectItem>
            {FURNISHED_STATUSES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.replaceAll("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Min Price (ETB)</Label>
        <Input
          type="number"
          min={0}
          defaultValue={searchParams.get("minPrice") ?? ""}
          onBlur={(e) => setParam("minPrice", e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Max Price (ETB)</Label>
        <Input
          type="number"
          min={0}
          defaultValue={searchParams.get("maxPrice") ?? ""}
          onBlur={(e) => setParam("maxPrice", e.target.value)}
        />
      </div>
    </div>
  );
}
