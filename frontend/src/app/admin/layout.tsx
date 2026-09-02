"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authenticated, user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    queueMicrotask(() => {
      if (!authenticated) router.replace("/login");
      else if (user?.role !== "admin") router.replace("/");
    });
  }, [authenticated, loading, router, user?.role]);

  if (loading || !authenticated || user?.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        Memverifikasi akses admin...
      </div>
    );
  }

  return children;
}
