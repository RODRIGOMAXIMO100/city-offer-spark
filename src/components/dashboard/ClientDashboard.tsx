import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, LogOut, Bot, Loader2, MapPin, Instagram, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '@/components/landing/Footer';
import logo from '@/assets/logo.png';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedOffers?: Array<{
    id: string;
    title: string;
    company: string;
    price_old: number;
    price_new: number;
    discount: number;
    instagram_url?: string;
  }>;
}

export default function ClientDashboard() {
  const { profile, signOut } = useAuth();
  const { startTour } = useOnboarding();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Olá${profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}! 👋 Eu sou a Clilin AI. O que você está procurando hoje? Posso te ajudar a encontrar as melhores ofertas em ${profile?.city || 'sua cidade'}!`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: inputText,
          city: profile?.city || 'Viçosa - MG',
          conversationHistory,
        },
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text || 'Desculpe, não consegui processar sua mensagem.',
        suggestedOffers: data.suggestedOffers,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Ops! Tive um problema ao buscar ofertas. Tente novamente em alguns segundos.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openInstagram = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-client-muted flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={logo} alt="clilin" className="h-8" />
          </div>
          <div className="flex items-center gap-3">
            <div data-tour="location" className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {profile?.city}
            </div>
            <Button size="icon" variant="ghost" onClick={startTour} title="Iniciar tour">
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div data-tour="chat-area" className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] ${
                msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1 mb-2 text-xs font-bold text-client">
                  <Bot className="h-3 w-3" />
                  <span>Assistente</span>
                </div>
              )}
              
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

              {/* Suggested Offers */}
              {msg.suggestedOffers && msg.suggestedOffers.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.suggestedOffers.map((offer) => (
                    <Card
                      key={offer.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/offer/${offer.id}`)}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-sm text-foreground">{offer.company}</p>
                          <Badge variant="destructive" className="text-xs">
                            -{offer.discount}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{offer.title}</p>
                        
                        {/* Instagram button */}
                        {offer.instagram_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mb-2 text-pink-500 border-pink-500/30 hover:bg-pink-500/10 text-xs"
                            onClick={(e) => openInstagram(offer.instagram_url!, e)}
                          >
                            <Instagram className="mr-1 h-3 w-3" />
                            Conhecer no Instagram
                          </Button>
                        )}

                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-xs line-through text-muted-foreground mr-2">
                              R$ {offer.price_old.toFixed(2)}
                            </span>
                            <span className="font-bold text-secondary">
                              R$ {offer.price_new.toFixed(2)}
                            </span>
                          </div>
                          <Button size="sm" variant="secondary" className="text-xs">
                            Ver Oferta
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="chat-bubble-ai flex items-center gap-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:75ms]" />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-card border-t border-border p-4">
        <div className="max-w-2xl mx-auto">
          <div data-tour="chat-input" className="relative">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ex: Quero pizza barata..."
              className="pr-12 py-6 rounded-full"
              disabled={isTyping}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputText.trim() || isTyping}
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-client hover:bg-client/90"
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            IA Inteligente • Buscando ofertas em {profile?.city}
          </p>
        </div>
      </div>

      <Footer />
      <OnboardingTour />
    </div>
  );
}
