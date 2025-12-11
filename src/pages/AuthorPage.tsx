import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/seo/SEOHead';
import { StructuredData } from '@/components/seo/StructuredData';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, ArrowRight, BookOpen, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuthorPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  category: string;
  published_at: string;
  views: number;
}

interface AuthorStats {
  totalPosts: number;
  totalViews: number;
}

const AUTHOR_INFO: Record<string, { name: string; bio: string; expertise: string[] }> = {
  'equipe-clilin': {
    name: 'Equipe Clilin',
    bio: 'A Equipe Clilin é formada por especialistas em marketing digital, ofertas locais e estratégias de afiliados. Compartilhamos conhecimento prático para ajudar você a economizar e ganhar dinheiro na sua cidade. Nossa missão é democratizar o acesso a promoções e oportunidades de renda extra.',
    expertise: ['Marketing Digital', 'Programa de Afiliados', 'Ofertas Locais', 'E-commerce', 'SEO'],
  },
};

export default function AuthorPage() {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<AuthorPost[]>([]);
  const [stats, setStats] = useState<AuthorStats>({ totalPosts: 0, totalViews: 0 });
  const [loading, setLoading] = useState(true);

  const authorSlug = slug || 'equipe-clilin';
  const author = AUTHOR_INFO[authorSlug] || AUTHOR_INFO['equipe-clilin'];

  useEffect(() => {
    fetchAuthorPosts();
  }, [authorSlug]);

  const fetchAuthorPosts = async () => {
    try {
      const authorName = author.name;
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, featured_image, category, published_at, views')
        .eq('status', 'published')
        .eq('author_name', authorName)
        .order('published_at', { ascending: false });

      if (error) throw error;

      setPosts(data || []);
      
      // Calculate stats
      const totalViews = (data || []).reduce((sum, post) => sum + (post.views || 0), 0);
      setStats({
        totalPosts: data?.length || 0,
        totalViews,
      });
    } catch (error) {
      console.error('Error fetching author posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'empresas':
        return 'Para Empresas';
      case 'afiliados':
        return 'Para Afiliados';
      case 'clientes':
        return 'Para Clientes';
      default:
        return 'Geral';
    }
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

  // Person Schema for SEO
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    description: author.bio,
    url: `https://clilin.com.br/autor/${authorSlug}`,
    knowsAbout: author.expertise,
    worksFor: {
      '@type': 'Organization',
      name: 'Clilin',
      url: 'https://clilin.com.br',
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${author.name} - Autor no Blog Clilin`}
        description={author.bio.substring(0, 160)}
        keywords={author.expertise}
        canonicalUrl={`/autor/${authorSlug}`}
      />
      <StructuredData
        type="BreadcrumbList"
        items={[
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
          { name: author.name, url: `/autor/${authorSlug}` },
        ]}
      />
      {/* Inject Person schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Author Header */}
          <div className="mb-12 p-8 bg-gradient-to-br from-primary/10 via-muted/50 to-background rounded-2xl border border-border">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-gradient-to-br from-primary to-affiliate flex items-center justify-center text-white font-bold text-4xl md:text-5xl shrink-0">
                {author.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                  {author.name}
                </h1>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {author.bio}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {author.expertise.map((skill) => (
                    <Badge key={skill} variant="secondary" className="rounded-full">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <strong className="text-foreground">{stats.totalPosts}</strong> artigos publicados
                  </span>
                  <span className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    <strong className="text-foreground">{stats.totalViews.toLocaleString('pt-BR')}</strong> visualizações
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Articles Section */}
          <section>
            <h2 className="text-2xl font-display font-bold mb-8 text-foreground">
              Artigos de {author.name}
            </h2>

            {loading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">
                  Nenhum artigo publicado ainda.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <Link key={post.id} to={`/blog/${post.slug}`}>
                    <Card className="overflow-hidden h-full hover:border-primary/50 transition-all duration-300 group">
                      {post.featured_image ? (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-6xl opacity-50">📝</span>
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <Badge className={`w-fit ${getCategoryColor(post.category)}`}>
                          {getCategoryLabel(post.category)}
                        </Badge>
                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(post.published_at), "dd 'de' MMM yyyy", { locale: ptBR })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {(post.views || 0).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
