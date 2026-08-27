"use client";

import { useIsHydrated } from "@/hooks/create-local-store";
import { formatSubmissionDate } from "@/lib/submission";
import { tenggatInfo } from "@/lib/tenggat";
import { toneText } from "@/lib/tone";
import { cn } from "@/lib/utils";

export function TenggatText({
  tenggat,
  kosong = "Tanpa tenggat",
  className,
}: {
  tenggat: string | null | undefined;
  kosong?: string;
  className?: string;
}) {
  const hydrated = useIsHydrated();

  if (!tenggat) {
    return (
      <span className={cn("text-muted-foreground", className)}>
        {kosong}
      </span>
    );
  }

  const info = hydrated ? tenggatInfo(tenggat) : null;

  return (
    <span
      className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}
    >
      <span className="tnum whitespace-nowrap">
        {formatSubmissionDate(tenggat)}
      </span>

      {info && (
        <span
          className={cn(
            "text-xs whitespace-nowrap",
            info.tone === "neutral"
              ? "text-muted-foreground"
              : toneText[info.tone]
          )}
        >
          {info.label}
        </span>
      )}
    </span>
  );
}
