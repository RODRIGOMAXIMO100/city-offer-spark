import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Globe, RefreshCw } from "lucide-react";

interface SitePage {
  id: string;
  path: string;
  name: string;
  changefreq: string;
  priority: number;
  include_in_sitemap: boolean;
  created_at: string;
}

export function AdminSitePages() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<SitePage | null>(null);
  const [formData, setFormData] = useState({
    path: "",
    name: "",
    changefreq: "monthly",
    priority: "0.5",
    include_in_sitemap: true,
  });

  const { data: pages, isLoading } = useQuery({
    queryKey: ["site-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_pages")
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      return data as SitePage[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        path: data.path.startsWith("/") ? data.path : `/${data.path}`,
        name: data.name,
        changefreq: data.changefreq,
        priority: parseFloat(data.priority),
        include_in_sitemap: data.include_in_sitemap,
      };

      if (data.id) {
        const { error } = await supabase
          .from("site_pages")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_pages").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-pages"] });
      toast.success(editingPage ? "Página atualizada" : "Página adicionada");
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-pages"] });
      toast.success("Página removida");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const regenerateSitemapMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("update-sitemap-file");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sitemap regenerado com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao regenerar sitemap: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      path: "",
      name: "",
      changefreq: "monthly",
      priority: "0.5",
      include_in_sitemap: true,
    });
    setEditingPage(null);
    setIsOpen(false);
  };

  const handleEdit = (page: SitePage) => {
    setEditingPage(page);
    setFormData({
      path: page.path,
      name: page.name,
      changefreq: page.changefreq,
      priority: page.priority.toString(),
      include_in_sitemap: page.include_in_sitemap,
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...formData, id: editingPage?.id });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Páginas do Sitemap
            </CardTitle>
            <CardDescription>
              Gerencie as páginas que aparecem no sitemap.xml
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => regenerateSitemapMutation.mutate()}
              disabled={regenerateSitemapMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${regenerateSitemapMutation.isPending ? "animate-spin" : ""}`} />
              Regenerar Sitemap
            </Button>
            <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Página
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPage ? "Editar Página" : "Adicionar Página"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Página Inicial"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="path">Caminho (URL)</Label>
                    <Input
                      id="path"
                      value={formData.path}
                      onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                      placeholder="/sobre"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Frequência</Label>
                      <Select
                        value={formData.changefreq}
                        onValueChange={(value) => setFormData({ ...formData, changefreq: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="always">Sempre</SelectItem>
                          <SelectItem value="hourly">Por hora</SelectItem>
                          <SelectItem value="daily">Diária</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                          <SelectItem value="never">Nunca</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1.0">1.0 (Máxima)</SelectItem>
                          <SelectItem value="0.9">0.9</SelectItem>
                          <SelectItem value="0.8">0.8</SelectItem>
                          <SelectItem value="0.7">0.7</SelectItem>
                          <SelectItem value="0.6">0.6</SelectItem>
                          <SelectItem value="0.5">0.5 (Padrão)</SelectItem>
                          <SelectItem value="0.4">0.4</SelectItem>
                          <SelectItem value="0.3">0.3</SelectItem>
                          <SelectItem value="0.2">0.2</SelectItem>
                          <SelectItem value="0.1">0.1 (Mínima)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="include"
                      checked={formData.include_in_sitemap}
                      onCheckedChange={(checked) => setFormData({ ...formData, include_in_sitemap: checked })}
                    />
                    <Label htmlFor="include">Incluir no sitemap</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saveMutation.isPending}>
                      {saveMutation.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Caminho</TableHead>
                <TableHead>Frequência</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages?.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.name}</TableCell>
                  <TableCell className="font-mono text-sm">{page.path}</TableCell>
                  <TableCell>{page.changefreq}</TableCell>
                  <TableCell>{page.priority}</TableCell>
                  <TableCell>
                    <Switch
                      checked={page.include_in_sitemap}
                      onCheckedChange={(checked) => {
                        saveMutation.mutate({
                          ...page,
                          priority: page.priority.toString(),
                          include_in_sitemap: checked,
                          id: page.id,
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(page)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Remover esta página do sitemap?")) {
                            deleteMutation.mutate(page.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
