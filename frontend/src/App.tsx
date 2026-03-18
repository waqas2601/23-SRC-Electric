import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Invoices from "./pages/Invoices";
import NewInvoice from "./pages/NewInvoice";
import Payments from "./pages/Payments";
import Ledger from "./pages/Ledger";
import CustomerLedgerDetail from "./pages/CustomerLedgerDetail";
import InvoiceDetail from "./pages/InvoiceDetail";
import Models from "./pages/Models";
import { ToastProvider } from "./context/ToastContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="models" element={<Models />} />
              <Route path="customers" element={<Customers />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="new-invoice" element={<NewInvoice />} />
              <Route path="invoices/:id" element={<InvoiceDetail />} />
              <Route path="payments" element={<Payments />} />
              <Route path="ledger" element={<Ledger />} />
              <Route
                path="ledger/view/:customerId"
                element={<CustomerLedgerDetail />}
              />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
