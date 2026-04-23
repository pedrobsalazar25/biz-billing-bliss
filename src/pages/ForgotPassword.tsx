import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import loginBg from "@/assets/login-bg.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Globe, MailCheck } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const schema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
});

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { lang, toggleLang } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Could not send reset email");
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
        {submitted ? (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                <MailCheck className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl">
                {lang === "es" ? "Revisa tu correo" : "Check your email"}
              </CardTitle>
              <CardDescription>
                {lang === "es"
                  ? `Si existe una cuenta con ${email}, te enviamos un enlace para restablecer tu contraseña.`
                  : `If an account exists for ${email}, we sent a link to reset your password.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="outline">
                <Link to="/signin">{lang === "es" ? "Volver a iniciar sesión" : "Back to sign in"}</Link>
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {lang === "es" ? "Restablecer contraseña" : "Reset password"}
              </CardTitle>
              <CardDescription>
                {lang === "es"
                  ? "Ingresa tu correo y te enviaremos un enlace."
                  : "Enter your email and we'll send you a link."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email">{lang === "es" ? "Correo" : "Email"}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!error}
                    required
                  />
                  {error && <p className="text-xs text-destructive">{error}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading
                    ? lang === "es" ? "Enviando..." : "Sending..."
                    : lang === "es" ? "Enviar enlace" : "Send link"}
                </Button>
              </form>
              <Link
                to="/signin"
                className="mt-4 block w-full text-center text-sm text-muted-foreground hover:underline"
              >
                {lang === "es" ? "Volver a iniciar sesión" : "Back to sign in"}
              </Link>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
