"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FilterSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  className,
}: {
  id: string;
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>

      <Select
        value={value}
        onValueChange={(next) => onChange(next ?? options[0].value)}
        disabled={options.length === 0}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>

        <SelectContent>
          {options.map((opsi) => (
            <SelectItem key={opsi.value} value={opsi.value}>
              {opsi.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
