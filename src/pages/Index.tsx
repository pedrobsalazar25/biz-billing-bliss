import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Users,
  Zap,
  Globe,
  Upload,
  BarChart3,
  Check,
  ArrowRight,
  Star,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Professional Invoices",
    desc: "Create polished invoices with your logo, branding, and custom line items in seconds.",
  },
  {
    icon: Users,
    title: "Client Management",
    desc: "Keep all your client details organized — contacts, addresses, and invoice history.",
  },
  {
    icon: Globe,
    title: "Shareable Links",
    desc: "Send clients a clean public link to view and download their invoice. No login needed.",
  },
  {
    icon: Upload,
    title: "CSV Import",
    desc: "Drag-and-drop CSV files to bulk-import your clients and product catalog.",
  },
  {
    icon: Zap,
    title: "Auto Calculations",
    desc: "Tax rates, discounts, and totals update automatically — no spreadsheet gymnastics.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Insights",
    desc: "Track paid totals, outstanding invoices, and client count at a glance.",
  },
];

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "forever",
    desc: "For freelancers just getting started",
    features: [
      "Up to 5 invoices/month",
      "1 business profile",
      "Client management",
      "Public invoice links",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "€9",
    period: "/month",
    desc: "For growing freelancers & agencies",
    features: [
      "Unlimited invoices",
      "Custom logo & branding",
      "CSV bulk import",
      "Priority support",
      "Dashboard analytics",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Business",
    price: "€29",
    period: "/month",
    desc: "For teams and established businesses",
    features: [
      "Everything in Pro",
      "Multiple business profiles",
      "Team collaboration",
      "Custom invoice templates",
      "API access",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            <span className="font-bold text-lg tracking-tight">InvoiceFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 relative">
          <div className="max-w-2xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 text-xs font-medium px-3 py-1">
              <Star className="h-3 w-3 mr-1" />
              Built for freelancers
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-4">
              Invoicing that
              <span className="text-accent"> gets you paid</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Create professional invoices, manage clients, and track payments — all from one
              simple dashboard. No accounting degree required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="gap-2 w-full sm:w-auto" asChild>
                <Link to="/login">
                  Start Free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                <a href="#features">See Features</a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              No credit card required · Set up in 2 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Everything you need to invoice like a pro
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Built specifically for freelancers and small businesses who want to spend less time
              on paperwork and more time on what matters.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="border-border/60 hover:border-accent/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground">
              Start free. Upgrade when you're ready to grow.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${
                  plan.highlighted
                    ? "border-accent shadow-lg shadow-accent/10 scale-[1.02]"
                    : "border-border"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-accent text-accent-foreground text-xs">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.desc}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <Link to="/login">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-card border-t border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Ready to streamline your invoicing?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of freelancers who save hours every week with InvoiceFlow.
          </p>
          <Button size="lg" className="gap-2" asChild>
            <Link to="/login">
              Create Your Free Account <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            <span className="font-semibold text-foreground">InvoiceFlow</span>
          </div>
          <p>© {new Date().getFullYear()} InvoiceFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
