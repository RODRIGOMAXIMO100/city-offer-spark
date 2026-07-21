import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOffers } from '@/hooks/useOffers';
import { formatBalance, CONFIG, Offer } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Banknote, PlusCircle, LogOut, Eye, MousePointer, TrendingUp, Loader2, Instagram, Check, Clock, Trash2, Info, Star, ExternalLink, AlertTriangle, Pencil, Image, HelpCircle, BookOpen, Users, Settings, LayoutDashboard, MoreVertical, Ticket } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import CreateOfferModal from './CreateOfferModal';
import PerformanceChart from './PerformanceChart';
import FiscalDataModal from './FiscalDataModal';
import ProfileSettingsModal from './ProfileSettingsModal';
import { AddCreditsModal } from './AddCreditsModal';
import { Footer } from '@/components/landing/Footer';
import logo from '@/assets/logo.png';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { WelcomeModal, OnboardingTour, OnboardingChecklist } from '@/components/onboarding';
import CompanyLeadsList from './CompanyLeadsList';
import RedeemCouponPanel from './RedeemCouponPanel';
import MerchantWhatsAppPanel from './MerchantWhatsAppPanel';

const MAX_ACTIVE_OFFERS = 3;

function CompanyDashboardContent() {
  const { profile, signOut, refreshProfile, user } = useAuth();
  const { offers, loading, fetchMyOffers, deleteOffer } = useOffers();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { claimBonus, hasClaimedBonus, startTour, showTour } = useOnboarding();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('panel');
  const [showFiscalModal, setShowFiscalModal] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState(profile?.instagram_url || '');
  const [savingInstagram, setSavingInstagram] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  // Track bonuses already claimed to avoid duplicate calls
  const bonusClaimedRef = useRef<Record<string, boolean>>({});

  // Check active offers count
  const activeOffers = offers.filter(o => o.active && !o.deleted_at && new Date(o.expires_at) > new Date());
  const activeOffersCount = activeOffers.length;
  const canCreateMore = activeOffersCount < MAX_ACTIVE_OFFERS;

  const handleBuyCredits = () => {
    if (!profile?.cnpj || !profile?.razao_social) {
      setShowFiscalModal(true);
    } else {
      setShowCreditsModal(true);
    }
  };

  const handleFiscalDataSaved = () => {
    setShowFiscalModal(false);
    setShowCreditsModal(true);
  };

  const handleCreditsSuccess = () => {
    refreshProfile();
  };

  const handleDeleteOffer = async (offerId: string) => {
    setDeletingId(offerId);
    await deleteOffer(offerId);
    setDeletingId(null);
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setShowCreateModal(true);
  };

  useEffect(() => {
    fetchMyOffers();
  }, []);

  // Garantir aba "panel" ativa quando tour iniciar
  useEffect(() => {
    if (showTour) {
      setActiveTab('panel');
    }
  }, [showTour]);

  useEffect(() => {
    setInstagramUrl(profile?.instagram_url || '');
    setAvatarPreview(profile?.avatar_url || null);
  }, [profile?.instagram_url, profile?.avatar_url]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, envie apenas imagens.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 2MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('company-avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-avatars')
        .getPublicUrl(fileName);

      // Add cache buster to URL
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setAvatarPreview(avatarUrl);
      refreshProfile();
      
      // Claim logo bonus
      if (!hasClaimedBonus('logo_added') && !bonusClaimedRef.current['logo_added']) {
        bonusClaimedRef.current['logo_added'] = true;
        claimBonus('logo_added');
      }
      
      toast({
        title: 'Logo atualizada! 💛',
        description: 'Agora os clientes vão conhecer melhor seu negócio!',
      });
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      toast({
        title: 'Erro no upload',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };
  // Calculate totals
  const totalViews = offers.reduce((acc, o) => acc + o.views_count, 0);
  const totalLeads = offers.reduce((acc, o) => acc + ((o as any).leads_count || 0), 0);
  const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : '0.0';

  const handleOfferCreated = async () => {
    setShowCreateModal(false);
    setEditingOffer(null);
    await fetchMyOffers();
    refreshProfile();
    
    // Claim first offer bonus (check if this was their first offer)
    if (!hasClaimedBonus('first_offer') && !bonusClaimedRef.current['first_offer']) {
      bonusClaimedRef.current['first_offer'] = true;
      claimBonus('first_offer');
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingOffer(null);
  };

  const formatInstagramUrl = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    
    if (trimmed.startsWith('@')) {
      return `https://instagram.com/${trimmed.slice(1)}`;
    }
    if (!trimmed.includes('instagram.com') && !trimmed.startsWith('http')) {
      return `https://instagram.com/${trimmed}`;
    }
    if (trimmed.includes('instagram.com') && !trimmed.startsWith('http')) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const saveInstagram = async () => {
    if (!profile) return;
    
    setSavingInstagram(true);
    const formattedUrl = formatInstagramUrl(instagramUrl);
    
    const { error } = await supabase
      .from('profiles')
      .update({ instagram_url: formattedUrl || null })
      .eq('id', profile.id);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // Claim Instagram bonus if URL was added
      if (formattedUrl && !hasClaimedBonus('instagram_connected') && !bonusClaimedRef.current['instagram_connected']) {
        bonusClaimedRef.current['instagram_connected'] = true;
        claimBonus('instagram_connected');
      }
      
      toast({
        title: 'Instagram conectado! 💛',
        description: 'Agora os clientes podem conhecer melhor seu negócio!',
      });
      refreshProfile();
    }
    setSavingInstagram(false);
  };
  const getExpirationInfo = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diff <= 0) return { text: 'Expirada', color: 'text-destructive' };
    if (days < 1) return { text: 'Últimas horas!', color: 'text-destructive' };
    if (days <= 3) return { text: `${days}d restantes`, color: 'text-orange-500' };
    if (days <= 7) return { text: `${days}d restantes`, color: 'text-yellow-500' };
    return { text: `${days}d restantes`, color: 'text-muted-foreground' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-500';
    if (score >= 5) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getScoreTip = (score: number) => {
    if (score >= 7) return 'Excelente! Você paga menos por clique.';
    if (score >= 5) return 'Bom! Melhore descrição e desconto para pagar menos.';
    return 'Adicione descrição, Instagram e aumente o desconto!';
  };

  const handleCreateOfferClick = () => {
    if (!canCreateMore) {
      toast({
        title: 'Limite atingido',
        description: `Você já possui ${MAX_ACTIVE_OFFERS} ofertas ativas. Delete uma para criar nova.`,
        variant: 'destructive',
      });
      return;
    }
    setEditingOffer(null);
    setShowCreateModal(true);
  };

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-company-muted pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src={logo} alt="clilin" className="h-6 sm:h-8 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[120px] sm:max-w-[200px]">
                {profile?.name || 'Empresa'}
              </span>
              <Badge variant="outline" className="text-company border-company text-[10px] w-fit">
                Empresa
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3" data-tour="balance">
            <div className="text-right">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Saldo</p>
              <div className="flex items-center gap-1 text-company font-bold text-sm sm:text-base">
                <Banknote className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate max-w-[80px] sm:max-w-none">{formatBalance(profile?.balance || 0)}</span>
              </div>
            </div>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground h-8 w-8 sm:h-9 sm:w-9"
              onClick={handleBuyCredits}
            >
              <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            {/* Mobile: Dropdown Menu */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowProfileSettings(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/ajuda')}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Central de Ajuda
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={startTour}>
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Ver Tour Guiado
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop: Individual Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowProfileSettings(true)}
                    className="h-9 w-9"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Configurações</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => navigate('/ajuda')}
                    className="h-9 w-9"
                  >
                    <BookOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Central de Ajuda</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={startTour}
                    className="h-9 w-9"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver tour guiado</p>
                </TooltipContent>
              </Tooltip>
              <Button
                size="icon"
                variant="ghost"
                onClick={signOut}
                className="h-9 w-9"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="panel" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <LayoutDashboard className="h-4 w-4" />
              Painel
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              Leads
              {totalLeads > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {totalLeads}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="coupons" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Ticket className="h-4 w-4" />
              Cupons
            </TabsTrigger>
          </TabsList>

          <TabsContent value="panel" className="space-y-4 sm:space-y-6 mt-0">
        {/* Company Logo Section */}
        <Card data-tour="company-logo">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
              <Image className="h-3 w-3 sm:h-4 sm:w-4" />
              Logo da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Logo da empresa" 
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-background/80 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    disabled={uploadingAvatar}
                    asChild
                  >
                    <span>
                      {uploadingAvatar ? 'Enviando...' : avatarPreview ? 'Trocar logo' : 'Adicionar logo'}
                    </span>
                  </Button>
                </label>
                <input 
                  id="avatar-upload"
                  type="file" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  JPG, PNG até 2MB. Aparecerá nas ofertas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instagram Profile Section */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
              <Instagram className="h-3 w-3 sm:h-4 sm:w-4" />
              Perfil do Instagram
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex gap-2">
              <Input
                placeholder="@seu_estabelecimento ou URL"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className="text-sm"
              />
              <Button 
                onClick={saveInstagram} 
                disabled={savingInstagram}
                size="sm"
                className="shrink-0"
              >
                {savingInstagram ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Os clientes poderão conhecer seu estabelecimento antes de acessar a oferta.
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3" data-tour="performance">
          <Card>
            <CardContent className="p-2 sm:p-4 text-center">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg sm:text-2xl font-bold">{totalViews}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Views</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-4 text-center">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-secondary" />
              <p className="text-lg sm:text-2xl font-bold text-secondary">{totalLeads}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-4 text-center">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-green-500" />
              <p className="text-lg sm:text-2xl font-bold text-green-500">{conversionRate}%</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Conversão</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-4 text-center">
              <Banknote className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-company" />
              <p className="text-lg sm:text-2xl font-bold text-company">{formatBalance(profile?.balance || 0)}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Saldo</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        <PerformanceChart />

        {/* Pricing Explanation Card */}
        <Card className="bg-gradient-to-r from-company/10 to-company/5 border-company/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="bg-company/20 p-1.5 sm:p-2 rounded-full shrink-0">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-company" />
              </div>
              <div className="space-y-1.5 sm:space-y-2 min-w-0">
                <p className="font-bold text-foreground text-sm sm:text-base">💰 Modelo CPL (Custo por Lead)</p>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-0.5 sm:space-y-1">
                  <li>• <strong className="text-foreground">Só paga por leads reais</strong><span className="hidden sm:inline"> — pessoas que preencheram nome e WhatsApp</span></li>
                  <li>• <strong className="text-foreground">CPL:</strong> R$ 1,00 a R$ 3,00<span className="hidden sm:inline"> (baseado na nota)</span></li>
                  <li>• <strong className="text-foreground">Nota alta = paga menos</strong><span className="hidden sm:inline">: nota 10 paga R$ 1,00</span></li>
                  <li>• <strong className="text-foreground">Divisão 50/50</strong><span className="hidden sm:inline">: metade vai para o divulgador</span></li>
                </ul>
                <Button variant="link" asChild className="h-auto p-0 text-company text-xs sm:text-sm">
                  <Link to="/transparencia">
                    Entenda como funciona <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offer Limit Info */}
        <Card className={activeOffersCount >= MAX_ACTIVE_OFFERS ? "bg-orange-500/10 border-orange-500/30" : "bg-muted/50"}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                {activeOffersCount >= MAX_ACTIVE_OFFERS ? (
                  <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
                ) : (
                  <Info className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <div>
                  <p className="font-medium text-sm sm:text-base text-foreground">
                    {activeOffersCount >= MAX_ACTIVE_OFFERS ? 'Limite atingido' : 'Ofertas ativas'}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {activeOffersCount >= MAX_ACTIVE_OFFERS 
                      ? 'Delete uma oferta para criar nova'
                      : `Você pode ter até ${MAX_ACTIVE_OFFERS} ofertas ativas`}
                  </p>
                </div>
              </div>
              <Badge 
                variant={activeOffersCount >= MAX_ACTIVE_OFFERS ? "destructive" : "secondary"}
                className="text-sm font-bold"
              >
                {activeOffersCount}/{MAX_ACTIVE_OFFERS}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Create Offer Button */}
        <Button
          onClick={handleCreateOfferClick}
          disabled={!canCreateMore}
          data-tour="create-offer"
          className={`w-full py-5 sm:py-6 font-bold shadow-lg text-sm sm:text-base ${
            !canCreateMore 
              ? 'bg-muted text-muted-foreground cursor-not-allowed' 
              : 'bg-company hover:bg-company/90 text-company-foreground'
          }`}
        >
          <PlusCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          {!canCreateMore ? `LIMITE ATINGIDO (${MAX_ACTIVE_OFFERS} OFERTAS)` : 'CRIAR NOVA OFERTA'}
        </Button>

        {/* My Offers */}
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 sm:mb-4">
            Minhas Ofertas
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : offers.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <p className="text-muted-foreground text-sm sm:text-base">Você ainda não criou nenhuma oferta.</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Clique no botão acima para começar!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <TooltipProvider>
                {offers.map((offer) => {
                  const expInfo = getExpirationInfo(offer.expires_at);
                  const offerScore = (offer as any).current_offer_score || 5;
                  const offerImages = (offer as any).images || [];
                  const isExpired = new Date(offer.expires_at) <= new Date();
                  
                  return (
                    <Card key={offer.id} className={`${!offer.active || isExpired ? 'opacity-60' : ''}`}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex gap-3">
                          {/* Thumbnail */}
                          {offerImages.length > 0 ? (
                            <img 
                              src={offerImages[0]} 
                              alt={offer.title}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg flex items-center justify-center shrink-0">
                              <Image className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            {/* Title & Score */}
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-foreground text-sm sm:text-base truncate flex-1">
                                {offer.title}
                              </h3>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={`flex items-center gap-1 text-xs sm:text-sm ${getScoreColor(offerScore)} shrink-0 cursor-help`}>
                                    <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                                    <span className="font-bold">{offerScore.toFixed(1)}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[250px]">
                                  <p className="font-bold mb-2">Nota da Oferta: {offerScore.toFixed(2)}</p>
                                  <div className="space-y-1 text-xs">
                                    <p className="flex justify-between">
                                      <span>CTR (taxa de cliques):</span>
                                      <span className="font-medium">{((offer as any).ctr_score || 5).toFixed(1)}</span>
                                    </p>
                                    <p className="flex justify-between">
                                      <span>Qualidade (descrição, imagens):</span>
                                      <span className="font-medium">{((offer as any).quality_score || 5).toFixed(1)}</span>
                                    </p>
                                    <p className="flex justify-between">
                                      <span>Reputação (Instagram, logo):</span>
                                      <span className="font-medium">{((offer as any).reputation_score || 5).toFixed(1)}</span>
                                    </p>
                                  </div>
                                  <hr className="my-2 border-border/50" />
                                  <p className="text-xs text-muted-foreground">{getScoreTip(offerScore)}</p>
                                  <p className="text-xs font-medium mt-1">
                                    Custo por lead: R$ {((14 - offerScore) * 0.3333).toFixed(2)}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>

                            {/* Cost per Lead & Expiration */}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                CPL: R$ {((14 - offerScore) * 0.3333).toFixed(2)}
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <div className={`flex items-center gap-1 text-[10px] sm:text-xs ${expInfo.color}`}>
                                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                {expInfo.text}
                              </div>
                            </div>

                            {/* Stats & Actions */}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-3 text-[10px] sm:text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {offer.views_count}
                                </span>
                              <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {(offer as any).leads_count || 0}
                                </span>
                                <Badge variant={offer.active && !isExpired ? 'default' : 'secondary'} className="text-[10px]">
                                  {isExpired ? 'Expirada' : offer.active ? 'Ativa' : 'Pausada'}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                {/* Edit Button */}
                                {offer.active && !isExpired && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleEditOffer(offer)}
                                  >
                                    <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                )}
                                
                                {/* Delete Button */}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:bg-destructive/10"
                                      disabled={deletingId === offer.id}
                                    >
                                      {deletingId === offer.id ? (
                                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-base sm:text-lg">Deletar oferta?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-sm">
                                        Esta ação não pode ser desfeita. A oferta "{offer.title}" será permanentemente removida.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                      <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteOffer(offer.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Deletar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TooltipProvider>
            </div>
          )}
        </div>
          </TabsContent>

          <TabsContent value="leads" className="mt-0">
            <CompanyLeadsList />
          </TabsContent>

          <TabsContent value="coupons" className="mt-0 space-y-4 sm:space-y-6">
            <RedeemCouponPanel />
            <MerchantWhatsAppPanel />
          </TabsContent>
        </Tabs>
      </div>

      <Footer />

      <CreateOfferModal
        open={showCreateModal}
        onClose={handleModalClose}
        onSuccess={handleOfferCreated}
        activeOffersCount={activeOffersCount}
        maxOffers={MAX_ACTIVE_OFFERS}
        editOffer={editingOffer}
      />

      <FiscalDataModal
        open={showFiscalModal}
        onClose={() => setShowFiscalModal(false)}
        onSuccess={handleFiscalDataSaved}
      />

      <AddCreditsModal
        open={showCreditsModal}
        onOpenChange={setShowCreditsModal}
        onSuccess={handleCreditsSuccess}
        userCpfCnpj={profile?.cnpj || profile?.cpf}
        userName={profile?.name}
        userEmail={profile?.email}
      />

      <ProfileSettingsModal
        open={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
        userType="COMPANY"
      />
      
      <WelcomeModal />
      <OnboardingTour />
      <OnboardingChecklist />
    </div>
    </TooltipProvider>
  );
}

export default function CompanyDashboard() {
  return (
    <OnboardingProvider>
      <CompanyDashboardContent />
    </OnboardingProvider>
  );
}