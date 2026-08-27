import type { ComponentType, ReactNode } from "react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        {Icon && (
          <EmptyMedia variant="icon">
            <Icon className="size-5" />
          </EmptyMedia>
        )}

        <EmptyTitle>{title}</EmptyTitle>

        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>

      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
