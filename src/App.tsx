import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import PublicInvoice from "./pages/PublicInvoice";
import PublicEstimate from "./pages/PublicEstimate";
import Dashboard from "./pages/admin/Dashboard";
import Clients from "./pages/admin/Clients";
import Invoices from "./pages/admin/Invoices";
import InvoiceDetail from "./pages/admin/InvoiceDetail";
import Products from "./pages/admin/Products";
import RecurringInvoices from "./pages/admin/RecurringInvoices";
import Expenses from "./pages/admin/Expenses";
import Reports from "./pages/admin/Reports";
import Estimates from "./pages/admin/Estimates";
import EstimateDetail from "./pages/admin/EstimateDetail";
import BusinessProfile from "./pages/admin/BusinessProfile";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/i/:slug" element={<PublicInvoice />} />
            <Route path="/e/:slug" element={<PublicEstimate />} />
            
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="products" element={<Products />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/:id" element={<InvoiceDetail />} />
              <Route path="recurring" element={<RecurringInvoices />} />
              <Route path="estimates" element={<Estimates />} />
              <Route path="estimates/:id" element={<EstimateDetail />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="reports" element={<Reports />} />
              <Route path="profile" element={<BusinessProfile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
