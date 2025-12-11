import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-2 border-stone-200"></div>
            <div className="absolute inset-0 border-2 border-transparent border-t-stone-800 border-r-stone-800 animate-spin"></div>
          </div>
          <h2 className="font-serif text-2xl text-stone-800 mb-2">Loading</h2>
          <p className="text-stone-500 text-sm font-light tracking-wide">
            Please wait while we verify your access
          </p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
