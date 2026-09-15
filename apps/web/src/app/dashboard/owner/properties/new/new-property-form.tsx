"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubCitySelect } from "@/components/shared/sub-city-select";
import { createPropertyAction } from "@/server/actions/property";
import type { ActionFormState } from "@/server/actions/auth";

const PROPERTY_TYPES = ["APARTMENT", "CONDOMINIUM", "SHARED_HOUSE", "VILLA", "COMMERCIAL", "OTHER"];
const CONSTRUCTION_TYPES = ["CONCRETE", "HOLLOW_BLOCK", "WOOD_AND_MUD", "PREFAB", "OTHER"];
const FURNISHED_STATUSES = ["UNFURNISHED", "SEMI_FURNISHED", "FURNISHED"];

const initialState: ActionFormState = {};

export function NewPropertyForm({ subCities }: { subCities: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState(createPropertyAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state === initialState) return;
    if (!state.error && !state.fieldErrors) {
      toast.success("Property registered as a draft.");
      router.push("/dashboard/owner/properties");
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="e.g. 2-Bedroom Apartment near Bole" required />
        {state.fieldErrors?.title && <p className="text-sm text-destructive">{state.fieldErrors.title[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Property Type</Label>
          <Select name="propertyType" defaultValue="APARTMENT">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Construction Type</Label>
          <Select name="constructionType" defaultValue="CONCRETE">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONSTRUCTION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="numberOfRooms">Number of Rooms</Label>
          <Input id="numberOfRooms" name="numberOfRooms" type="number" min={1} defaultValue={1} required />
          {state.fieldErrors?.numberOfRooms && (
            <p className="text-sm text-destructive">{state.fieldErrors.numberOfRooms[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Furnished Status</Label>
          <Select name="furnishedStatus" defaultValue="UNFURNISHED">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FURNISHED_STATUSES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sizeSqm">Size (sqm)</Label>
          <Input id="sizeSqm" name="sizeSqm" type="number" min={0} step="0.1" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Sub-city</Label>
          <SubCitySelect name="subCityId" subCities={subCities} />
          {state.fieldErrors?.subCityId && <p className="text-sm text-destructive">{state.fieldErrors.subCityId[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="houseNumber">House Number</Label>
          <Input id="houseNumber" name="houseNumber" required />
          {state.fieldErrors?.houseNumber && <p className="text-sm text-destructive">{state.fieldErrors.houseNumber[0]}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="askingRentEtb">Asking Rent (ETB / month)</Label>
        <Input id="askingRentEtb" name="askingRentEtb" type="number" min={0} step="1" required />
        {state.fieldErrors?.askingRentEtb && (
          <p className="text-sm text-destructive">{state.fieldErrors.askingRentEtb[0]}</p>
        )}
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Save as draft
      </Button>
    </form>
  );
}
