import type { ComponentType, ReactNode } from "react";

import { Navbar } from "@/components/navbar";
import { cn } from "@/lib/utils";

export function MessagePage({
  icon: Icon,
  tone = "muted",
  title,
  description,
  actions,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  tone?: "muted" | "danger";
  title: string;
  description: string;
  actions: ReactNode;
  children?: ReactNode;
}) {
  const danger = tone === "danger";

  return (
    <>
      <Navbar />

      <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-full",
            danger ? "bg-destructive/10" : "bg-muted"
          )}
        >
          <Icon
            className={cn(
              "size-6",
              danger ? "text-destructive" : "text-muted-foreground"
            )}
          />
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          {title}
        </h1>

        <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-muted-foreground text-pretty">
          {description}
        </p>

        {children}

        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {actions}
        </div>
      </main>
    </>
  );
}
