import { Navigate, replace } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "var(--bg)" }}
      >
        <div className="text-center">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
            style={{ borderColor: "#e8141c", borderTopColor: "transparent" }}
          />
          <div
            className="text-[12px]"
            style={{ color: "var(--text-secondary)" }}
          >
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
