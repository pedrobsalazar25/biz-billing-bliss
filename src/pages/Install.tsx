import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const t = {
    title: { es: "Instalar la App", en: "Install the App" },
    subtitle: {
      es: "Instala esta app en tu dispositivo para una experiencia nativa — sin tiendas de apps.",
      en: "Install this app on your device for a native experience — no app store needed.",
    },
    installBtn: { es: "Instalar App", en: "Install App" },
    installed: { es: "¡App ya instalada!", en: "App already installed!" },
    installedDesc: {
      es: "Esta app ya está instalada en tu dispositivo. Búscala en tu pantalla de inicio.",
      en: "This app is already installed on your device. Find it on your home screen.",
    },
    androidTitle: { es: "Android (Chrome)", en: "Android (Chrome)" },
    androidSteps: {
      es: [
        "Abre esta página en Google Chrome",
        "Toca el menú ⋮ (tres puntos) arriba a la derecha",
        'Selecciona "Instalar app" o "Añadir a pantalla de inicio"',
        "Confirma la instalación",
      ],
      en: [
        "Open this page in Google Chrome",
        "Tap the ⋮ menu (three dots) at the top right",
        'Select "Install app" or "Add to Home screen"',
        "Confirm the installation",
      ],
    },
    iosTitle: { es: "iPhone / iPad (Safari)", en: "iPhone / iPad (Safari)" },
    iosSteps: {
      es: [
        "Abre esta página en Safari",
        "Toca el botón Compartir (cuadro con flecha)",
        'Selecciona "Añadir a pantalla de inicio"',
        "Confirma el nombre y toca Añadir",
      ],
      en: [
        "Open this page in Safari",
        "Tap the Share button (square with arrow)",
        'Select "Add to Home Screen"',
        "Confirm the name and tap Add",
      ],
    },
    desktopTitle: { es: "Escritorio (Chrome/Edge)", en: "Desktop (Chrome/Edge)" },
    desktopSteps: {
      es: [
        "Abre esta página en Chrome o Edge",
        "Busca el ícono de instalación en la barra de direcciones",
        'O ve a Menú → "Instalar…"',
        "Confirma la instalación",
      ],
      en: [
        "Open this page in Chrome or Edge",
        "Look for the install icon in the address bar",
        'Or go to Menu → "Install…"',
        "Confirm the installation",
      ],
    },
    back: { es: "Volver", en: "Go Back" },
  };

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.back[lang]}
        </Button>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{t.title[lang]}</h1>
          <p className="text-muted-foreground">{t.subtitle[lang]}</p>
        </div>

        {isInstalled ? (
          <Card className="border-primary/50 bg-primary/10">
            <CardContent className="pt-6 text-center space-y-2">
              <Download className="mx-auto h-10 w-10 text-primary" />
              <p className="font-semibold text-foreground">{t.installed[lang]}</p>
              <p className="text-sm text-muted-foreground">{t.installedDesc[lang]}</p>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Button size="lg" onClick={handleInstall} className="gap-2">
                <Download className="h-5 w-5" />
                {t.installBtn[lang]}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4">
          {[
            { icon: Smartphone, title: t.androidTitle[lang], steps: t.androidSteps[lang] },
            { icon: Smartphone, title: t.iosTitle[lang], steps: t.iosSteps[lang] },
            { icon: Monitor, title: t.desktopTitle[lang], steps: t.desktopSteps[lang] },
          ].map(({ icon: Icon, title, steps }) => (
            <Card key={title}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="h-5 w-5 text-primary" />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                  {steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Install;
