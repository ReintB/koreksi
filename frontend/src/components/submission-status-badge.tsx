import {
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  Clock3,
  LoaderCircle,
  TriangleAlert,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toneSurface, toneText } from "@/lib/tone";

import {
  EVALUATION_META,
  STATUS_META,
  scoreTone,
  type EvaluationStatus,
  type StatusSubmission,
} from "@/lib/submission";

const statusIcon: Record<
  StatusSubmission,
  typeof Clock3
> = {
  menunggu: Clock3,
  diproses: LoaderCircle,
  selesai: CheckCircle2,
  gagal: CircleAlert,
};

export function SubmissionStatusBadge({
  status,
}: {
  status: StatusSubmission;
}) {
  const { label, tone } =
    STATUS_META[status];

  const Icon = statusIcon[status];

  return (
    <Badge
      variant="ghost"
      className={cn(
        "gap-1.5",
        toneSurface[tone]
      )}
    >
      <Icon
        className={cn(
          "h-3 w-3",
          status === "diproses" &&
            "animate-spin"
        )}
      />
      {label}
    </Badge>
  );
}

export function TerlambatBadge() {
  return (
    <Badge
      variant="ghost"
      className={cn(
        "gap-1.5",
        toneSurface.warning
      )}
    >
      <TriangleAlert className="h-3 w-3" />
      Terlambat
    </Badge>
  );
}

const evaluationIcon: Record<
  EvaluationStatus,
  typeof CheckCircle2
> = {
  terpenuhi: CheckCircle2,
  sebagian: CircleDashed,
  belum: XCircle,
};

export function EvaluationMark({
  status,
  className,
}: {
  status: EvaluationStatus;
  className?: string;
}) {
  const { label, tone } =
    EVALUATION_META[status];

  const Icon = evaluationIcon[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        toneText[tone],
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </span>
  );
}

export function ScoreValue({
  skor,
  size = "sm",
  className,
}: {
  skor: number | null;
  size?: "sm" | "lg";
  className?: string;
}) {
  if (skor === null) {
    return (
      <span
        className={cn(
          "text-muted-foreground",
          className
        )}
        aria-label="Belum ada skor"
      >
        —
      </span>
    );
  }

  return (
    <span
      className={cn(
        "tnum inline-flex items-baseline gap-0.5",
        toneText[scoreTone(skor)],
        className
      )}
    >
      <span
        className={cn(
          "font-semibold",
          size === "lg"
            ? "text-3xl tracking-tight"
            : "text-sm"
        )}
      >
        {skor}
      </span>

      <span
        className={cn(
          "font-normal opacity-60",
          size === "lg"
            ? "text-base"
            : "text-xs"
        )}
      >
        /100
      </span>
    </span>
  );
}
