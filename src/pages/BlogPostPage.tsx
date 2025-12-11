import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/seo/SEOHead';
import { StructuredData } from '@/components/seo/StructuredData';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { ShareSidebar } from '@/components/blog/ShareSidebar';
import { Calendar, User, ArrowLeft, Clock, ArrowRight } from 'lucide-react';
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
  published_at: string;
  author_name: string;
  updated_at: string;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  featured_image: string | null;
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
    }
  }, [slug]);

  const fetchPost = async (postSlug: string) => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', postSlug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      if (!data) {
        navigate('/blog');
        return;
      }

      setPost(data);

      await supabase
        .from('blog_posts')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', data.id);

      const { data: related } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, category, featured_image')
        .eq('status', 'published')
        .eq('category', data.category)
        .neq('id', data.id)
        .limit(3);

      setRelatedPosts(related || []);
    } catch (error) {
      console.error('Error fetching post:', error);
      navigate('/blog');
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
        return 'bg-company/10 text-company border-company/20';
      case 'afiliados':
        return 'bg-affiliate/10 text-affiliate border-affiliate/20';
      case 'clientes':
        return 'bg-client/10 text-client border-client/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-6 w-48 mb-8" />
            <Skeleton className="h-[400px] w-full rounded-2xl mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="min-h-screen bg-background">
      <ReadingProgress />
      
      <SEOHead
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt}
        keywords={post.keywords}
        canonicalUrl={`/blog/${post.slug}`}
        ogType="article"
        ogImage={post.featured_image || undefined}
        articlePublishedTime={post.published_at}
        articleAuthor={post.author_name}
      />
      <StructuredData
        type="BlogPosting"
        title={post.title}
        description={post.excerpt}
        image={post.featured_image || undefined}
        datePublished={post.published_at}
        dateModified={post.updated_at}
        author={post.author_name}
        url={`/blog/${post.slug}`}
        wordCount={post.content.split(/\s+/).length}
        articleSection={getCategoryLabel(post.category)}
        keywords={post.keywords}
      />
      <StructuredData
        type="BreadcrumbList"
        items={[
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
          { name: post.title, url: `/blog/${post.slug}` },
        ]}
      />

      <Navbar />

      {/* Hero Section */}
      <header className="pt-24 pb-8 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o blog
          </Link>

          <Badge className={`mb-4 ${getCategoryColor(post.category)} border`}>
            {getCategoryLabel(post.category)}
          </Badge>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6 leading-tight text-foreground">
            {post.title}
          </h1>

          <p className="text-lg text-muted-foreground mb-6 max-w-3xl">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{post.author_name}</p>
                <p className="text-xs">Autor</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(new Date(post.published_at), "dd MMM yyyy", { locale: ptBR })}
            </span>
            {post.updated_at && post.updated_at !== post.published_at && (
              <>
                <div className="h-8 w-px bg-border" />
                <span className="flex items-center gap-1.5 text-xs">
                  Atualizado: {format(new Date(post.updated_at), "dd MMM yyyy", { locale: ptBR })}
                </span>
              </>
            )}
            <div className="h-8 w-px bg-border" />
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {estimateReadTime(post.content)}
            </span>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="container mx-auto px-4 max-w-5xl -mt-4 mb-8">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-auto aspect-video object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 max-w-5xl pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Left - Share */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <ShareSidebar title={post.title} url={currentUrl} />
            </div>
          </aside>

          {/* Content */}
          <article className="lg:col-span-8">
            <div
              className="blog-content prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground prose-strong:font-semibold
                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                prose-ul:text-muted-foreground prose-ol:text-muted-foreground
                prose-li:marker:text-primary
                prose-img:rounded-xl prose-img:shadow-lg
                prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal prose-code:before:content-none prose-code:after:content-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.keywords && post.keywords.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground mb-3">Tags relacionadas:</p>
                <div className="flex flex-wrap gap-2">
                  {post.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="rounded-full">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile Share */}
            <div className="lg:hidden mt-8 p-4 bg-muted/50 rounded-xl">
              <p className="text-sm font-medium text-muted-foreground mb-3">Compartilhar:</p>
              <div className="flex gap-2">
                <ShareSidebar title={post.title} url={currentUrl} />
              </div>
            </div>

            {/* Author Card */}
            <div className="mt-12 p-6 bg-card border border-border rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-affiliate flex items-center justify-center text-white font-bold text-xl shrink-0">
                  {post.author_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-lg">{post.author_name}</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Especialista em marketing digital, ofertas locais e estratégias de afiliados. 
                    Compartilhando conhecimento prático para ajudar você a economizar e ganhar dinheiro na sua cidade.
                  </p>
                  <div className="flex gap-3 mt-3">
                    <Link to="/blog" className="text-sm text-primary hover:underline">
                      Ver todos os artigos →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar Right - TOC */}
          <aside className="hidden lg:block lg:col-span-3">
            <TableOfContents content={post.content} />
          </aside>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-border">
            <h2 className="text-2xl font-display font-bold mb-8 text-foreground">
              Continue lendo
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} to={`/blog/${relatedPost.slug}`} className="group">
                  <Card className="h-full overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg">
                    {relatedPost.featured_image && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={relatedPost.featured_image}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <Badge variant="secondary" className="w-fit text-xs mb-2">
                        {getCategoryLabel(relatedPost.category)}
                      </Badge>
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {relatedPost.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {relatedPost.excerpt}
                      </p>
                      <span className="inline-flex items-center gap-1 text-sm text-primary mt-3 group-hover:gap-2 transition-all">
                        Ler mais <ArrowRight className="h-4 w-4" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-16 p-8 md:p-12 bg-gradient-to-br from-primary/10 via-affiliate/5 to-client/10 rounded-2xl text-center border border-border">
          <h3 className="text-2xl font-display font-bold mb-3 text-foreground">
            Gostou do conteúdo?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Cadastre-se grátis e comece a aproveitar as melhores ofertas da sua cidade!
          </p>
          <Link to="/auth">
            <Button size="lg" className="px-8">
              Criar conta grátis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
