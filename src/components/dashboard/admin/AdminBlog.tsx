import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Eye, Sparkles, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[];
  category: string;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  author_name: string;
  views: number;
  created_at: string;
}

interface BlogTheme {
  id: string;
  theme: string;
  keywords: string[];
  category: string;
  last_used_at: string | null;
  use_count: number;
  active: boolean;
}

const CATEGORIES = [
  { value: 'empresas', label: 'Para Empresas' },
  { value: 'afiliados', label: 'Para Afiliados' },
  { value: 'clientes', label: 'Para Clientes' },
  { value: 'geral', label: 'Geral' },
];

export function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [themes, setThemes] = useState<BlogTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    meta_title: '',
    meta_description: '',
    keywords: '',
    category: 'geral',
    status: 'draft',
    scheduled_for: '',
  });

  const [themeFormData, setThemeFormData] = useState({
    theme: '',
    keywords: '',
    category: 'geral',
  });

  useEffect(() => {
    fetchPosts();
    fetchThemes();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Erro ao carregar posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_themes')
        .select('*')
        .order('use_count', { ascending: true });

      if (error) throw error;
      setThemes(data || []);
    } catch (error) {
      console.error('Error fetching themes:', error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  const handleSubmit = async () => {
    try {
      const postData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        featured_image: formData.featured_image || null,
        meta_title: formData.meta_title || formData.title,
        meta_description: formData.meta_description || formData.excerpt,
        keywords: formData.keywords.split(',').map((k) => k.trim()).filter(Boolean),
        category: formData.category,
        status: formData.status,
        scheduled_for: formData.scheduled_for || null,
        published_at: formData.status === 'published' ? new Date().toISOString() : null,
      };

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;
        toast.success('Post atualizado!');
      } else {
        const { error } = await supabase.from('blog_posts').insert(postData);

        if (error) throw error;
        toast.success('Post criado!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPosts();
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast.error(error.message || 'Erro ao salvar post');
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featured_image: post.featured_image || '',
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      keywords: post.keywords?.join(', ') || '',
      category: post.category,
      status: post.status,
      scheduled_for: post.scheduled_for || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este post?')) return;

    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);

      if (error) throw error;
      toast.success('Post excluído!');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Erro ao excluir post');
    }
  };

  const resetForm = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: '',
      meta_title: '',
      meta_description: '',
      keywords: '',
      category: 'geral',
      status: 'draft',
      scheduled_for: '',
    });
  };

  const generatePostWithAI = async () => {
    setGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-blog-post', {
        body: { manual: true },
      });

      if (response.error) throw response.error;

      toast.success('Post gerado com IA! Verifique a lista de rascunhos.');
      fetchPosts();
    } catch (error: any) {
      console.error('Error generating post:', error);
      toast.error(error.message || 'Erro ao gerar post com IA');
    } finally {
      setGenerating(false);
    }
  };

  const addTheme = async () => {
    try {
      const { error } = await supabase.from('blog_themes').insert({
        theme: themeFormData.theme,
        keywords: themeFormData.keywords.split(',').map((k) => k.trim()).filter(Boolean),
        category: themeFormData.category,
      });

      if (error) throw error;
      toast.success('Tema adicionado!');
      setIsThemeDialogOpen(false);
      setThemeFormData({ theme: '', keywords: '', category: 'geral' });
      fetchThemes();
    } catch (error) {
      console.error('Error adding theme:', error);
      toast.error('Erro ao adicionar tema');
    }
  };

  const toggleThemeActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('blog_themes')
        .update({ active: !active })
        .eq('id', id);

      if (error) throw error;
      fetchThemes();
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500/20 text-green-400">Publicado</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500/20 text-blue-400">Agendado</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400">Rascunho</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciar Blog</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generatePostWithAI} disabled={generating}>
            <Sparkles className="h-4 w-4 mr-2" />
            {generating ? 'Gerando...' : 'Gerar com IA'}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPost ? 'Editar Post' : 'Novo Post'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Título do post"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                      placeholder="url-do-post"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Resumo (Excerpt)</Label>
                  <Textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Breve resumo do post para SEO e listagens"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Conteúdo (HTML)</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="<p>Conteúdo do post...</p>"
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Meta Title (SEO)</Label>
                    <Input
                      value={formData.meta_title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, meta_title: e.target.value }))}
                      placeholder="Título para SEO (max 60 chars)"
                      maxLength={60}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Imagem Destacada (URL)</Label>
                    <Input
                      value={formData.featured_image}
                      onChange={(e) => setFormData((prev) => ({ ...prev, featured_image: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Meta Description (SEO)</Label>
                  <Textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="Descrição para SEO (max 160 chars)"
                    rows={2}
                    maxLength={160}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Keywords (SEO)</Label>
                    <Input
                      value={formData.keywords}
                      onChange={(e) => setFormData((prev) => ({ ...prev, keywords: e.target.value }))}
                      placeholder="palavra1, palavra2, palavra3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="scheduled">Agendado</SelectItem>
                        <SelectItem value="published">Publicado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.status === 'scheduled' && (
                  <div className="space-y-2">
                    <Label>Agendar para</Label>
                    <Input
                      type="datetime-local"
                      value={formData.scheduled_for}
                      onChange={(e) => setFormData((prev) => ({ ...prev, scheduled_for: e.target.value }))}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit}>Salvar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="themes">Temas para IA ({themes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium max-w-xs truncate">{post.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CATEGORIES.find((c) => c.value === post.category)?.label || post.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(post.status)}</TableCell>
                      <TableCell>{post.views || 0}</TableCell>
                      <TableCell>
                        {format(new Date(post.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {post.status === 'published' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(post)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {posts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum post encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="themes" className="mt-4">
          <div className="flex justify-end mb-4">
            <Dialog open={isThemeDialogOpen} onOpenChange={setIsThemeDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Tema
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Tema para IA</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tema/Título Base</Label>
                    <Input
                      value={themeFormData.theme}
                      onChange={(e) => setThemeFormData((prev) => ({ ...prev, theme: e.target.value }))}
                      placeholder="Ex: Como aumentar vendas no comércio local"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Keywords SEO</Label>
                    <Input
                      value={themeFormData.keywords}
                      onChange={(e) => setThemeFormData((prev) => ({ ...prev, keywords: e.target.value }))}
                      placeholder="marketing local, vendas, comércio"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={themeFormData.category}
                      onValueChange={(v) => setThemeFormData((prev) => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsThemeDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={addTheme}>Adicionar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map((theme) => (
              <Card key={theme.id} className={!theme.active ? 'opacity-50' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{theme.theme}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {theme.keywords.slice(0, 3).map((kw, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                      {theme.keywords.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{theme.keywords.length - 3}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Usado {theme.use_count}x</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleThemeActive(theme.id, theme.active)}
                      >
                        {theme.active ? 'Desativar' : 'Ativar'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
