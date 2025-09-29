// Replit Auth React Hook  
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    throwOnError: false,
  });

  // When there's an error (like 401), user should be null and not authenticated
  const isAuthenticated = !!user && !error;

  return {
    user: error ? null : user,
    isLoading,
    isAuthenticated,
  };
}