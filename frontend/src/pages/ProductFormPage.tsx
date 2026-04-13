import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { formatCategoria } from "@/lib/utils";
import type { ProdutoCreate, ProdutoUpdate, VendaStats } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface FormValues {
  nome_produto: string;
  categoria_produto: string;
  peso_produto_gramas: string;
  comprimento_centimetros: string;
  altura_centimetros: string;
  largura_centimetros: string;
}

const emptyForm: FormValues = {
  nome_produto: "",
  categoria_produto: "",
  peso_produto_gramas: "",
  comprimento_centimetros: "",
  altura_centimetros: "",
  largura_centimetros: "",
};

function parseOptionalFloat(value: string): number | null {
  const n = parseFloat(value);
  return isNaN(n) ? null : n;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function PriceSimulator({ vendaStats }: { vendaStats: VendaStats }) {
  const [multiplier, setMultiplier] = useState(100);
  const currentAvg = vendaStats.ticket_medio!;
  const newPrice = (currentAvg * multiplier) / 100;
  const unitsNeeded = newPrice > 0 ? Math.ceil(vendaStats.receita_total / newPrice) : 0;

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Preço simulado</span>
        <span className="font-semibold tabular-nums">
          {formatCurrency(newPrice)}
          <span className="text-xs text-muted-foreground ml-1">({multiplier}% do atual)</span>
        </span>
      </div>
      <input
        type="range"
        min={50}
        max={200}
        step={5}
        value={multiplier}
        onChange={(e) => setMultiplier(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>50%</span>
        <span>100%</span>
        <span>200%</span>
      </div>
      <p className="text-sm text-center bg-muted rounded-md py-2 px-4">
        Para manter a receita atual de{" "}
        <strong className="tabular-nums">
          {formatCurrency(vendaStats.receita_total)}
        </strong>
        , você precisará vender{" "}
        <strong className="tabular-nums">{unitsNeeded}</strong>{" "}
        unidade{unitsNeeded !== 1 ? "s" : ""}/mês
      </p>
    </div>
  );
}

export default function ProductFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState<FormValues>(emptyForm);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success">("idle");
  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [vendaStats, setVendaStats] = useState<VendaStats | null>(null);

  useEffect(() => {
    api.getCategorias().then(setCategorias);
  }, []);

  useEffect(() => {
    if (!isEditing || !id) return;
    setLoading(true);
    api
      .getProduto(id)
      .then((p) => {
        setForm({
          nome_produto: p.nome_produto,
          categoria_produto: p.categoria_produto,
          peso_produto_gramas: p.peso_produto_gramas?.toString() ?? "",
          comprimento_centimetros: p.comprimento_centimetros?.toString() ?? "",
          altura_centimetros: p.altura_centimetros?.toString() ?? "",
          largura_centimetros: p.largura_centimetros?.toString() ?? "",
        });
      })
      .catch(() => {
        toast({ title: "Produto não encontrado", variant: "destructive" });
        navigate("/");
      })
      .finally(() => setLoading(false));

    api.getVendaStats(id).then(setVendaStats).catch(() => {});
  }, [id, isEditing, navigate]);

  function validate(): boolean {
    const newErrors: Partial<FormValues> = {};
    if (!form.nome_produto.trim()) newErrors.nome_produto = "Nome é obrigatório";
    if (!form.categoria_produto.trim()) newErrors.categoria_produto = "Categoria é obrigatória";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaveStatus("saving");
    setSubmitting(true);
    try {
      if (isEditing && id) {
        const data: ProdutoUpdate = {
          nome_produto: form.nome_produto,
          categoria_produto: form.categoria_produto,
          peso_produto_gramas: parseOptionalFloat(form.peso_produto_gramas),
          comprimento_centimetros: parseOptionalFloat(form.comprimento_centimetros),
          altura_centimetros: parseOptionalFloat(form.altura_centimetros),
          largura_centimetros: parseOptionalFloat(form.largura_centimetros),
        };
        await api.atualizarProduto(id, data);
        toast({ title: "Produto atualizado com sucesso" });
        setSaveStatus("success");
        setTimeout(() => navigate(`/produtos/${id}`), 800);
      } else {
        const data: ProdutoCreate = {
          nome_produto: form.nome_produto,
          categoria_produto: form.categoria_produto,
          peso_produto_gramas: parseOptionalFloat(form.peso_produto_gramas),
          comprimento_centimetros: parseOptionalFloat(form.comprimento_centimetros),
          altura_centimetros: parseOptionalFloat(form.altura_centimetros),
          largura_centimetros: parseOptionalFloat(form.largura_centimetros),
        };
        const criado = await api.criarProduto(data);
        toast({ title: "Produto criado com sucesso" });
        setSaveStatus("success");
        setTimeout(() => navigate(`/produtos/${criado.id_produto}`), 800);
      }
    } catch (err) {
      setSaveStatus("idle");
      toast({
        title: isEditing ? "Erro ao atualizar produto" : "Erro ao criar produto",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(field: keyof FormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" size="sm" className="mb-6 -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <h1 className="text-2xl font-bold tracking-tight mb-6">
        {isEditing ? "Editar Produto" : "Novo Produto"}
      </h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome do Produto <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                placeholder="Ex: Camiseta Básica Algodão"
                value={form.nome_produto}
                onChange={(e) => handleChange("nome_produto", e.target.value)}
                className={errors.nome_produto ? "border-destructive" : ""}
              />
              {errors.nome_produto && (
                <p className="text-xs text-destructive">{errors.nome_produto}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">
                Categoria <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.categoria_produto || ""}
                onValueChange={(v) => handleChange("categoria_produto", v)}
              >
                <SelectTrigger className={errors.categoria_produto ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c} value={c}>
                      {formatCategoria(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoria_produto && (
                <p className="text-xs text-destructive">{errors.categoria_produto}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Medidas e Peso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="peso">Peso (gramas)</Label>
                <Input
                  id="peso"
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Ex: 500"
                  value={form.peso_produto_gramas}
                  onChange={(e) => handleChange("peso_produto_gramas", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comprimento">Comprimento (cm)</Label>
                <Input
                  id="comprimento"
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Ex: 30"
                  value={form.comprimento_centimetros}
                  onChange={(e) => handleChange("comprimento_centimetros", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="largura">Largura (cm)</Label>
                <Input
                  id="largura"
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Ex: 20"
                  value={form.largura_centimetros}
                  onChange={(e) => handleChange("largura_centimetros", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="altura">Altura (cm)</Label>
                <Input
                  id="altura"
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Ex: 5"
                  value={form.altura_centimetros}
                  onChange={(e) => handleChange("altura_centimetros", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simulador de Preço */}
        {isEditing && vendaStats?.ticket_medio != null && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Simulador de Preço</CardTitle>
            </CardHeader>
            <CardContent>
              <PriceSimulator vendaStats={vendaStats} />
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 mt-6 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={submitting || saveStatus === "success"}
            className={saveStatus === "success" ? "bg-green-600 hover:bg-green-600" : ""}
          >
            <AnimatePresence mode="wait" initial={false}>
              {saveStatus === "saving" && (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Salvando...
                </motion.span>
              )}
              {saveStatus === "success" && (
                <motion.span
                  key="success"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Salvo
                </motion.span>
              )}
              {saveStatus === "idle" && (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isEditing ? "Salvar Alterações" : "Criar Produto"}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </form>
    </div>
  );
}
