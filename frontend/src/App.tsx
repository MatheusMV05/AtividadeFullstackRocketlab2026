import { Routes, Route, Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import CatalogPage from "@/pages/CatalogPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import ProductFormPage from "@/pages/ProductFormPage";

function Navbar() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container mx-auto px-4 max-w-7xl flex h-14 items-center">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-sm hover:text-primary transition-colors"
        >
          <ShoppingBag className="h-5 w-5 text-primary" />
          <span>E-Commerce Manager</span>
        </Link>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/produtos/novo" element={<ProductFormPage />} />
          <Route path="/produtos/:id" element={<ProductDetailPage />} />
          <Route path="/produtos/:id/editar" element={<ProductFormPage />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  );
}
