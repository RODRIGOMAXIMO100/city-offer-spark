import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  const phoneNumber = '5531995118248';
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
