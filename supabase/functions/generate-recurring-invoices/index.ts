import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const today = new Date().toISOString().split("T")[0];

  // Fetch active recurring invoices due today or earlier
  const { data: recurring, error: recErr } = await supabase
    .from("recurring_invoices")
    .select("*, recurring_invoice_line_items(*)")
    .eq("is_active", true)
    .lte("next_run_date", today);

  if (recErr) {
    return new Response(JSON.stringify({ error: recErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let generated = 0;

  for (const rec of recurring || []) {
    // Create the invoice
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .insert({
        user_id: rec.user_id,
        business_profile_id: rec.business_profile_id,
        client_id: rec.client_id,
        invoice_number: "",
        tax_rate: rec.tax_rate,
        notes: rec.notes,
        terms: rec.terms,
        currency: rec.currency,
        status: "draft",
      })
      .select("id")
      .single();

    if (invErr || !invoice) continue;

    // Copy line items
    const lineItems = (rec.recurring_invoice_line_items || []).map((li: any) => ({
      invoice_id: invoice.id,
      description: li.description,
      quantity: li.quantity,
      unit_price: li.unit_price,
      sort_order: li.sort_order,
    }));

    if (lineItems.length > 0) {
      await supabase.from("invoice_line_items").insert(lineItems);
    }

    // Compute next run date
    const nextDate = computeNextDate(rec.next_run_date, rec.frequency);
    await supabase
      .from("recurring_invoices")
      .update({ next_run_date: nextDate })
      .eq("id", rec.id);

    generated++;
  }

  return new Response(JSON.stringify({ generated }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

function computeNextDate(current: string, frequency: string): string {
  const d = new Date(current + "T00:00:00Z");
  switch (frequency) {
    case "weekly":
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case "biweekly":
      d.setUTCDate(d.getUTCDate() + 14);
      break;
    case "monthly":
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
    case "quarterly":
      d.setUTCMonth(d.getUTCMonth() + 3);
      break;
    case "yearly":
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
  }
  return d.toISOString().split("T")[0];
}
