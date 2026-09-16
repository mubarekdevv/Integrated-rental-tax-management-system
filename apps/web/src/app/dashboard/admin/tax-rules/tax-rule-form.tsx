"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTaxRuleAction } from "@/server/actions/admin";
import type { ActionFormState } from "@/server/actions/auth";

const initialState: ActionFormState = {};

// Defaults from PwC Worldwide Tax Summaries — Ethiopia, individual rental
// income tax (progressive brackets). See docs/ASSUMPTIONS.md. An admin can
// edit any row before saving; the last row's "max" is left blank (open-ended
// top bracket).
const DEFAULT_BRACKETS = [
  { min: 0, max: 24000, rate: 0 },
  { min: 24001, max: 48000, rate: 15 },
  { min: 48001, max: 84000, rate: 20 },
  { min: 84001, max: 120000, rate: 25 },
  { min: 120001, max: 168000, rate: 30 },
  { min: 168001, max: "", rate: 35 },
];

export function TaxRuleForm() {
  const [state, action, pending] = useActionState(createTaxRuleAction, initialState);
  const router = useRouter();
  const [rows, setRows] = useState(DEFAULT_BRACKETS);

  useEffect(() => {
    if (state === initialState) return;
    if (!state.error) {
      toast.success("Tax rule updated.");
      router.refresh();
    }
  }, [state, router]);

  function updateRow(i: number, field: "min" | "max" | "rate", value: string) {
    setRows((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, [field]: value === "" ? "" : Number(value) } : row))
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" placeholder="Rental Income Tax 2026" required />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">
          Annual rental-income tax brackets (ETB) — progressive: each rate applies only to the slice of income
          within that bracket, not the whole amount.
        </p>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">Min (ETB)</th>
                <th className="p-2 text-left">Max (ETB, blank = no limit)</th>
                <th className="p-2 text-left">Rate (%)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      name={`bracket_${i}_min`}
                      value={row.min}
                      onChange={(e) => updateRow(i, "min", e.target.value)}
                      required
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      name={`bracket_${i}_max`}
                      value={row.max}
                      onChange={(e) => updateRow(i, "max", e.target.value)}
                      placeholder="No limit"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.1"
                      name={`bracket_${i}_rate`}
                      value={row.rate}
                      onChange={(e) => updateRow(i, "rate", e.target.value)}
                      required
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Save tax rule
      </Button>
    </form>
  );
}
