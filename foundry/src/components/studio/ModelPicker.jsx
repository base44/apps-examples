import { Cpu } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MODELS } from "@/lib/foundry";

// One gateway, many models: the choice rides along with each request and the
// server re-checks it against MODELS before building the adapter.
export function ModelPicker({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 min-w-0 flex-1 sm:w-[13.5rem] sm:flex-none gap-2" aria-label="Model">
        <Cpu className="h-4 w-4 shrink-0 text-orange-400" />
        <SelectValue>{MODELS.find((m) => m.id === value)?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {MODELS.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            <span className="flex flex-col">
              <span>{m.label}</span>
              <span className="text-[11px] text-muted-foreground">{m.note}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
