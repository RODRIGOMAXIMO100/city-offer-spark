import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  MessageCircle, 
  Instagram, 
  Clock, 
  PenLine, 
  Target,
  Smartphone,
  Users,
  Zap,
  Star,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const tabs = [
  { id: 'onde', label: 'Onde Compartilhar', icon: Smartphone },
  { id: 'horarios', label: 'Melhores Horários', icon: Clock },
  { id: 'legendas', label: 'Legendas Atrativas', icon: PenLine },
  { id: 'ofertas', label: 'Escolha de Ofertas', icon: Target },
];

export default function AffiliateTutorial() {
  const [activeTab, setActiveTab] = useState('onde');
  const [open, setOpen] = useState(false);

  const currentIndex = tabs.findIndex(t => t.id === activeTab);

  const goNext = () => {
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          Dicas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Como Ganhar Mais com Leads
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-affiliate text-white'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'onde' && <OndeCompartilhar />}
          {activeTab === 'horarios' && <MelhoresHorarios />}
          {activeTab === 'legendas' && <LegendasAtrativas />}
          {activeTab === 'ofertas' && <EscolhaOfertas />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <div className="flex gap-1">
            {tabs.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-affiliate' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={goNext}
            disabled={currentIndex === tabs.length - 1}
            className="gap-1"
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OndeCompartilhar() {
  const platforms = [
    {
      icon: MessageCircle,
      name: 'WhatsApp',
      color: 'text-green-500',
      tips: [
        'Compartilhe no Status (fica visível por 24h)',
        'Grupos da sua cidade são os melhores',
        'Envie para amigos e família',
      ],
    },
    {
      icon: Instagram,
      name: 'Instagram',
      color: 'text-pink-500',
      tips: [
        'Stories com link são muito eficazes',
        'Use stickers de "Link" e "Enquete"',
        'Direct para seguidores engajados',
      ],
    },
    {
      icon: Users,
      name: 'Facebook',
      color: 'text-blue-500',
      tips: [
        'Grupos locais da sua cidade',
        'Grupos de promoções e cupons',
        'Marketplace para ofertas relevantes',
      ],
    },
    {
      icon: Zap,
      name: 'Telegram',
      color: 'text-sky-500',
      tips: [
        'Crie seu próprio canal de ofertas',
        'Grupos de promoções são ótimos',
        'Use bots para automatizar',
      ],
    },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
        <p className="text-sm flex items-start gap-2">
          <Star className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
          <span><strong>Dica de Ouro:</strong> Grupos da sua cidade costumam ter o maior engajamento!</span>
        </p>
      </div>

      {platforms.map((platform) => (
        <div key={platform.name} className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <platform.icon className={`h-5 w-5 ${platform.color}`} />
            <span className="font-medium">{platform.name}</span>
          </div>
          <ul className="space-y-1">
            {platform.tips.map((tip, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-affiliate mt-0.5 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function MelhoresHorarios() {
  const horarios = [
    {
      periodo: 'Manhã',
      emoji: '🌅',
      horario: '7h - 9h',
      motivo: 'Pessoas acordando e checando o celular',
      qualidade: 'Ótimo',
    },
    {
      periodo: 'Almoço',
      emoji: '🍽️',
      horario: '12h - 14h',
      motivo: 'Pausa do trabalho, navegando redes sociais',
      qualidade: 'Excelente',
    },
    {
      periodo: 'Tarde',
      emoji: '☀️',
      horario: '15h - 17h',
      motivo: 'Intervalo da tarde, menor engajamento',
      qualidade: 'Bom',
    },
    {
      periodo: 'Noite',
      emoji: '🌙',
      horario: '19h - 22h',
      motivo: 'Pico de uso das redes sociais',
      qualidade: 'Excelente',
    },
  ];

  const getQualidadeColor = (q: string) => {
    switch (q) {
      case 'Excelente': return 'bg-green-500/20 text-green-600';
      case 'Ótimo': return 'bg-blue-500/20 text-blue-600';
      default: return 'bg-yellow-500/20 text-yellow-600';
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-affiliate/10 border border-affiliate/20 rounded-lg p-3">
        <p className="text-sm flex items-start gap-2">
          <TrendingUp className="h-4 w-4 text-affiliate mt-0.5 shrink-0" />
          <span><strong>Importante:</strong> Consistência é mais importante que horário perfeito. Poste regularmente!</span>
        </p>
      </div>

      <div className="space-y-2">
        {horarios.map((h) => (
          <div key={h.periodo} className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
            <span className="text-2xl">{h.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{h.periodo}</span>
                <Badge className={getQualidadeColor(h.qualidade)} variant="secondary">
                  {h.qualidade}
                </Badge>
              </div>
              <p className="text-sm font-medium text-affiliate">{h.horario}</p>
              <p className="text-xs text-muted-foreground">{h.motivo}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-muted rounded-lg p-3">
        <p className="text-sm font-medium mb-2">📅 Dias da Semana</p>
        <p className="text-xs text-muted-foreground">
          <strong>Melhores dias:</strong> Quinta, Sexta e Sábado<br />
          <strong>Evite:</strong> Segunda de manhã (pessoas ocupadas)
        </p>
      </div>
    </div>
  );
}

function LegendasAtrativas() {
  const exemplos = [
    {
      ruim: '🔥 Oferta boa, clica aí',
      bom: '🔥 PIZZA 2 POR 1 na [Nome] hoje! Aproveita que é só até 22h 🍕',
    },
    {
      ruim: 'Tem desconto aqui',
      bom: '💰 R$15 OFF no açaí! Perfeito pra esse calor ☀️ Link nos comentários 👇',
    },
    {
      ruim: 'Olha essa promoção',
      bom: '😱 De R$89 por apenas R$49! Esse é o menor preço que já vi 🏃‍♂️',
    },
  ];

  const dicas = [
    { emoji: '🎯', dica: 'Destaque o BENEFÍCIO principal (preço, desconto, exclusividade)' },
    { emoji: '⏰', dica: 'Crie URGÊNCIA (só hoje, últimas unidades, acaba em X horas)' },
    { emoji: '😀', dica: 'Use EMOJIS estratégicos para chamar atenção' },
    { emoji: '💬', dica: 'Faça PERGUNTAS para gerar engajamento' },
    { emoji: '📍', dica: 'Mencione a LOCALIZAÇÃO se for relevante' },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-muted rounded-lg p-3">
        <p className="text-sm font-medium mb-3">✨ Fórmula de Legenda Perfeita:</p>
        <div className="bg-background rounded p-2 text-sm">
          <span className="text-affiliate">[Emoji]</span> + 
          <span className="text-blue-500"> [Benefício]</span> + 
          <span className="text-yellow-600"> [Urgência]</span> + 
          <span className="text-green-500"> [Call to Action]</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">📝 Exemplos Antes e Depois:</p>
        {exemplos.map((ex, i) => (
          <div key={i} className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-red-500 text-xs">❌</span>
              <p className="text-sm text-muted-foreground line-through">{ex.ruim}</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 text-xs">✅</span>
              <p className="text-sm">{ex.bom}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">💡 Dicas Rápidas:</p>
        {dicas.map((d, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span>{d.emoji}</span>
            <span className="text-muted-foreground">{d.dica}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EscolhaOfertas() {
  const criterios = [
    {
      titulo: 'Alto Desconto',
      descricao: 'Ofertas com 40%+ de desconto geram mais leads',
      icone: '💰',
    },
    {
      titulo: 'Relevância Local',
      descricao: 'Ofertas da sua cidade convertem melhor',
      icone: '📍',
    },
    {
      titulo: 'Categoria Popular',
      descricao: 'Comida, beleza e serviços têm alta demanda',
      icone: '🔥',
    },
    {
      titulo: 'Preço Acessível',
      descricao: 'Produtos até R$50 têm mais impulso de compra',
      icone: '🎯',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
        <p className="text-sm flex items-start gap-2">
          <Target className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
          <span><strong>Estratégia:</strong> Foque em ofertas que você mesmo usaria. Autenticidade vende!</span>
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">🎯 Critérios para Escolher:</p>
        {criterios.map((c) => (
          <div key={c.titulo} className="bg-muted/50 rounded-lg p-3 flex items-start gap-3">
            <span className="text-xl">{c.icone}</span>
            <div>
              <p className="font-medium text-sm">{c.titulo}</p>
              <p className="text-xs text-muted-foreground">{c.descricao}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-muted rounded-lg p-3">
        <p className="text-sm font-medium mb-2">📊 Observe a Taxa de Conversão</p>
        <p className="text-xs text-muted-foreground">
          A taxa de conversão mostra quais ofertas estão gerando mais leads. 
          Ofertas com conversão alta já estão comprovadas - aproveite!
        </p>
      </div>

      <div className="bg-affiliate/10 border border-affiliate/20 rounded-lg p-3">
        <p className="text-sm font-medium mb-1">🚀 Dica Final</p>
        <p className="text-xs text-muted-foreground">
          Não compartilhe muitas ofertas de uma vez. 2-3 por dia é o ideal para não parecer spam!
        </p>
      </div>
    </div>
  );
}
