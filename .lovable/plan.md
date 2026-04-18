
You're clarifying that the "From" block currently just shows who's sending the invoice (name, address, contact). You want ideas for what to add **below it** in the footer area to make it more complete/professional.

## Recommended footer additions for a Spanish freelancer

Grouped from most to least essential:

**1. Legal / fiscal (essential in Spain)**
- NIF/CIF/NIE number — legally required on Spanish invoices
- IRPF retention line if applicable (e.g. "Retención IRPF -15%")
- IVA exemption note if applicable

**2. Payment instructions (highest practical value)**
- IBAN for bank transfer
- Bizum number
- Accepted methods (PayPal, Stripe link, Wise)
- Payment terms ("Pago a 15 días" / "Net 30")

**3. Trust & brand**
- Thank-you message ("Gracias por tu confianza")
- Website + social handles
- Tagline

**4. Optional polish**
- QR code linking to public invoice or payment
- Late payment policy
- Signature image

## My pick for your invoice (3 compact lines)

```
NIF: 12345678X
Pago: IBAN ES00 0000 0000 0000 0000 · Bizum 600 000 000 · Pago a 15 días
Gracias por tu confianza
```

Covers legal requirement, makes payment frictionless, ends warm.

## If you approve, implementation plan

1. **DB migration** — add to `business_profiles`: `nif`, `iban`, `bizum`, `payment_terms`, `footer_note`.
2. **`BusinessProfile.tsx`** — add a new "Payment & Footer" card with these inputs.
3. **`Invoice.tsx`** — extend `InvoiceData.from` shape and render a footer block under the From section showing only the fields that have values.
4. **`PublicInvoice.tsx`** + **`InvoiceDetail.tsx`** + **`EstimateDetail.tsx`** — pass new fields from `business_profiles` into `InvoiceData.from`.

Tell me which fields you want included and I'll build it.
