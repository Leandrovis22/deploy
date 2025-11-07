import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useRefreshOnLogin() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined") {
      const onStorage = (e: StorageEvent) => {
        if (e.key === "user" && e.newValue) {
          router.refresh();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }
  }, [router]);
}
