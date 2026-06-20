import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./components/AuthLayout";
import Footer from "./components/Footer";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import AdminPage from "./pages/admin/AdminPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import CartPage from "./pages/CartPage";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
        <Routes>
          <Route
            path="/"
            element={
              <AppLayout>
                <HomePage />
              </AppLayout>
            }
          />
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route
            path="/profile"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              </AppLayout>
            }
          />
          <Route
            path="/catalog"
            element={
              <AppLayout>
                <CatalogPage />
              </AppLayout>
            }
          />
          <Route
            path="/catalog/:productId"
            element={
              <AppLayout>
                <ProductDetailPage />
              </AppLayout>
            }
          />
          <Route
            path="/cart"
            element={
              <AppLayout>
                <CartPage />
              </AppLayout>
            }
          />
          <Route
            path="/admin"
            element={
              <AppLayout>
                <ProtectedRoute adminOnly>
                  <AdminPage />
                </ProtectedRoute>
              </AppLayout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
