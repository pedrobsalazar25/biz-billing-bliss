import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import loginBg from "@/assets/login-bg.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Globe } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const schema = z
  .object({
    password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(128),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const { lang, toggleLang } = useLanguage();
  const navigate = useNavigate();

  // Supabase fires PASSWORD_RECOVERY event when user lands from the email link.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    // Fallback: if there's already a session (link was processed), allow update too.
    supabase.auth.getSession().then(({ data: { session } }) => {
      const hash = window.location.hash;
      if (session || hash.includes("type=recovery") || hash.includes("access_token")) {
        setReady(true);
      } else {
        // Give onAuthStateChange a brief window before declaring invalid.
        setTimeout(() => setReady((r) => r || false), 1500);
        setTimeout(() => setInvalidLink((i) => (ready ? false : true)), 1600);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      parsed.error.issues.forEach((i) => {
        const k = i.path[0] as keyof typeof errors;
        if (k) fieldErrors[k] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) throw error;
      toast.success(lang === "es" ? "Contraseña actualizada" : "Password updated");
      await supabase.auth.signOut();
      navigate("/signin", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-end justify-center px-4 pb-8 pt-4 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <button
        onClick={toggleLang}
        className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full bg-card/80 backdrop-blur px-3 py-1.5 text-xs font-medium text-foreground shadow-sm border border-border"
      >
        <Globe className="h-3.5 w-3.5" />
        {lang === "es" ? "EN" : "ES"}
      </button>

      <Card className="w-full max-w-sm bg-white/30 backdrop-blur-xl shadow-xl border border-white/40">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {lang === "es" ? "Nueva contraseña" : "New password"}
          </CardTitle>
          <CardDescription>
            {lang === "es"
              ? "Elige una contraseña segura para tu cuenta."
              : "Choose a secure password for your account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invalidLink && !ready ? (
            <div className="space-y-4">
              <p className="text-sm text-destructive text-center">
                {lang === "es"
                  ? "Enlace inválido o expirado. Solicita uno nuevo."
                  : "Invalid or expired link. Please request a new one."}
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link to="/forgot-password">
                  {lang === "es" ? "Solicitar nuevo enlace" : "Request new link"}
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="password">{lang === "es" ? "Nueva contraseña" : "New password"}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                  required
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">{lang === "es" ? "Confirmar contraseña" : "Confirm password"}</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-invalid={!!errors.confirm}
                  required
                />
                {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading || !ready}>
                {loading
                  ? lang === "es" ? "Guardando..." : "Saving..."
                  : lang === "es" ? "Actualizar contraseña" : "Update password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
