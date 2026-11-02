import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SUPPORT_WHATSAPP } from '@/lib/contact';

const WhatsAppButton = () => {
  const location = useLocation();
  const { role } = useAuth();
  
  // Não aparece no chat, no admin, nem nas páginas de oferta e cupom (ficava em cima do conteúdo)
  const p = location.pathname;
  if (p === '/chat' || p.startsWith('/admin') || /^\/(oferta|offer|cupom|pedir|o)\//.test(p) || (p === '/dashboard' && role === 'CLIENT')) {
    return null;
  }

  const phoneNumber = SUPPORT_WHATSAPP;
  const message = encodeURIComponent('Olá! Preciso de ajuda com a plataforma.');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lg transition-all hover:scale-110 hover:bg-whatsapp/90 hover:shadow-xl"
      aria-label="Suporte via WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
};

export default WhatsAppButton;
