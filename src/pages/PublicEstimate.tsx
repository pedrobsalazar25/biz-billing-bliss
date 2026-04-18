import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Invoice, { InvoiceData } from "@/components/Invoice";

const PublicEstimate = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchEstimate = async () => {
      setLoading(true);

      const { data: estimate, error: estErr } = await supabase
        .from("estimates")
        .select("*")
        .eq("public_share_slug", slug)
        .maybeSingle();

      if (estErr || !estimate) {
        setError("Estimate not found");
        setLoading(false);
        return;
      }

      const [lineItemsRes, clientRes, businessRes] = await Promise.all([
        supabase
          .from("estimate_line_items")
          .select("*")
          .eq("estimate_id", estimate.id)
          .order("sort_order", { ascending: true }),
        estimate.client_id
          ? supabase.from("clients").select("*").eq("id", estimate.client_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        estimate.business_profile_id
          ? supabase.from("business_profiles").select("*").eq("id", estimate.business_profile_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      const lineItems = lineItemsRes.data || [];
      const client = clientRes.data as any;
      const business = businessRes.data as any;

      const mapped: InvoiceData = {
        invoiceNumber: estimate.estimate_number,
        date: new Date(estimate.issue_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        currency: estimate.currency === "USD" ? "USD" : "EUR",
        from: {
          name: business?.business_name || "",
          email: business?.email || "",
          phone: business?.phone || "",
          logoUrl: business?.logo_url || undefined,
          taxId: business?.tax_id || undefined,
          iban: business?.iban || undefined,
          bizum: business?.bizum || undefined,
          paymentTerms: business?.payment_terms || undefined,
          footerNote: business?.footer_note || undefined,
          address: business
            ? [
                business.address_line1,
                business.address_line2,
                [business.postal_code, business.city].filter(Boolean).join(" "),
                [business.state, business.country].filter(Boolean).join(", "),
              ]
                .filter((l) => l && String(l).trim().length > 0)
                .join("\n") || undefined
            : undefined,
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
          waived: Number(li.unit_price) > 0 && Number(li.amount) === 0,
        })),
        taxRate: Number(estimate.tax_rate),
        discountAmount: Number(estimate.discount_amount),
      };

      setData(mapped);
      setLoading(false);
    };

    fetchEstimate();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Estimate Not Found</h1>
          <p className="text-muted-foreground">This estimate link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return <Invoice data={data} />;
};

export default PublicEstimate;
