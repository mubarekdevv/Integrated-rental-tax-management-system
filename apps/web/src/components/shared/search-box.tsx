import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBox({ action, defaultValue, placeholder }: { action: string; defaultValue?: string; placeholder?: string }) {
  return (
    <form action={action} method="get" className="mb-4 flex gap-2">
      <Input
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder ?? "Search by name, phone, ID or number..."}
        className="max-w-md"
      />
      <Button type="submit">
        <Search className="size-4" /> Search
      </Button>
    </form>
  );
}
