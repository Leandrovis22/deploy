// Este hook verifica si el usuario está autenticado y redirige a /login si no lo está
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuthRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = window.localStorage.getItem("user");
      if (!user) {
        router.replace("/login");
      }
    }
  }, [router]);
}
