import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LoginPage } from "../features/auth/LoginPage";
import { MainLayout } from "../components/layout/MainLayout";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { InventoryPage } from "../features/inventory/InventoryPage";
import { SalesInvoicePage } from "../features/invoices/SalesInvoicePage";
import { CustomersPage } from "../features/customers/CustomersPage";
import { ChecksPage } from "../features/checks/ChecksPage";
import { PurchasesPage } from "../features/purchases/PurchasesPage";
import { BankPage } from "../features/bank/BankPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { PagePreloader } from "../components/ui/PagePreloader";
import { NodeBackendSync } from "../lib/nodeSync";

const ProtectedRoute: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <PagePreloader />
      <NodeBackendSync />

      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/invoices/new" element={<SalesInvoicePage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/checks" element={<ChecksPage />} />
            <Route path="/purchases" element={<PurchasesPage />} />
            <Route path="/bank" element={<BankPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
