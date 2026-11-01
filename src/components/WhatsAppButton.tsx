import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { SUPPORT_WHATSAPP } from '@/lib/contact';

const WhatsAppButton = () => {
  const location = useLocation();
  
  // Não aparece no chat nem no admin (ficava em cima do menu)
  if (location.pathname === '/chat' || location.pathname.startsWith('/admin')) {
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
      className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all hover:scale-110 hover:bg-green-600 hover:shadow-xl"
      aria-label="Suporte via WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
};

export default WhatsAppButton;
