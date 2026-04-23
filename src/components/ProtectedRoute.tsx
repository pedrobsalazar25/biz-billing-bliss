import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      setCheckingProfile(false);
      return;
    }

    supabase
      .from("business_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setHasProfile(!!data);
        setCheckingProfile(false);
      });
  }, [user]);

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/signin" replace />;

  // Redirect new users (no profile) to the profile setup page
  if (!hasProfile && location.pathname !== "/admin/profile") {
    return <Navigate to="/admin/profile" replace />;
  }

  return <>{children}</>;
}
