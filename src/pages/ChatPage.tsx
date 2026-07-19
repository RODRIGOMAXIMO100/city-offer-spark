import { useState, useRef, useEffect } from 'react';
import { useNoIndex } from '@/components/seo/NoIndex';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Send, Bot, Loader2, MapPin, Instagram, Share2, Copy, MessageCircle, CheckCircle, ChevronsUpDown, Check, RotateCcw, Home } from 'lucide-react';
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
  images?: string[];
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
              content: `Que bom ter você aqui! 💛 Eu sou a Clilin AI. Como posso te ajudar hoje? Vou encontrar ofertas incríveis dos negócios locais de ${urlCity}!`,
            }]);
          }
        } else {
          setMessages([{
            id: '1',
            role: 'assistant',
            content: `Que bom ter você aqui! 💛 Eu sou a Clilin AI. Como posso te ajudar hoje? Vou encontrar ofertas incríveis dos negócios locais de ${urlCity}!`,
          }]);
        }
      } catch {
        setMessages([{
          id: '1',
          role: 'assistant',
          content: `Que bom ter você aqui! 💛 Eu sou a Clilin AI. Como posso te ajudar hoje? Vou encontrar ofertas incríveis dos negócios locais de ${urlCity}!`,
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
        content: `Que bom ter você aqui! 💛 Eu sou a Clilin AI. Como posso te ajudar hoje? Vou encontrar ofertas incríveis dos negócios locais de ${selectedCity}!`,
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
        content: `Que bom ter você aqui! 💛 Eu sou a Clilin AI. Como posso te ajudar hoje? Vou encontrar ofertas incríveis dos negócios locais de ${selectedCity}!`,
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


  // No Offers Screen (shown as overlay/modal style within chat)
  if (showNoOffersScreen) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
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
            <span className="font-display font-bold">Clilin AI</span>
          </div>
          <div className="w-20" />
        </header>

        {/* Messages Area with No Offers Card */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4"
        >
          <div className="max-w-3xl mx-auto space-y-4">
            {/* City selection message */}
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[90%] sm:max-w-[85%] bg-card border border-border rounded-2xl rounded-bl-md px-4 py-4">
                <div className="flex items-center gap-1 mb-3 text-xs font-bold text-client">
                  <Bot className="h-3 w-3" />
                  <span>Assistente</span>
                </div>
                <p className="text-sm leading-relaxed">
                  Você selecionou: <strong>{formattedCity}</strong>
                </p>
              </div>
            </div>

            {/* No offers message */}
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[90%] sm:max-w-[85%] bg-card border border-border rounded-2xl rounded-bl-md px-4 py-4">
                <div className="flex items-center gap-1 mb-3 text-xs font-bold text-client">
                  <Bot className="h-3 w-3" />
                  <span>Assistente</span>
                </div>
                
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <Share2 className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-lg font-display font-bold mb-1">
                    A Clilin ainda não chegou em {selectedCity}!
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Mas você pode mudar isso!
                  </p>
                </div>

                <div className="bg-muted/50 rounded-xl p-3 mb-4">
                  <p className="text-xs text-center">
                    Ajude a trazer ofertas incríveis para sua cidade compartilhando com os <strong>negócios locais</strong>.
                  </p>
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={shareOnWhatsApp}
                    className="w-full h-10 bg-[#25D366] hover:bg-[#128C7E] text-white"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Compartilhar no WhatsApp
                  </Button>

                  <Button 
                    onClick={copyBusinessLink}
                    variant="outline"
                    className="w-full h-10"
                  >
                    {linkCopied ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Link Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar Link para Empresas
                      </>
                    )}
                  </Button>

                  <Button 
                    onClick={goBack}
                    variant="ghost"
                    className="w-full h-10 text-muted-foreground"
                  >
                    Escolher outra cidade
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area - Disabled */}
        <div className="shrink-0 border-t border-border bg-card">
          <div className="px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <Input
                  value=""
                  placeholder="Selecione uma cidade com ofertas..."
                  className="pr-12 py-5 rounded-full text-base opacity-50"
                  disabled
                />
                <Button
                  disabled
                  size="icon"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full h-9 w-9 bg-muted"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-1.5 sm:text-xs sm:mt-2">
                Powered by Clilin AI
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Chat Interface (always shown)
  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
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
            {chatStarted && formattedCity && (
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {formattedCity}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {chatStarted && (
            <>
              <Button variant="ghost" size="sm" onClick={resetChat} title="Nova conversa">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={changeCity}>
                Trocar Cidade
              </Button>
            </>
          )}
          {!chatStarted && <div className="w-20" />}
        </div>
      </header>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Show city selection if chat not started */}
          {/* City selection message - inline to avoid forwardRef issues */}
          {!chatStarted && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[90%] sm:max-w-[85%] bg-card border border-border rounded-2xl rounded-bl-md px-4 py-4">
                <div className="flex items-center gap-1 mb-3 text-xs font-bold text-client">
                  <Bot className="h-3 w-3" />
                  <span>Assistente</span>
                </div>
                
                <p className="text-sm leading-relaxed mb-4">
                  Olá! 👋 Eu sou a <strong>Clilin AI</strong>. Para encontrar as melhores ofertas na sua região, primeiro me diga onde você está:
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Estado</label>
                    <Select value={selectedState} onValueChange={(value) => {
                      setSelectedState(value);
                      setSelectedCity('');
                    }}>
                      <SelectTrigger className="h-11">
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
                    <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Cidade</label>
                    <Popover open={cityPopoverOpen} onOpenChange={setCityPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={cityPopoverOpen}
                          className="w-full h-11 justify-between font-normal"
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
                    className="w-full h-11 bg-client hover:bg-client/90"
                    disabled={!selectedCity || loadingCities}
                  >
                    {loadingCities ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Confirmar Localização
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Regular messages */}
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
                
                <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => (
                        <a 
                          href={href?.startsWith('http') ? href : `https://${href}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-client underline hover:text-client/80"
                        >
                          {children}
                        </a>
                      )
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Suggested Offers */}
                {msg.suggestedOffers && msg.suggestedOffers.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {msg.suggestedOffers.map((offer) => (
                      <Card
                        key={offer.id}
                        className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.01] bg-background overflow-hidden"
                        onClick={() => navigate(`/offer/${offer.id}`)}
                      >
                        {/* Imagem da oferta */}
                        {offer.images?.[0] && (
                          <img 
                            src={offer.images[0]} 
                            alt={offer.title}
                            className="w-full h-28 object-cover"
                          />
                        )}
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-bold text-sm text-foreground">{offer.company}</p>
                            <Badge variant="destructive" className="text-xs">
                              -{offer.discount}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{offer.title}</p>
                          
                          {offer.instagram_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mb-2 text-pink-500 border-pink-500/30 hover:bg-pink-500/10 text-xs h-8"
                              onClick={(e) => openInstagram(offer.instagram_url!, e)}
                            >
                              <Instagram className="mr-1.5 h-3.5 w-3.5" />
                              Ver no Instagram
                            </Button>
                          )}

                          <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                              <span className="text-xs line-through text-muted-foreground">
                                R$ {offer.price_old.toFixed(2)}
                              </span>
                              <span className="font-bold text-secondary">
                                R$ {offer.price_new.toFixed(2)}
                              </span>
                            </div>
                            <Button size="sm" variant="secondary" className="text-xs h-8">
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

      {/* Input Area - Fixed at bottom with safe area for iOS */}
      <div className="shrink-0 border-t border-border bg-card">
        <div className="px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={chatStarted ? "Pergunte sobre ofertas..." : "Selecione sua cidade acima..."}
                className="pr-12 py-5 rounded-full text-base"
                disabled={!chatStarted || isTyping}
              />
              <Button
                onClick={sendMessage}
                disabled={!chatStarted || !inputText.trim() || isTyping}
                size="icon"
                className={cn(
                  "absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full h-9 w-9",
                  chatStarted ? "bg-client hover:bg-client/90" : "bg-muted"
                )}
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-1.5 sm:text-xs sm:mt-2">
              Powered by Clilin AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
