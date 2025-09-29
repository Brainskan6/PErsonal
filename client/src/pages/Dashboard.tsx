
import { useAuth } from "@/hooks/useAuth";
import FinancialPlanningLayout from "@/components/FinancialPlanningLayout";

export default function Dashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    window.location.href = "/api/login";
    return null;
  }

  return <FinancialPlanningLayout />;
}
