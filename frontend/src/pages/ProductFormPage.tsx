import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { api } from "@/lib/api";
import { formatCategoria } from "@/lib/utils";
import type { ProdutoCreate, ProdutoUpdate } from "@/types";
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

export default function ProductFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState<FormValues>(emptyForm);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormValues>>({});

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
          comprimento_centimetros:
            p.comprimento_centimetros?.toString() ?? "",
          altura_centimetros: p.altura_centimetros?.toString() ?? "",
          largura_centimetros: p.largura_centimetros?.toString() ?? "",
        });
      })
      .catch(() => {
        toast({ title: "Produto não encontrado", variant: "destructive" });
        navigate("/");
      })
      .finally(() => setLoading(false));
  }, [id, isEditing, navigate]);

  function validate(): boolean {
    const newErrors: Partial<FormValues> = {};
    if (!form.nome_produto.trim())
      newErrors.nome_produto = "Nome é obrigatório";
    if (!form.categoria_produto.trim())
      newErrors.categoria_produto = "Categoria é obrigatória";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isEditing && id) {
        const data: ProdutoUpdate = {
          nome_produto: form.nome_produto,
          categoria_produto: form.categoria_produto,
          peso_produto_gramas: parseOptionalFloat(form.peso_produto_gramas),
          comprimento_centimetros: parseOptionalFloat(
            form.comprimento_centimetros
          ),
          altura_centimetros: parseOptionalFloat(form.altura_centimetros),
          largura_centimetros: parseOptionalFloat(form.largura_centimetros),
        };
        await api.atualizarProduto(id, data);
        toast({ title: "Produto atualizado com sucesso" });
        navigate(`/produtos/${id}`);
      } else {
        const data: ProdutoCreate = {
          nome_produto: form.nome_produto,
          categoria_produto: form.categoria_produto,
          peso_produto_gramas: parseOptionalFloat(form.peso_produto_gramas),
          comprimento_centimetros: parseOptionalFloat(
            form.comprimento_centimetros
          ),
          altura_centimetros: parseOptionalFloat(form.altura_centimetros),
          largura_centimetros: parseOptionalFloat(form.largura_centimetros),
        };
        const criado = await api.criarProduto(data);
        toast({ title: "Produto criado com sucesso" });
        navigate(`/produtos/${criado.id_produto}`);
      }
    } catch (err) {
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
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2"
        onClick={() => navigate(-1)}
      >
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
              <div className="flex gap-2">
                <Select
                  value={
                    categorias.includes(form.categoria_produto)
                      ? form.categoria_produto
                      : "__custom__"
                  }
                  onValueChange={(v) => {
                    if (v !== "__custom__") {
                      handleChange("categoria_produto", v);
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__custom__">
                      — Digitar nova —
                    </SelectItem>
                    {categorias.map((c) => (
                      <SelectItem key={c} value={c}>
                        {formatCategoria(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="ou digitar..."
                  value={form.categoria_produto}
                  onChange={(e) =>
                    handleChange("categoria_produto", e.target.value)
                  }
                  className={
                    errors.categoria_produto
                      ? "border-destructive flex-1"
                      : "flex-1"
                  }
                />
              </div>
              {errors.categoria_produto && (
                <p className="text-xs text-destructive">
                  {errors.categoria_produto}
                </p>
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
                  onChange={(e) =>
                    handleChange("peso_produto_gramas", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleChange("comprimento_centimetros", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleChange("largura_centimetros", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleChange("altura_centimetros", e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 mt-6 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            <Save className="h-4 w-4" />
            {submitting
              ? "Salvando..."
              : isEditing
              ? "Salvar Alterações"
              : "Criar Produto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
