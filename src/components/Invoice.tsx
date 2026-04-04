import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { ChevronDown } from "lucide-react";
import { generatePdf } from "@/lib/generatePdf";

type Language = "en" | "es";

interface TranslatedTexts {
  title: string;
  subtitle: string;
  invoiceTo: string;
  invoiceNumber: string;
  date: string;
  itemDescription: string;
  unitPrice: string;
  qty: string;
  amount: string;
  included: string;
  waivedServices: string;
  total: string;
  from: string;
  downloadPdf: string;
  translate: string;
  translating: string;
}

const englishTexts: TranslatedTexts = {
  title: "Invoice",
  subtitle: "Web Development Services",
  invoiceTo: "Invoice To",
  invoiceNumber: "No. Invoice:",
  date: "Date:",
  itemDescription: "Item Description",
  unitPrice: "Unit Price",
  qty: "Qty",
  amount: "Amount",
  included: "Included",
  waivedServices: "Waived Services:",
  total: "Total:",
  from: "From",
  downloadPdf: "Download PDF",
  translate: "Traducir a Español",
  translating: "Translating...",
};

const spanishTexts: TranslatedTexts = {
  title: "Factura",
  subtitle: "Servicios de Desarrollo Web",
  invoiceTo: "Factura Para",
  invoiceNumber: "Nº Factura:",
  date: "Fecha:",
  itemDescription: "Descripción del Artículo",
  unitPrice: "Precio Unitario",
  qty: "Cant",
  amount: "Importe",
  included: "Incluido",
  waivedServices: "Servicios Exentos:",
  total: "Total:",
  from: "De",
  downloadPdf: "Descargar PDF",
  translate: "Translate to English",
  translating: "Traduciendo...",
};

export interface InvoiceItem {
  description: string;
  unitPrice: number;
  quantity: number;
  amount: number;
  waived: boolean;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  currency: string;
  from: {
    name: string;
    email: string;
    phone: string;
    logoUrl?: string;
  };
  to: {
    name: string;
    company: string;
    phone: string;
  };
  items: InvoiceItem[];
  taxRate: number;
  discountAmount: number;
}

interface InvoiceProps {
  data?: InvoiceData;
}

const Invoice = ({ data }: InvoiceProps) => {
  const [language, setLanguage] = useState<Language>("es");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedItems, setTranslatedItems] = useState<Record<number, string> | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const texts = language === "en" ? englishTexts : spanishTexts;

  const defaultData: InvoiceData = {
    invoiceNumber: "INV-0017",
    date: language === "en" ? "January 29, 2025" : "29 de Enero de 2025",
    currency: "EUR",
    from: {
      name: "Your Business",
      email: "email@example.com",
      phone: "+1 000 000 0000",
    },
    to: {
      name: "Client Name",
      company: "Client Company",
      phone: "+1 000 000 0000",
    },
    items: [
      { description: "Web Development Services", unitPrice: 660, quantity: 1, amount: 660, waived: false },
    ],
    taxRate: 0,
    discountAmount: 0,
  };

  const invoiceData = data || defaultData;
  const currencySymbol = invoiceData.currency === "USD" ? "$" : "€";

  const subtotal = invoiceData.items.reduce(
    (sum, item) => sum + (item.waived ? 0 : item.amount),
    0
  );

  const waivedTotal = invoiceData.items.reduce(
    (sum, item) => sum + (item.waived ? item.unitPrice * item.quantity : 0),
    0
  );

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await generatePdf(invoiceRef.current, `invoice-${invoiceData.invoiceNumber}`);
      toast.success(language === "en" ? "PDF downloaded!" : "¡PDF descargado!");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const toggleExpanded = (index: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Split description into name and detail parts
  const parseDescription = (desc: string) => {
    const dashIndex = desc.indexOf(" — ");
    if (dashIndex >= 0) {
      return { name: desc.substring(0, dashIndex), detail: desc.substring(dashIndex + 3) };
    }
    return { name: desc, detail: null };
  };

  const getDisplayDescription = (item: InvoiceItem, index: number) => {
    const translated = translatedItems?.[index];
    return translated || item.description;
  };

  const handleTranslate = async () => {
    setIsTranslating(true);
    try {
      const targetLang = language === "en" ? "es" : "en";

      // Translate item descriptions via edge function
      const itemTexts: Record<string, string> = {};
      invoiceData.items.forEach((item, i) => {
        itemTexts[`item_${i}`] = getDisplayDescription(item, i);
      });

      const { data: transData, error: transErr } = await supabase.functions.invoke("translate", {
        body: { texts: itemTexts, targetLanguage: targetLang },
      });

      if (!transErr && transData?.translations) {
        const newTranslated: Record<number, string> = {};
        invoiceData.items.forEach((_, i) => {
          if (transData.translations[`item_${i}`]) {
            newTranslated[i] = transData.translations[`item_${i}`];
          }
        });
        setTranslatedItems(newTranslated);
      }

      setLanguage(targetLang);
      toast.success(language === "en" ? "Traducido a Español" : "Translated to English");
    } catch (error) {
      toast.error("Translation failed");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24 md:pb-8 flex flex-col items-center justify-center gap-4">
      {/* Action Buttons - Desktop */}
      <div className="no-print hidden md:flex flex-wrap justify-center gap-3">
        <button
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="flex items-center gap-2 bg-invoice-dark hover:bg-invoice-dark/90 text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {texts.downloadPdf}
        </button>
        <button
          onClick={handleTranslate}
          disabled={isTranslating}
          className="flex items-center gap-2 bg-invoice-orange hover:bg-invoice-orange/90 text-invoice-dark px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          {isTranslating ? texts.translating : texts.translate}
        </button>
        <a
          href={`tel:${invoiceData.from.phone}`}
          className="flex items-center justify-center bg-invoice-coral hover:bg-invoice-coral/90 text-primary-foreground w-12 h-12 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105"
          title={language === "en" ? "Call" : "Llamar"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </a>
        <a
          href={`mailto:${invoiceData.from.email}?subject=Invoice%20${invoiceData.invoiceNumber}`}
          className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-primary-foreground w-12 h-12 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105"
          title="Email"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </a>
        <a
          href={`https://wa.me/${invoiceData.from.phone.replace(/[^0-9]/g, '')}?text=Hello%20Pedro%2C%20I%20have%20a%20question%20about%20invoice%20${invoiceData.invoiceNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-primary-foreground w-12 h-12 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105"
          title="WhatsApp"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="no-print fixed bottom-0 left-0 right-0 md:hidden bg-card/95 backdrop-blur-sm border-t border-border py-3 px-4 flex justify-around items-center z-50">
        <a href={`tel:${invoiceData.from.phone}`} className="flex flex-col items-center justify-center text-invoice-coral active:scale-95 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </a>
        <a href={`mailto:${invoiceData.from.email}?subject=Invoice%20${invoiceData.invoiceNumber}`} className="flex flex-col items-center justify-center text-blue-500 active:scale-95 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </a>
        <a href={`https://wa.me/${invoiceData.from.phone.replace(/[^0-9]/g, '')}?text=Hello%20Pedro`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center text-green-500 active:scale-95 transition-transform">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
        <button onClick={handleTranslate} disabled={isTranslating} className="flex flex-col items-center justify-center text-invoice-orange active:scale-95 transition-transform disabled:opacity-50">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        </button>
        <button onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="flex flex-col items-center justify-center text-foreground active:scale-95 transition-transform disabled:opacity-50">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>

      <div className="w-full max-w-3xl bg-card shadow-2xl rounded-2xl overflow-hidden print-container">
        {/* Header */}
        <div className="invoice-header-bg px-6 py-8 md:px-10 md:py-10 relative">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl md:text-5xl font-display text-primary-foreground mb-2">
                {texts.title}
              </h1>
              <p className="text-primary-foreground/70 text-sm max-w-xs">
                {texts.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-primary-foreground/80 text-sm hidden md:block">
                {invoiceData.from.name}
              </span>
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary-foreground flex items-center justify-center overflow-hidden">
                {invoiceData.from.logoUrl ? (
                  <img src={invoiceData.from.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                )}
              </div>
            </div>
          </div>

          {/* Client Info & Invoice Details */}
          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <div className="invoice-orange-bg rounded-xl p-5 flex-1">
              <p className="text-xs font-semibold text-invoice-dark/70 mb-1">{texts.invoiceTo}</p>
              <h2 className="text-xl font-bold text-invoice-dark mb-2">
                {invoiceData.to.name}
              </h2>
              <p className="text-sm text-invoice-dark/80">{invoiceData.to.company}</p>
              <div className="flex items-center gap-2 mt-3 text-sm text-invoice-dark/80">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {invoiceData.to.phone}
              </div>
            </div>

            <div className="invoice-yellow-bg rounded-xl p-5 md:w-48">
              <div className="mb-3">
                <p className="text-xs font-semibold text-invoice-dark/70">{texts.invoiceNumber}</p>
                <p className="text-sm font-bold text-invoice-dark">{invoiceData.invoiceNumber}</p>
              </div>
              <div className="mb-3">
                <p className="text-xs font-semibold text-invoice-dark/70">{texts.date}</p>
                <p className="text-sm font-bold text-invoice-dark">{invoiceData.date}</p>
              </div>
              <div className="bg-invoice-dark rounded-lg py-2 px-3 text-center mt-4">
                <p className="text-xl font-bold text-primary-foreground">{currencySymbol}{subtotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="px-6 py-8 md:px-10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-invoice-dark/10">
                  <th className="text-left py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {texts.itemDescription}
                  </th>
                  <th className="text-right py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {texts.unitPrice}
                  </th>
                  <th className="text-center py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {texts.qty}
                  </th>
                  <th className="text-right py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {texts.amount}
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, index) => {
                  const displayDesc = getDisplayDescription(item, index);
                  const { name, detail } = parseDescription(displayDesc);
                  const isExpanded = expandedItems.has(index);

                  return (
                    <tr
                      key={index}
                      className={`border-b border-invoice-dark/5 ${
                        item.waived ? "opacity-60" : ""
                      }`}
                    >
                      <td className="py-4 text-sm font-medium text-foreground">
                        <div className="flex items-center gap-1">
                          <span>{name}</span>
                          {detail && (
                            <button
                              onClick={() => toggleExpanded(index)}
                              className="no-print ml-1 p-0.5 rounded hover:bg-muted transition-colors"
                            >
                              <ChevronDown
                                className={`h-4 w-4 text-muted-foreground transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          )}
                          {item.waived && (
                            <span className="ml-2 text-xs bg-invoice-coral/20 text-invoice-coral px-2 py-0.5 rounded-full">
                              {texts.included}
                            </span>
                          )}
                        </div>
                        {detail && isExpanded && (
                          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                        )}
                      </td>
                      <td className="py-4 text-sm text-right text-muted-foreground">
                        {currencySymbol}{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-4 text-sm text-center text-muted-foreground">
                        {item.quantity.toString().padStart(2, "0")}
                      </td>
                      <td className="py-4 text-sm text-right font-medium text-foreground">
                        {item.waived ? (
                          <span className="line-through text-muted-foreground">
                            {currencySymbol}{(item.unitPrice * item.quantity).toFixed(2)}
                          </span>
                        ) : (
                          `${currencySymbol}${item.amount.toFixed(2)}`
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Decorative Stars */}
          <div className="flex gap-1 my-6">
            <span className="text-invoice-coral text-2xl">✱</span>
            <span className="text-invoice-orange text-2xl">✱</span>
            <span className="text-invoice-yellow text-2xl">✱</span>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="invoice-cream-bg rounded-xl p-5 w-full md:w-72">
              {waivedTotal > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{texts.waivedServices}</span>
                  <span className="text-invoice-coral font-medium">-{currencySymbol}{waivedTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-invoice-dark/10 pt-3 mt-2">
                <span className="text-foreground">{texts.total}</span>
                <span className="text-invoice-dark">{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="invoice-gradient px-6 py-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-xs font-semibold text-primary-foreground/70 uppercase tracking-wider mb-1">
              {texts.from}
            </p>
            <p className="text-lg font-bold text-primary-foreground">
              {invoiceData.from.name}
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 text-sm text-primary-foreground/90">
            {invoiceData.from.email && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {invoiceData.from.email}
              </div>
            )}
            {invoiceData.from.phone && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {invoiceData.from.phone}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
