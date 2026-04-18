
The WhatsApp link in `src/components/ShareActions.tsx` is built like this:

**Structure:**
```text
https://wa.me/{phone}?text={url-encoded-message}
```

- `{phone}` — client's phone, sanitized to digits only (country code + number, no `+`, spaces, or dashes). If no client phone is on file, it falls back to `https://wa.me/?text=...` (WhatsApp asks the user to pick a contact).
- `{text}` — the URL-encoded message body.

**Code that builds it (`ShareActions.tsx`):**
```ts
const waMsg = encodeURIComponent(buildWaMessage());
const waPhone = (clientPhone || "").replace(/[^\d]/g, "");
const waUrl = waPhone
  ? `https://wa.me/${waPhone}?text=${waMsg}`
  : `https://wa.me/?text=${waMsg}`;
```

**Decoded message body (EN example):**
```text
Hi {clientName} 👋

Hope you're doing well! Here is your {documentLabel} from {senderName} for a total of *{totalFormatted}*.

View & download:
{publicUrl}

Thank you for your business!

---
{senderName}
✉️ {business.email}
📞 {business.phone}
📍 {business.address}
```

**Concrete example** (client Peter, +34 604065849, invoice INV-00004, total €660.00):
```text
https://wa.me/34604065849?text=Hi%20Peter%20%F0%9F%91%8B%0A%0AHope%20you're%20doing%20well!%20Here%20is%20your%20Invoice%20INV-00004%20from%20Pedro%20Barrios%20for%20a%20total%20of%20*%E2%82%AC660.00*.%0A%0AView%20%26%20download%3A%0Ahttps%3A%2F%2Finvoice-pedro.lovable.app%2Fi%2Fpeter-04%0A%0AThank%20you%20for%20your%20business!%0A%0A---%0APedro%20Barrios%0A%E2%9C%89%EF%B8%8F%20hello%40example.com%0A%F0%9F%93%9E%20%2B34%20...
```

When language is `es`, the body switches to the Spanish equivalent (Hola / Aquí tienes tu / Ver y descargar / ¡Gracias por tu confianza!).

**Note:** This is the `wa.me` "click to chat" format — it works on both mobile WhatsApp and WhatsApp Web, and pre-fills the message in the chat with the given phone number. No plan changes needed — this is purely informational.
