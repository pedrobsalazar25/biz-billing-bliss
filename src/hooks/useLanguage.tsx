import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Lang = "es" | "en";

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "app_lang";

function getInitialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "es" || stored === "en") return stored;
  const browserLang = navigator.language?.slice(0, 2);
  return browserLang === "es" ? "es" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(getInitialLang);

  const toggleLang = () =>
    setLang((l) => {
      const next = l === "es" ? "en" : "es";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

// --- Translations ---

const translations = {
  onboarding: {
    slides: [
      {
        es: { heading: "Crea Facturas en Segundos", description: "Facturas profesionales listas para enviar — sin necesidad de habilidades de diseño" },
        en: { heading: "Create Invoices in Seconds", description: "Professional invoices ready to send — no design skills needed" },
      },
      {
        es: { heading: "Integración con WhatsApp", description: "Comparte facturas directamente con tus clientes a través de WhatsApp — instantáneo y personal" },
        en: { heading: "WhatsApp Integration", description: "Share invoices directly with your clients via WhatsApp — instant and personal" },
      },
      {
        es: { heading: "Controla tus Pagos Fácilmente", description: "Monitorea todas tus facturas y pagos en un solo panel de control" },
        en: { heading: "Track Payments Easily", description: "Monitor all your invoices and payments in one dashboard" },
      },
      {
        es: { heading: "Completamente Gratis", description: "Comienza a facturar hoy sin necesidad de tarjeta de crédito" },
        en: { heading: "Completely Free", description: "Start invoicing today — no credit card required" },
      },
    ],
    skip: { es: "Saltar", en: "Skip" },
    next: { es: "Siguiente", en: "Next" },
    start: { es: "Comenzar", en: "Get Started" },
  },
  login: {
    titleSignIn: { es: "Bienvenido de Nuevo", en: "Welcome Back" },
    titleSignUp: { es: "Crea tu Cuenta", en: "Create Your Account" },
    descSignIn: { es: "Inicia sesión en tu panel de facturación", en: "Sign in to your invoicing dashboard" },
    descSignUp: { es: "Comienza a gestionar tus facturas como un profesional", en: "Start managing your invoices like a pro" },
    google: { es: "Continuar con Google", en: "Continue with Google" },
    googleLoading: { es: "Conectando...", en: "Connecting..." },
    or: { es: "O", en: "OR" },
    email: { es: "Correo electrónico", en: "Email" },
    password: { es: "Contraseña", en: "Password" },
    loading: { es: "Cargando...", en: "Loading..." },
    signIn: { es: "Iniciar Sesión", en: "Sign In" },
    signUp: { es: "Crear Cuenta", en: "Create Account" },
    switchToSignUp: { es: "¿No tienes cuenta? Regístrate", en: "Need an account? Sign up" },
    switchToSignIn: { es: "¿Ya tienes cuenta? Inicia sesión", en: "Already have an account? Sign in" },
    checkEmail: { es: "Revisa tu correo para confirmar tu cuenta.", en: "Check your email to confirm your account." },
  },
  admin: {
    dashboard: { es: "Panel", en: "Dashboard" },
    clients: { es: "Clientes", en: "Clients" },
    products: { es: "Productos", en: "Products" },
    invoices: { es: "Facturas", en: "Invoices" },
    myBusiness: { es: "Mi Negocio", en: "My Business" },
    signOut: { es: "Cerrar Sesión", en: "Sign Out" },
    admin: { es: "Admin", en: "Admin" },
  },
  dashboard: {
    title: { es: "Panel", en: "Dashboard" },
    gettingStarted: { es: "🚀 Primeros Pasos", en: "🚀 Getting Started" },
    complete: { es: "completado", en: "complete" },
    completeProfile: { es: "Completa tu perfil de negocio", en: "Complete your business profile" },
    addClient: { es: "Agrega tu primer cliente", en: "Add your first client" },
    sendInvoice: { es: "Envía tu primera factura", en: "Send your first invoice" },
    invoices: { es: "Facturas", en: "Invoices" },
    clients: { es: "Clientes", en: "Clients" },
    paidTotal: { es: "Total Cobrado", en: "Paid Total" },
    recentInvoices: { es: "Facturas Recientes", en: "Recent Invoices" },
    noInvoices: { es: "Aún no hay facturas.", en: "No invoices yet." },
    noClient: { es: "Sin cliente", en: "No client" },
  },
} as const;

export function t(section: "onboarding" | "login" | "admin", key: string, lang: Lang): string {
  const s = translations[section] as any;
  const entry = s[key];
  if (!entry) return key;
  return entry[lang] || entry["en"] || key;
}

export function getSlideText(index: number, lang: Lang) {
  return translations.onboarding.slides[index][lang];
}
