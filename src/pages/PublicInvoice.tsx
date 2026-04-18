import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Invoice, { InvoiceData } from "@/components/Invoice";

const PublicInvoice = () => {
  const { slug } = useParams<{ slug: string }>();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchInvoice = async () => {
      setLoading(true);

      // Fetch invoice by public_share_slug
      const { data: invoice, error: invErr } = await supabase
        .from("invoices")
        .select("*")
        .eq("public_share_slug", slug)
        .single();

      if (invErr || !invoice) {
        setError("Invoice not found");
        setLoading(false);
        return;
      }

      // Fetch line items, client, and business profile in parallel
      const [lineItemsRes, clientRes, businessRes] = await Promise.all([
        supabase
          .from("invoice_line_items")
          .select("*")
          .eq("invoice_id", invoice.id)
          .order("sort_order", { ascending: true }),
        invoice.client_id
          ? supabase.from("clients").select("*").eq("id", invoice.client_id).single()
          : Promise.resolve({ data: null, error: null }),
        invoice.business_profile_id
          ? supabase.from("business_profiles").select("*").eq("id", invoice.business_profile_id).single()
          : Promise.resolve({ data: null, error: null }),
      ]);

      const lineItems = lineItemsRes.data || [];
      const client = clientRes.data;
      const business = businessRes.data;

      // Map to InvoiceData shape
      const mapped: InvoiceData = {
        invoiceNumber: invoice.invoice_number,
        date: new Date(invoice.issue_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        currency: invoice.currency === "USD" ? "USD" : "EUR",
        from: {
          name: business?.business_name || "",
          email: business?.email || "",
          phone: business?.phone || "",
          logoUrl: business?.logo_url || undefined,
          taxId: (business as any)?.tax_id || undefined,
          iban: (business as any)?.iban || undefined,
          bizum: (business as any)?.bizum || undefined,
          paymentTerms: (business as any)?.payment_terms || undefined,
          footerNote: (business as any)?.footer_note || undefined,
        },
        to: {
          name: client?.name || "",
          company: client?.company || "",
          phone: client?.phone || "",
        },
        items: lineItems.map((li) => ({
          description: li.description,
          unitPrice: Number(li.unit_price),
          quantity: Number(li.quantity),
          amount: Number(li.amount),
          waived: (li as any).waived ?? (Number(li.unit_price) > 0 && Number(li.amount) === 0),
        })),
        taxRate: Number(invoice.tax_rate),
        discountAmount: Number(invoice.discount_amount),
      };

      setInvoiceData(mapped);
      setLoading(false);
    };

    fetchInvoice();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Invoice Not Found</h1>
          <p className="text-muted-foreground">This invoice link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return <Invoice data={invoiceData} />;
};

export default PublicInvoice;
