import {
  STATUS_META,
  STATUS_ORDER,
  averageScore,
  countByStatus,
  type StatusSubmission,
} from "@/lib/submission";

import { ScoreValue } from "@/components/submission-status-badge";
import { toneDot, toneText } from "@/lib/tone";
import { cn } from "@/lib/utils";

export function StatusSummary({
  items,
  className,
}: {
  items: {
    status: StatusSubmission;
    skor: number | null;
  }[];
  className?: string;
}) {
  const total = items.length;

  if (total === 0) return null;

  const counts = countByStatus(items);
  const rata = averageScore(items);

  const visible = STATUS_ORDER.filter(
    (status) => counts[status] > 0
  );

  return (
    <div className={cn("mb-5", className)}>
      <div
        className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`Sebaran ${total} pengumpulan: ${visible
          .map(
            (status) =>
              `${counts[status]} ${STATUS_META[status].label.toLowerCase()}`
          )
          .join(", ")}`}
      >
        {visible.map((status, index) => (
          <span
            key={status}
            className={cn(
              "animate-bar h-full",
              toneDot[STATUS_META[status].tone]
            )}
            style={{
              width: `${(counts[status] / total) * 100}%`,
              animationDelay: `${index * 90}ms`,
            }}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        {visible.map((status) => {
          const { label, tone } =
            STATUS_META[status];

          return (
            <span
              key={status}
              className="flex items-baseline gap-2 text-sm"
            >
              <span
                aria-hidden
                className={cn(
                  "size-2 shrink-0 translate-y-[-1px] rounded-full",
                  toneDot[tone]
                )}
              />

              <span
                className={cn(
                  "tnum font-semibold",
                  toneText[tone]
                )}
              >
                {counts[status]}
              </span>

              <span className="text-muted-foreground">
                {label}
              </span>
            </span>
          );
        })}

        {rata !== null && (
          <span className="flex items-baseline gap-2 text-sm sm:ml-auto">
            <span className="text-muted-foreground">
              Rata-rata
            </span>

            <ScoreValue skor={rata} />
          </span>
        )}
      </div>
    </div>
  );
}
