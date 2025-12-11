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
import { Calendar, User, ArrowLeft, Clock, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

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

      // Increment views
      await supabase
        .from('blog_posts')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', data.id);

      // Fetch related posts
      const { data: related } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, category')
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

  const sharePost = async (platform?: string) => {
    const url = window.location.href;
    const title = post?.title || '';

    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank');
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copiado!');
      } catch {
        toast.error('Erro ao copiar link');
      }
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

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min de leitura`;
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
            <Skeleton className="h-64 w-full mb-8" />
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

  return (
    <div className="min-h-screen bg-background">
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
        type="Article"
        title={post.title}
        description={post.excerpt}
        image={post.featured_image || undefined}
        datePublished={post.published_at}
        dateModified={post.updated_at}
        author={post.author_name}
        url={`/blog/${post.slug}`}
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

      <main className="pt-24 pb-16">
        <article className="container mx-auto px-4 max-w-4xl">
          {/* Back button */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o blog
          </Link>

          {/* Header */}
          <header className="mb-8">
            <Badge className="mb-4">{getCategoryLabel(post.category)}</Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {post.author_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(post.published_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {estimateReadTime(post.content)}
              </span>
            </div>
          </header>

          {/* Featured Image */}
          {post.featured_image && (
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-auto rounded-lg mb-8 shadow-lg"
            />
          )}

          {/* Content */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Share buttons */}
          <div className="border-t border-b py-6 mb-12">
            <p className="text-sm text-muted-foreground mb-3">Compartilhar este artigo:</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => sharePost('facebook')}>
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button variant="outline" size="sm" onClick={() => sharePost('twitter')}>
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button variant="outline" size="sm" onClick={() => sharePost('linkedin')}>
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
              <Button variant="outline" size="sm" onClick={() => sharePost()}>
                <Share2 className="h-4 w-4 mr-2" />
                Copiar Link
              </Button>
            </div>
          </div>

          {/* Keywords */}
          {post.keywords && post.keywords.length > 0 && (
            <div className="mb-12">
              <p className="text-sm text-muted-foreground mb-2">Tags:</p>
              <div className="flex flex-wrap gap-2">
                {post.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Posts Relacionados</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} to={`/blog/${relatedPost.slug}`}>
                    <Card className="h-full hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <CardTitle className="text-lg line-clamp-2">{relatedPost.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <div className="mt-12 p-8 bg-primary/10 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-2">Gostou do conteúdo?</h3>
            <p className="text-muted-foreground mb-4">
              Cadastre-se grátis e comece a aproveitar as melhores ofertas da sua cidade!
            </p>
            <Link to="/auth">
              <Button>Criar conta grátis</Button>
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
