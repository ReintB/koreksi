"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  // SelectValue mencetak nilai mentahnya, bukan label opsinya. Untuk penyaring
  // yang nilainya kebetulan sama dengan yang ingin dibaca — nama kelas,
  // misalnya — itu tidak kelihatan salah. Tetapi begitu nilainya id mata
  // kuliah atau penanda "semua", trigger-nya memajang "mk-1788421558059-lcvt8u"
  // dan "__semua__". Labelnya dicari sendiri di sini, memakai pola yang sama
  // dengan pemilih mata kuliah di halaman kirim tugas.
  const terpilih = options.find((opsi) => opsi.value === value);

  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>

      <Select
        value={value}
        onValueChange={(next) => onChange(next ?? options[0].value)}
        disabled={options.length === 0}
      >
        <SelectTrigger id={id} className="w-full">
          <span className={cn("truncate", !terpilih && "text-muted-foreground")}>
            {terpilih?.label ?? label}
          </span>
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
