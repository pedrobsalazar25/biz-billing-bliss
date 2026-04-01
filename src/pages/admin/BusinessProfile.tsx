import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, t } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, Save, Upload, X } from "lucide-react";

interface ProfileForm {
  business_name: string;
  email: string;
  phone: string;
  tax_id: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  invoice_prefix: string;
}

const emptyForm: ProfileForm = {
  business_name: "",
  email: "",
  phone: "",
  tax_id: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
  invoice_prefix: "INV-",
};

export default function BusinessProfile() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const qc = useQueryClient();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["businessProfile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        business_name: profile.business_name ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        tax_id: profile.tax_id ?? "",
        address_line1: profile.address_line1 ?? "",
        address_line2: profile.address_line2 ?? "",
        city: profile.city ?? "",
        state: profile.state ?? "",
        postal_code: profile.postal_code ?? "",
        country: profile.country ?? "",
        invoice_prefix: profile.invoice_prefix ?? "INV-",
      });
      if (profile.logo_url) setLogoPreview(profile.logo_url);
    }
  }, [profile]);

  const uploadLogo = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/logo.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("logos")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
      const logoUrl = urlData.publicUrl + "?t=" + Date.now();

      if (profile) {
        await supabase.from("business_profiles").update({ logo_url: logoUrl }).eq("id", profile.id);
      } else {
        await supabase.from("business_profiles").insert({
          user_id: user.id,
          business_name: form.business_name || "My Business",
          logo_url: logoUrl,
        });
      }

      setLogoPreview(logoUrl);
      qc.invalidateQueries({ queryKey: ["businessProfile"] });
      toast.success("Logo uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    if (!profile) return;
    await supabase.from("business_profiles").update({ logo_url: null }).eq("id", profile.id);
    setLogoPreview(null);
    qc.invalidateQueries({ queryKey: ["businessProfile"] });
    toast.success("Logo removed");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        business_name: form.business_name,
        email: form.email || null,
        phone: form.phone || null,
        tax_id: form.tax_id || null,
        address_line1: form.address_line1 || null,
        address_line2: form.address_line2 || null,
        city: form.city || null,
        state: form.state || null,
        postal_code: form.postal_code || null,
        country: form.country || null,
        invoice_prefix: form.invoice_prefix || "INV-",
      };
      if (profile) {
        const { error } = await supabase.from("business_profiles").update(payload).eq("id", profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("business_profiles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["businessProfile"] });
      toast.success(t("profile", "saveProfile", lang));
    },
    onError: (err: any) => toast.error(err.message),
  });

  const set = (key: keyof ProfileForm, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const isNewUser = !profile;

  const stepLabels = [
    t("profile", "businessName", lang),
    t("profile", "contactInfo", lang),
    t("profile", "address", lang),
    t("profile", "logo", lang),
  ];
  const completedSteps = [
    !!form.business_name,
    !!(form.email || form.phone),
    !!(form.address_line1 && form.city),
    !!logoPreview,
  ];
  const stepsTotal = completedSteps.length;
  const stepsDone = completedSteps.filter(Boolean).length;

  if (isLoading) return <p className="text-sm text-muted-foreground">{t("invoiceDetail", "loading", lang)}</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      {isNewUser && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-1">{t("profile", "welcome", lang)}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t("profile", "welcomeDesc", lang)}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(stepsDone / stepsTotal) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {stepsDone}/{stepsTotal} {t("profile", "complete", lang)}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              {stepLabels.map((label, i) => (
                <div
                  key={label}
                  className={`text-xs rounded-md px-2 py-1.5 text-center font-medium ${
                    completedSteps[i]
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {completedSteps[i] ? "✓ " : ""}{label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">{isNewUser ? t("profile", "setupTitle", lang) : t("profile", "title", lang)}</h2>
          <p className="text-sm text-muted-foreground">{t("profile", "subtitle", lang)}</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("profile", "companyLogo", lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadLogo(f);
              }}
            />
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-20 h-20 rounded-lg object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? t("profile", "uploading", lang) : logoPreview ? t("profile", "changeLogo", lang) : t("profile", "uploadLogo", lang)}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">{t("profile", "logoHint", lang)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("profile", "companyDetails", lang)}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("profile", "businessNameLabel", lang)}</Label>
              <Input required value={form.business_name} onChange={(e) => set("business_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("profile", "email", lang)}</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("profile", "phone", lang)}</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("profile", "taxId", lang)}</Label>
              <Input value={form.tax_id} onChange={(e) => set("tax_id", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("profile", "invoicePrefix", lang)}</Label>
              <Input value={form.invoice_prefix} onChange={(e) => set("invoice_prefix", e.target.value)} placeholder="INV-" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("profile", "addressTitle", lang)}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("profile", "addressLine1", lang)}</Label>
              <Input value={form.address_line1} onChange={(e) => set("address_line1", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("profile", "addressLine2", lang)}</Label>
              <Input value={form.address_line2} onChange={(e) => set("address_line2", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("profile", "city", lang)}</Label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("profile", "state", lang)}</Label>
              <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("profile", "postalCode", lang)}</Label>
              <Input value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("profile", "country", lang)}</Label>
              <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? t("profile", "saving", lang) : t("profile", "saveProfile", lang)}
        </Button>
      </form>
    </div>
  );
}
