"use client";

import { useState } from "react";

import { id as localeId } from "date-fns/locale";
import { CalendarDays, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const JAM_DEFAULT = "23:59";

const formatTanggal = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" });

function keDate(tanggal: string) {
  const [tahun, bulan, hari] = tanggal.split("-").map(Number);

  if (!tahun || !bulan || !hari) return undefined;

  const date = new Date(tahun, bulan - 1, hari);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function keTanggal(date: Date) {
  const bulan = String(date.getMonth() + 1).padStart(2, "0");
  const hari = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${bulan}-${hari}`;
}

export function TenggatPicker({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [buka, setBuka] = useState(false);

  const tanggal = value.slice(0, 10);
  const jam = value.slice(11, 16) || JAM_DEFAULT;
  const dipilih = keDate(tanggal);

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>

      <div className="flex flex-wrap items-center gap-2">
        <Popover open={buka} onOpenChange={setBuka}>
          <PopoverTrigger
            render={
              <Button
                id={id}
                type="button"
                variant="outline"
                className="min-w-56 flex-1 justify-start font-normal"
              />
            }
          >
            <CalendarDays className="size-4 opacity-70" />

            {dipilih ? (
              formatTanggal.format(dipilih)
            ) : (
              <span className="text-muted-foreground">Pilih tanggal</span>
            )}
          </PopoverTrigger>

          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              autoFocus
              locale={localeId}
              selected={dipilih}
              defaultMonth={dipilih}
              onSelect={(date) => {
                if (!date) return;

                onChange(`${keTanggal(date)}T${jam}`);
                setBuka(false);
              }}
            />
          </PopoverContent>
        </Popover>

        <Input
          type="time"
          step={60}
          aria-label="Jam tenggat"
          className="w-32"
          value={jam}
          disabled={!dipilih}
          onChange={(event) =>
            onChange(`${tanggal}T${event.target.value || JAM_DEFAULT}`)
          }
        />

        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Kosongkan tenggat"
            onClick={() => onChange("")}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {hint && <FieldDescription>{hint}</FieldDescription>}
    </Field>
  );
}
