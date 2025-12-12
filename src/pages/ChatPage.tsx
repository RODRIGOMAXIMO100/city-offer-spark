import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Send, Bot, Loader2, MapPin, Instagram, Sparkles, Share2, Copy, MessageCircle, ArrowLeft, CheckCircle, ChevronsUpDown, Check, RotateCcw, Home } from 'lucide-react';
import { BRAZIL_STATES, getCitiesByState } from '@/data/brazilLocations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.png';

const CHAT_STORAGE_KEY = 'clilin_chat_page_state';

interface SuggestedOffer {
  id: string;
  title: string;
  company: string;
  price_old: number;
  price_new: number;
  discount: number;
  instagram_url?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedOffers?: SuggestedOffer[];
}

export default function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [chatStarted, setChatStarted] = useState(false);
  const [showNoOffersScreen, setShowNoOffersScreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [citiesWithOffers, setCitiesWithOffers] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const availableCities = selectedState ? getCitiesByState(selectedState).sort() : [];
  const formattedCity = selectedCity && selectedState ? `${selectedCity} - ${selectedState}` : '';

  // Restore state from localStorage or URL params on mount
  useEffect(() => {
    const urlCity = searchParams.get('city');
    const urlState = searchParams.get('state');
    
    if (urlCity && urlState) {
      setSelectedState(urlState);
      setSelectedCity(urlCity);
      setChatStarted(true);
      
      try {
        const savedData = localStorage.getItem(CHAT_STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed.city === urlCity && parsed.state === urlState && parsed.messages?.length > 0) {
            setMessages(parsed.messages);
          } else {
            setMessages([{
              id: '1',
              role: 'assistant',
              content: `Olá! 👋 Eu sou a Clilin AI. O que você está procurando hoje? Posso te ajudar a encontrar as melhores ofertas em ${urlCity}!`,
            }]);
          }
        } else {
          setMessages([{
            id: '1',
            role: 'assistant',
            content: `Olá! 👋 Eu sou a Clilin AI. O que você está procurando hoje? Posso te ajudar a encontrar as melhores ofertas em ${urlCity}!`,
          }]);
        }
      } catch {
        setMessages([{
          id: '1',
          role: 'assistant',
          content: `Olá! 👋 Eu sou a Clilin AI. O que você está procurando hoje? Posso te ajudar a encontrar as melhores ofertas em ${urlCity}!`,
        }]);
      }
    } else {
      try {
        const savedData = localStorage.getItem(CHAT_STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed.state) setSelectedState(parsed.state);
          if (parsed.city) setSelectedCity(parsed.city);
          if (parsed.chatStarted) setChatStarted(parsed.chatStarted);
          if (parsed.messages?.length > 0) setMessages(parsed.messages);
        }
      } catch {
        console.log('No saved chat state');
      }
    }
  }, [searchParams]);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (selectedState || selectedCity || chatStarted || messages.length > 0) {
      const dataToSave = {
        state: selectedState,
        city: selectedCity,
        chatStarted,
        messages,
      };
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [selectedState, selectedCity, chatStarted, messages]);

  // Fetch cities that have active offers
  useEffect(() => {
    const fetchCitiesWithOffers = async () => {
      try {
        const { data, error } = await supabase
          .from('offers')
          .select('city')
          .eq('active', true)
          .is('deleted_at', null);

        if (error) throw error;

        const uniqueCities = [...new Set(data?.map(o => o.city) || [])];
        setCitiesWithOffers(uniqueCities);
      } catch (err) {
        console.error('Error fetching cities with offers:', err);
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCitiesWithOffers();
  }, []);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  const startChat = () => {
    if (!selectedCity || !selectedState) return;
    
    const cityHasOffers = citiesWithOffers.includes(formattedCity);
    
    if (!cityHasOffers) {
      setShowNoOffersScreen(true);
      return;
    }
    
    setChatStarted(true);
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Olá! 👋 Eu sou a Clilin AI. O que você está procurando hoje? Posso te ajudar a encontrar as melhores ofertas em ${selectedCity}!`,
      },
    ]);
  };

  const goBack = () => {
    setShowNoOffersScreen(false);
    setSelectedCity('');
  };

  const resetChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Olá! 👋 Eu sou a Clilin AI. O que você está procurando hoje? Posso te ajudar a encontrar as melhores ofertas em ${selectedCity}!`,
      },
    ]);
    setInputText('');
  };

  const changeCity = () => {
    setChatStarted(false);
    setShowNoOffersScreen(false);
    setMessages([]);
    setInputText('');
    localStorage.removeItem(CHAT_STORAGE_KEY);
  };

  const shareOnWhatsApp = () => {
    const message = `Oi! Conhece a Clilin? É uma plataforma nova onde você pode divulgar ofertas do seu negócio e ganhar novos clientes! 🚀\n\nEu já estou esperando ofertas de ${formattedCity} por lá.\n\nPara empresas: ${window.location.origin}/auth?role=COMPANY\nPara clientes: ${window.location.origin}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const copyBusinessLink = async () => {
    const link = `${window.location.origin}/auth?role=COMPANY`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setLinkCopied(false), 3000);
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

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
          city: formattedCity,
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

  // No Offers Screen
  if (showNoOffersScreen) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <Home className="h-4 w-4 mr-2" />
            Início
          </Button>
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="Clilin" className="h-6" />
            <span className="font-display font-bold text-lg">Clilin AI</span>
          </div>
          <div className="w-20" />
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-primary/20 shadow-2xl">
            <CardContent className="p-8">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goBack}
                className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>

              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Share2 className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-2">
                  A Clilin ainda não chegou em {selectedCity}!
                </h2>
                <p className="text-muted-foreground">
                  Mas você pode mudar isso!
                </p>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 mb-6">
                <p className="text-sm text-center">
                  Ajude a trazer ofertas incríveis para sua cidade compartilhando com os <strong>negócios locais</strong>.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={shareOnWhatsApp}
                  className="w-full h-12 bg-[#25D366] hover:bg-[#128C7E] text-white"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Compartilhar no WhatsApp
                </Button>

                <Button 
                  onClick={copyBusinessLink}
                  variant="outline"
                  className="w-full h-12"
                >
                  {linkCopied ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                      Link Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-5 w-5" />
                      Copiar Link para Empresas
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // City Selection Screen
  if (!chatStarted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <Home className="h-4 w-4 mr-2" />
            Início
          </Button>
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="Clilin" className="h-6" />
            <span className="font-display font-bold text-lg">Clilin AI</span>
          </div>
          <div className="w-20" />
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-primary/20 shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-client to-client/70 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-3xl font-display font-bold mb-2">Encontre Ofertas com IA</h1>
                <p className="text-muted-foreground">
                  Selecione sua cidade para começar a conversar
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Estado</label>
                  <Select value={selectedState} onValueChange={(value) => {
                    setSelectedState(value);
                    setSelectedCity('');
                  }}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZIL_STATES.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.code} - {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Cidade</label>
                  <Popover open={cityPopoverOpen} onOpenChange={setCityPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={cityPopoverOpen}
                        className="w-full h-12 justify-between font-normal"
                        disabled={!selectedState}
                      >
                        {selectedCity || "Buscar cidade..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Digite para buscar..." />
                        <CommandList>
                          <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                          <CommandGroup>
                            {availableCities.map((city) => (
                              <CommandItem
                                key={city}
                                value={city}
                                onSelect={() => {
                                  setSelectedCity(city);
                                  setCityPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCity === city ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {city}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <Button 
                  onClick={startChat} 
                  className="w-full h-14 text-lg bg-client hover:bg-client/90"
                  disabled={!selectedCity || loadingCities}
                >
                  {loadingCities ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Bot className="mr-2 h-5 w-5" />
                  )}
                  Começar a Conversar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fullscreen Chat Interface
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <Home className="h-4 w-4 mr-2" />
          Início
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-client to-client/70 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="text-center">
            <span className="font-display font-bold">Clilin AI</span>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {formattedCity}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={resetChat} title="Nova conversa">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={changeCity}>
            Trocar Cidade
          </Button>
        </div>
      </header>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3' 
                    : 'bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3'
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
                  <div className="mt-4 space-y-3">
                    {msg.suggestedOffers.map((offer) => (
                      <Card
                        key={offer.id}
                        className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.01] bg-background"
                        onClick={() => navigate(`/offer/${offer.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-bold text-foreground">{offer.company}</p>
                            <Badge variant="destructive" className="text-xs">
                              -{offer.discount}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{offer.title}</p>
                          
                          {offer.instagram_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mb-3 text-pink-500 border-pink-500/30 hover:bg-pink-500/10"
                              onClick={(e) => openInstagram(offer.instagram_url!, e)}
                            >
                              <Instagram className="mr-2 h-4 w-4" />
                              Conhecer no Instagram
                            </Button>
                          )}

                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-sm line-through text-muted-foreground mr-2">
                                R$ {offer.price_old.toFixed(2)}
                              </span>
                              <span className="font-bold text-lg text-secondary">
                                R$ {offer.price_new.toFixed(2)}
                              </span>
                            </div>
                            <Button size="sm" variant="secondary">
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
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:75ms]" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="shrink-0 p-4 border-t border-border bg-card">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Pergunte sobre ofertas, produtos, serviços..."
              className="pr-14 py-6 rounded-full text-base"
              disabled={isTyping}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputText.trim() || isTyping}
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 bg-client hover:bg-client/90"
            >
              {isTyping ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Powered by Clilin AI • Ofertas locais personalizadas
          </p>
        </div>
      </div>
    </div>
  );
}
