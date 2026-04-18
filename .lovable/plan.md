
Add an Eye icon button to `ShareActions.tsx` that opens the public URL in a new tab.

**Change** (`src/components/ShareActions.tsx`):
1. Import `Eye` from lucide-react.
2. Switch mobile button group from `grid-cols-3` back to `grid-cols-4`.
3. Add new "View" button as the first item in the button group (visible on both mobile and desktop), styled `variant="outline"`, `h-8 min-w-0 px-2`, with `Eye` icon + "View" label on mobile.
4. Keep existing PDF (desktop only), Copy, Email, WhatsApp buttons unchanged.

Result on mobile: 4 even columns — View, Copy, Email, WA.
Result on desktop: PDF, View, Copy, Email, WhatsApp inline.

No changes needed in `InvoiceDetail.tsx` or `EstimateDetail.tsx` — they consume `ShareActions` and pick it up automatically.
