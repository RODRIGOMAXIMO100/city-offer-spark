import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/seo/SEOHead';
import { StructuredData } from '@/components/seo/StructuredData';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowRight, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  category: string;
  published_at: string;
  author_name: string;
  keywords: string[];
}

const CATEGORIES = [
  { value: 'todos', label: 'Todos' },
  { value: 'empresas', label: 'Para Empresas' },
  { value: 'afiliados', label: 'Para Afiliados' },
  { value: 'clientes', label: 'Para Clientes' },
  { value: 'geral', label: 'Geral' },
];

const POSTS_PER_PAGE = 9;

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoria') || 'todos');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('pagina')) || 1);
  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, selectedCategory]);

  useEffect(() => {
    // Update URL params
    const params = new URLSearchParams();
    if (selectedCategory !== 'todos') params.set('categoria', selectedCategory);
    if (currentPage > 1) params.set('pagina', currentPage.toString());
    setSearchParams(params, { replace: true });
  }, [currentPage, selectedCategory, setSearchParams]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // First, get total count
      let countQuery = supabase
        .from('blog_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published');
      
      if (selectedCategory !== 'todos') {
        countQuery = countQuery.eq('category', selectedCategory);
      }
      
      const { count } = await countQuery;
      setTotalPosts(count || 0);

      // Then fetch paginated posts
      const from = (currentPage - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      let query = supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, featured_image, category, published_at, author_name, keywords')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range(from, to);

      if (selectedCategory !== 'todos') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCategoryLabel = (category: string) => {
    const cat = CATEGORIES.find((c) => c.value === category);
    return cat?.label || category;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'empresas':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'afiliados':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'clientes':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`Blog - Dicas de Marketing Local e Afiliados${currentPage > 1 ? ` | Página ${currentPage}` : ''}`}
        description="Aprenda estratégias de marketing local, dicas para ganhar dinheiro como afiliado e como encontrar as melhores ofertas. Blog atualizado diariamente."
        keywords={['blog', 'marketing local', 'afiliados', 'dicas', 'ofertas', 'ganhar dinheiro']}
        canonicalUrl={currentPage > 1 ? `/blog?pagina=${currentPage}` : '/blog'}
      />
      <StructuredData type="Organization" />
      <StructuredData type="WebSite" />
      <StructuredData
        type="BreadcrumbList"
        items={[
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
        ]}
      />

      <Navbar />

      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 pb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent will-change-transform leading-normal">
              Blog Clilin
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Dicas, estratégias e novidades sobre marketing local, programa de afiliados e como
              aproveitar as melhores ofertas da sua cidade.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Category filters with horizontal scroll on mobile */}
            <div className="relative">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => handleCategoryChange(cat.value)}
                    className={`px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap shrink-0 ${
                      selectedCategory === cat.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-40 sm:h-48 w-full" />
                  <CardHeader className="p-4 sm:p-6">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                {searchTerm || selectedCategory !== 'todos'
                  ? 'Nenhum post encontrado com esses filtros.'
                  : 'Nenhum post publicado ainda. Volte em breve!'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredPosts.map((post) => (
                  <Link key={post.id} to={`/blog/${post.slug}`}>
                    <Card className="overflow-hidden h-full hover:border-primary/50 transition-all duration-300 group">
                      {post.featured_image ? (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-40 sm:h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-5xl sm:text-6xl opacity-50">📝</span>
                        </div>
                      )}
                      <CardHeader className="p-4 sm:p-6 pb-2">
                        <Badge className={`w-fit text-xs ${getCategoryColor(post.category)}`}>
                          {getCategoryLabel(post.category)}
                        </Badge>
                        <CardTitle className="line-clamp-2 text-base sm:text-lg group-hover:text-primary transition-colors">
                          {post.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0">
                        <p className="text-muted-foreground text-sm line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2 sm:gap-4">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span className="hidden sm:inline">{post.author_name}</span>
                              <span className="sm:hidden">{post.author_name.split(' ')[0]}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(post.published_at), "dd MMM", { locale: ptBR })}
                            </span>
                          </div>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-8 sm:mt-12 flex justify-center" aria-label="Paginação">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Página anterior"
                      className="h-9 w-9 sm:h-10 sm:w-10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-0.5 sm:gap-1">
                      {getPageNumbers().map((page, index) =>
                        page === 'ellipsis' ? (
                          <span key={`ellipsis-${index}`} className="px-1 sm:px-2 text-muted-foreground text-sm">
                            ...
                          </span>
                        ) : (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => handlePageChange(page)}
                            aria-label={`Página ${page}`}
                            aria-current={currentPage === page ? 'page' : undefined}
                            className="h-9 w-9 sm:h-10 sm:w-10 text-sm"
                          >
                            {page}
                          </Button>
                        )
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      aria-label="Próxima página"
                      className="h-9 w-9 sm:h-10 sm:w-10"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </nav>
              )}

              {/* Posts count info */}
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * POSTS_PER_PAGE + 1} - {Math.min(currentPage * POSTS_PER_PAGE, totalPosts)} de {totalPosts} posts
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
