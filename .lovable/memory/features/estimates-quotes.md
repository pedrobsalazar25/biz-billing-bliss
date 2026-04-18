---
name: estimates-quotes
description: Custom numbering EST-Q*, clone to invoice conversion, public sharing at /e/:slug
type: feature
---
- Numbering: EST-Q##### (auto via trigger using business_profile prefix).
- Clone-to-invoice: copies line items, marks status=converted, links via converted_invoice_id.
- Public sharing: estimates have `is_shared` + `public_share_slug` (auto-generated trigger). Becomes shareable when status moves to sent/approved (auto-flips is_shared=true). Public route: `/e/:slug` rendered by `PublicEstimate.tsx` reusing the Invoice component. RLS allows anon SELECT on estimates + line items + business_profiles + clients when is_shared=true and status in (sent,approved,converted).
- ShareActions on EstimateDetail uses client phone for direct WhatsApp.
