import logo from "@/assets/logo.png";

const Invoice = () => {
  const invoiceData = {
    invoiceNumber: "INV-001",
    date: "January 29, 2025",
    from: {
      name: "Pedro Barrios",
      email: "pedrorafaelbarriossalazar@gmail.com",
      phone: "+34 604 06 58 49",
    },
    to: {
      name: "Daniel Hidalgo",
      company: "HB BIKE Tours",
      phone: "+34 631 08 18 19",
    },
    items: [
      {
        description: "Web Development Services",
        unitPrice: 660,
        quantity: 1,
        amount: 660,
        waived: false,
      },
      {
        description: "AI Image Generation & Sizing",
        unitPrice: 70,
        quantity: 1,
        amount: 70,
        waived: false,
      },
      {
        description: "Basic Website Domain (1 year)",
        unitPrice: 9.99,
        quantity: 1,
        amount: 9.99,
        waived: true,
      },
      {
        description: "Basic Hosting (1 year)",
        unitPrice: 60,
        quantity: 1,
        amount: 60,
        waived: true,
      },
      {
        description: "Extra Hosting for E-commerce Platform",
        unitPrice: 90,
        quantity: 1,
        amount: 90,
        waived: false,
      },
    ],
  };

  const subtotal = invoiceData.items.reduce(
    (sum, item) => sum + (item.waived ? 0 : item.amount),
    0
  );

  const waivedTotal = invoiceData.items.reduce(
    (sum, item) => sum + (item.waived ? item.amount : 0),
    0
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-card shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="invoice-header-bg px-6 py-8 md:px-10 md:py-10 relative">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl md:text-5xl font-display text-primary-foreground mb-2">
                Invoice
              </h1>
              <p className="text-primary-foreground/70 text-sm max-w-xs">
                Web Development Services
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-primary-foreground/80 text-sm hidden md:block">
                Pedro Barrios
              </span>
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary-foreground flex items-center justify-center overflow-hidden">
                <img src={logo} alt="PB Logo" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Client Info & Invoice Details */}
          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <div className="invoice-orange-bg rounded-xl p-5 flex-1">
              <p className="text-xs font-semibold text-invoice-dark/70 mb-1">Invoice To</p>
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
                <p className="text-xs font-semibold text-invoice-dark/70">No. Invoice:</p>
                <p className="text-sm font-bold text-invoice-dark">{invoiceData.invoiceNumber}</p>
              </div>
              <div className="mb-3">
                <p className="text-xs font-semibold text-invoice-dark/70">Date:</p>
                <p className="text-sm font-bold text-invoice-dark">{invoiceData.date}</p>
              </div>
              <div className="bg-invoice-dark rounded-lg py-2 px-3 text-center mt-4">
                <p className="text-xl font-bold text-primary-foreground">€{subtotal.toFixed(2)}</p>
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
                    Item Description
                  </th>
                  <th className="text-right py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="text-center py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="text-right py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, index) => (
                  <tr
                    key={index}
                    className={`border-b border-invoice-dark/5 ${
                      item.waived ? "opacity-60" : ""
                    }`}
                  >
                    <td className="py-4 text-sm font-medium text-foreground">
                      {item.description}
                      {item.waived && (
                        <span className="ml-2 text-xs bg-invoice-coral/20 text-invoice-coral px-2 py-0.5 rounded-full">
                          Included
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-sm text-right text-muted-foreground">
                      €{item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-4 text-sm text-center text-muted-foreground">
                      {item.quantity.toString().padStart(2, "0")}
                    </td>
                    <td className="py-4 text-sm text-right font-medium text-foreground">
                      {item.waived ? (
                        <span className="line-through text-muted-foreground">
                          €{item.amount.toFixed(2)}
                        </span>
                      ) : (
                        `€${item.amount.toFixed(2)}`
                      )}
                    </td>
                  </tr>
                ))}
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
                  <span className="text-muted-foreground">Waived Services:</span>
                  <span className="text-invoice-coral font-medium">-€{waivedTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-invoice-dark/10 pt-3 mt-2">
                <span className="text-foreground">Total:</span>
                <span className="text-invoice-dark">€{subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="invoice-gradient px-6 py-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-xs font-semibold text-primary-foreground/70 uppercase tracking-wider mb-1">
              From
            </p>
            <p className="text-lg font-bold text-primary-foreground">
              {invoiceData.from.name}
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 text-sm text-primary-foreground/90">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {invoiceData.from.email}
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {invoiceData.from.phone}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
