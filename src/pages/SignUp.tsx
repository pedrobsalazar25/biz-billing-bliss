import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import loginBg from "@/assets/login-bg.png";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Globe, MailCheck } from "lucide-react";
import { useLanguage, t } from "@/hooks/useLanguage";

const schema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }).max(100),
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(128),
});

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user, loading: authLoading, signUp } = useAuth();
  const navigate = useNavigate();
  const { lang, toggleLang } = useLanguage();

  useEffect(() => {
    if (!authLoading && user) navigate("/admin", { replace: true });
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse({ name, email, password });
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
      await signUp(parsed.data.email, parsed.data.password, parsed.data.name);
      setSubmitted(true);
      toast.success(t("login", "checkEmail", lang));
    } catch (err: any) {
      toast.error(err.message || "Sign up failed");
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
          <CardTitle className="text-2xl">{t("login", "titleSignUp", lang)}</CardTitle>
          <CardDescription>{t("login", "descSignUp", lang)}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">{lang === "es" ? "Nombre" : "Name"}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
                required
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("login", "email", lang)}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                required
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("login", "password", lang)}</Label>
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("login", "loading", lang) : t("login", "signUp", lang)}
            </Button>
          </form>
          <Link
            to="/signin"
            className="mt-4 block w-full text-center text-sm text-muted-foreground hover:underline"
          >
            {t("login", "switchToSignIn", lang)}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
