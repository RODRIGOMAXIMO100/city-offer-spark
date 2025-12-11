import { Facebook, Twitter, Linkedin, Link2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShareSidebarProps {
  title: string;
  url: string;
}

export function ShareSidebar({ title, url }: ShareSidebarProps) {
  const shareButtons = [
    {
      icon: Facebook,
      label: 'Facebook',
      onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank'),
      color: 'hover:bg-[#1877F2]/10 hover:text-[#1877F2] hover:border-[#1877F2]/30'
    },
    {
      icon: Twitter,
      label: 'Twitter',
      onClick: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank'),
      color: 'hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/30'
    },
    {
      icon: Linkedin,
      label: 'LinkedIn',
      onClick: () => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank'),
      color: 'hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] hover:border-[#0A66C2]/30'
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`, '_blank'),
      color: 'hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]/30'
    },
    {
      icon: Link2,
      label: 'Copiar',
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(url);
          toast.success('Link copiado!');
        } catch {
          toast.error('Erro ao copiar');
        }
      },
      color: 'hover:bg-primary/10 hover:text-primary hover:border-primary/30'
    }
  ];

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
        Compartilhar
      </span>
      {shareButtons.map((button) => (
        <Button
          key={button.label}
          variant="outline"
          size="icon"
          onClick={button.onClick}
          className={`h-10 w-10 rounded-full transition-all ${button.color}`}
          title={button.label}
        >
          <button.icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}
