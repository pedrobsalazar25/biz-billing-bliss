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
    recurring: { es: "Recurrentes", en: "Recurring" },
    expenses: { es: "Gastos", en: "Expenses" },
    reports: { es: "Reportes", en: "Reports" },
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
  clients: {
    title: { es: "Clientes", en: "Clients" },
    uploadCsv: { es: "Subir CSV", en: "Upload CSV" },
    addClient: { es: "Agregar Cliente", en: "Add Client" },
    editClient: { es: "Editar Cliente", en: "Edit Client" },
    newClient: { es: "Nuevo Cliente", en: "New Client" },
    name: { es: "Nombre", en: "Name" },
    email: { es: "Correo electrónico", en: "Email" },
    phone: { es: "Teléfono", en: "Phone" },
    company: { es: "Empresa", en: "Company" },
    saving: { es: "Guardando...", en: "Saving..." },
    save: { es: "Guardar", en: "Save" },
    noClients: { es: "Aún no hay clientes.", en: "No clients yet." },
    loading: { es: "Cargando...", en: "Loading..." },
    deleteConfirm: { es: "¿Eliminar este cliente?", en: "Delete this client?" },
    clientCreated: { es: "Cliente creado", en: "Client created" },
    clientUpdated: { es: "Cliente actualizado", en: "Client updated" },
    clientDeleted: { es: "Cliente eliminado", en: "Client deleted" },
  },
  products: {
    title: { es: "Productos", en: "Products" },
    uploadCsv: { es: "Subir CSV", en: "Upload CSV" },
    newProduct: { es: "Nuevo Producto", en: "New Product" },
    editProduct: { es: "Editar Producto", en: "Edit Product" },
    name: { es: "Nombre", en: "Name" },
    description: { es: "Descripción", en: "Description" },
    unitPrice: { es: "Precio Unitario", en: "Unit Price" },
    noDescription: { es: "Sin descripción", en: "No description" },
    noProducts: { es: "Aún no hay productos.", en: "No products yet." },
    loading: { es: "Cargando...", en: "Loading..." },
    saving: { es: "Guardando...", en: "Saving..." },
    updateProduct: { es: "Actualizar Producto", en: "Update Product" },
    createProduct: { es: "Crear Producto", en: "Create Product" },
    deleteConfirm: { es: "¿Eliminar este producto?", en: "Delete this product?" },
    productCreated: { es: "Producto creado", en: "Product created" },
    productUpdated: { es: "Producto actualizado", en: "Product updated" },
    productDeleted: { es: "Producto eliminado", en: "Product deleted" },
  },
  invoicesPage: {
    title: { es: "Facturas", en: "Invoices" },
    newInvoice: { es: "Nueva Factura", en: "New Invoice" },
    createInvoice: { es: "Crear Factura", en: "Create Invoice" },
    client: { es: "Cliente", en: "Client" },
    selectClient: { es: "Seleccionar cliente", en: "Select client" },
    dueDate: { es: "Fecha de Vencimiento", en: "Due Date" },
    taxRate: { es: "Tasa de Impuesto (%)", en: "Tax Rate (%)" },
    notes: { es: "Notas", en: "Notes" },
    creating: { es: "Creando...", en: "Creating..." },
    noInvoices: { es: "Aún no hay facturas.", en: "No invoices yet." },
    loading: { es: "Cargando...", en: "Loading..." },
    noClient: { es: "Sin cliente", en: "No client" },
    deleteConfirm: { es: "¿Eliminar esta factura?", en: "Delete this invoice?" },
    draft: { es: "Borrador", en: "Draft" },
    sent: { es: "Enviada", en: "Sent" },
    paid: { es: "Pagada", en: "Paid" },
    void: { es: "Anulada", en: "Void" },
  },
  invoiceDetail: {
    loading: { es: "Cargando...", en: "Loading..." },
    notFound: { es: "Factura no encontrada.", en: "Invoice not found." },
    lineItems: { es: "Productos / Líneas", en: "Products / Line Items" },
    addProduct: { es: "Agregar Producto", en: "Add Product" },
    editProduct: { es: "Editar Producto", en: "Edit Product" },
    pickProduct: { es: "Elegir de productos guardados", en: "Pick from saved products" },
    selectProduct: { es: "Seleccionar producto...", en: "Select a product..." },
    description: { es: "Descripción", en: "Description" },
    placeholder: { es: "Nombre del producto o servicio", en: "Product or service name" },
    quantity: { es: "Cantidad", en: "Quantity" },
    unitPrice: { es: "Precio Unitario", en: "Unit Price" },
    amount: { es: "Monto", en: "Amount" },
    waive: { es: "Eximir este servicio (incluido sin cargo)", en: "Waive this service (included at no charge)" },
    waived: { es: "Eximido", en: "Waived" },
    saving: { es: "Guardando...", en: "Saving..." },
    updateProduct: { es: "Actualizar Producto", en: "Update Product" },
    noItems: { es: 'Aún no hay productos. Haz clic en "Agregar Producto" para comenzar.', en: 'No products yet. Click "Add Product" to get started.' },
    subtotal: { es: "Subtotal", en: "Subtotal" },
    tax: { es: "Impuesto", en: "Tax" },
    discount: { es: "Descuento", en: "Discount" },
    total: { es: "Total", en: "Total" },
    removeConfirm: { es: "¿Eliminar este producto?", en: "Remove this product?" },
    descriptionRequired: { es: "La descripción es obligatoria", en: "Description is required" },
  },
  profile: {
    title: { es: "Perfil de Negocio", en: "Business Profile" },
    setupTitle: { es: "Configura tu Negocio", en: "Set Up Your Business" },
    subtitle: { es: "Información de tu empresa que aparece en las facturas", en: "Your company information shown on invoices" },
    welcome: { es: "👋 ¡Bienvenido a tu panel de facturación!", en: "👋 Welcome to your invoicing dashboard!" },
    welcomeDesc: { es: "Vamos a configurar tu perfil de negocio. Esta información aparecerá en cada factura que envíes.", en: "Let's get your business profile set up. This info will appear on every invoice you send." },
    complete: { es: "completado", en: "complete" },
    businessName: { es: "Nombre del negocio", en: "Business name" },
    contactInfo: { es: "Info de contacto", en: "Contact info" },
    address: { es: "Dirección", en: "Address" },
    logo: { es: "Logo", en: "Logo" },
    companyLogo: { es: "Logo de la Empresa", en: "Company Logo" },
    uploadLogo: { es: "Subir Logo", en: "Upload Logo" },
    changeLogo: { es: "Cambiar Logo", en: "Change Logo" },
    uploading: { es: "Subiendo...", en: "Uploading..." },
    logoHint: { es: "PNG, JPG hasta 2MB. Se muestra en las facturas.", en: "PNG, JPG up to 2MB. Shown on invoices." },
    companyDetails: { es: "Datos de la Empresa", en: "Company Details" },
    businessNameLabel: { es: "Nombre del Negocio *", en: "Business Name *" },
    email: { es: "Correo electrónico", en: "Email" },
    phone: { es: "Teléfono", en: "Phone" },
    taxId: { es: "ID Fiscal / NIF", en: "Tax ID / VAT" },
    invoicePrefix: { es: "Prefijo de Factura", en: "Invoice Prefix" },
    addressTitle: { es: "Dirección", en: "Address" },
    addressLine1: { es: "Línea de Dirección 1", en: "Address Line 1" },
    addressLine2: { es: "Línea de Dirección 2", en: "Address Line 2" },
    city: { es: "Ciudad", en: "City" },
    state: { es: "Estado / Provincia", en: "State / Province" },
    postalCode: { es: "Código Postal", en: "Postal Code" },
    country: { es: "País", en: "Country" },
    saving: { es: "Guardando...", en: "Saving..." },
    saveProfile: { es: "Guardar Perfil", en: "Save Profile" },
  },
  expenses: {
    title: { es: "Gastos", en: "Expenses" },
    newExpense: { es: "Nuevo Gasto", en: "New Expense" },
    editExpense: { es: "Editar Gasto", en: "Edit Expense" },
    description: { es: "Descripción", en: "Description" },
    descriptionPlaceholder: { es: "Ej: Suministros de oficina", en: "E.g. Office supplies" },
    amount: { es: "Monto", en: "Amount" },
    date: { es: "Fecha", en: "Date" },
    category: { es: "Categoría", en: "Category" },
    vendor: { es: "Proveedor", en: "Vendor" },
    notes: { es: "Notas", en: "Notes" },
    saving: { es: "Guardando...", en: "Saving..." },
    createExpense: { es: "Crear Gasto", en: "Create Expense" },
    updateExpense: { es: "Actualizar Gasto", en: "Update Expense" },
    expenseCreated: { es: "Gasto creado", en: "Expense created" },
    expenseUpdated: { es: "Gasto actualizado", en: "Expense updated" },
    expenseDeleted: { es: "Gasto eliminado", en: "Expense deleted" },
    deleteConfirm: { es: "¿Eliminar este gasto?", en: "Delete this expense?" },
    totalExpenses: { es: "Total de Gastos", en: "Total Expenses" },
    noExpenses: { es: "Aún no hay gastos registrados.", en: "No expenses yet." },
    loading: { es: "Cargando...", en: "Loading..." },
    office_supplies: { es: "Suministros de oficina", en: "Office Supplies" },
    travel: { es: "Viajes", en: "Travel" },
    utilities: { es: "Servicios", en: "Utilities" },
    rent: { es: "Alquiler", en: "Rent" },
    software: { es: "Software", en: "Software" },
    marketing: { es: "Marketing", en: "Marketing" },
    insurance: { es: "Seguros", en: "Insurance" },
    professional_services: { es: "Servicios profesionales", en: "Professional Services" },
    meals: { es: "Comidas", en: "Meals" },
    equipment: { es: "Equipamiento", en: "Equipment" },
    other: { es: "Otro", en: "Other" },
  },
  recurring: {
    title: { es: "Facturas Recurrentes", en: "Recurring Invoices" },
    new: { es: "Nueva Recurrente", en: "New Recurring" },
    create: { es: "Crear Factura Recurrente", en: "Create Recurring Invoice" },
    client: { es: "Cliente", en: "Client" },
    selectClient: { es: "Seleccionar cliente", en: "Select client" },
    frequency: { es: "Frecuencia", en: "Frequency" },
    weekly: { es: "Semanal", en: "Weekly" },
    biweekly: { es: "Quincenal", en: "Biweekly" },
    monthly: { es: "Mensual", en: "Monthly" },
    quarterly: { es: "Trimestral", en: "Quarterly" },
    yearly: { es: "Anual", en: "Yearly" },
    nextRunDate: { es: "Próxima Fecha", en: "Next Run Date" },
    taxRate: { es: "Tasa de Impuesto (%)", en: "Tax Rate (%)" },
    notes: { es: "Notas", en: "Notes" },
    creating: { es: "Creando...", en: "Creating..." },
    created: { es: "Factura recurrente creada", en: "Recurring invoice created" },
    deleted: { es: "Factura recurrente eliminada", en: "Recurring invoice deleted" },
    loading: { es: "Cargando...", en: "Loading..." },
    noItems: { es: "Aún no hay facturas recurrentes.", en: "No recurring invoices yet." },
    noClient: { es: "Sin cliente", en: "No client" },
    nextLabel: { es: "Próxima", en: "Next" },
    active: { es: "Activa", en: "Active" },
    paused: { es: "Pausada", en: "Paused" },
    deleteConfirm: { es: "¿Eliminar esta factura recurrente?", en: "Delete this recurring invoice?" },
  },
  reports: {
    title: { es: "Reportes y Análisis", en: "Reports & Analytics" },
    totalRevenue: { es: "Ingresos Totales", en: "Total Revenue" },
    totalExpenses: { es: "Gastos Totales", en: "Total Expenses" },
    netProfit: { es: "Ganancia Neta", en: "Net Profit" },
    monthlyOverview: { es: "Resumen Mensual", en: "Monthly Overview" },
    revenue: { es: "Ingresos", en: "Revenue" },
    expenses: { es: "Gastos", en: "Expenses" },
    expensesByCategory: { es: "Gastos por Categoría", en: "Expenses by Category" },
    invoiceStatus: { es: "Estado de Facturas", en: "Invoice Status" },
    noData: { es: "Aún no hay datos para mostrar.", en: "No data to display yet." },
  },
} as const;

export function t(section: "onboarding" | "login" | "admin" | "dashboard" | "clients" | "products" | "invoicesPage" | "invoiceDetail" | "profile" | "expenses" | "recurring" | "reports", key: string, lang: Lang): string {
  const s = translations[section] as any;
  const entry = s[key];
  if (!entry) return key;
  return entry[lang] || entry["en"] || key;
}

export function getSlideText(index: number, lang: Lang) {
  return translations.onboarding.slides[index][lang];
}
