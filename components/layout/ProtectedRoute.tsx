"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { ready, isAuthenticated, hasSchool } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return; // ✅ wait for hydration
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (isAuthenticated && !hasSchool && !pathname.startsWith("/onboarding")) {
      router.replace(`/onboarding/school?next=${encodeURIComponent(pathname)}`);
    }
  }, [ready, isAuthenticated, hasSchool, router, pathname]);

  if (!ready) return null;                  // avoid flicker / wrong redirect
  if (!isAuthenticated) return null;
  if (isAuthenticated && !hasSchool && !pathname.startsWith("/onboarding")) return null;

  return <>{children}</>;
}