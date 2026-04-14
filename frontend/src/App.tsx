import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/Sidebar";
import DashboardPage from "@/pages/DashboardPage";
import CatalogPage from "@/pages/CatalogPage";
import CategoriasPage from "@/pages/CategoriasPage";
import CategoriaDetailPage from "@/pages/CategoriaDetailPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import ProductFormPage from "@/pages/ProductFormPage";

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-h-screen">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/produtos" element={<CatalogPage />} />
            <Route path="/categorias" element={<CategoriasPage />} />
            <Route path="/categorias/:slug" element={<CategoriaDetailPage />} />
            <Route path="/produtos/novo" element={<ProductFormPage />} />
            <Route path="/produtos/:id" element={<ProductDetailPage />} />
            <Route path="/produtos/:id/editar" element={<ProductFormPage />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Toaster />
    </div>
  );
}
