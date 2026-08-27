import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function PageSkeleton({
  variant,
  rows = 5,
}: {
  variant: "table" | "form" | "panels";
  rows?: number;
}) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <div className="mb-8">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-3 h-4 w-full max-w-md" />
      </div>

      {variant === "table" && (
        <>
          <div className="mb-5 flex flex-wrap gap-3">
            <Skeleton className="h-9 w-full sm:w-56" />
            <Skeleton className="h-9 w-full sm:w-40" />
            <Skeleton className="h-9 w-full sm:w-40" />
          </div>

          <Skeleton className="mb-3 h-1.5 w-full rounded-full" />

          <Card>
            <CardContent className="p-0">
              <div className="border-b px-4 py-3">
                <Skeleton className="h-4 w-32" />
              </div>

              {Array.from({ length: rows }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 border-b px-4 py-4 last:border-b-0"
                >
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="ml-auto h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {variant === "form" && (
        <div className="max-w-xl">
          <Card>
            <CardContent className="space-y-6 py-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index}>
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="mt-2 h-9 w-full" />
                </div>
              ))}

              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        </div>
      )}

      {variant === "panels" && (
        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      )}

      <span className="sr-only" role="status">
        Memuat halaman…
      </span>
    </main>
  );
}
