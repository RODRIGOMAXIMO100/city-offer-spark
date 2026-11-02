import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import ClilinChat from '@/components/chat/ClilinChat';
import ProfileSettingsModal from './ProfileSettingsModal';

// Painel do cliente: o mesmo chat da Clilin (clilin.com/chat), já com o nome e a cidade da pessoa.
export default function ClientDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  const botao = 'flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground';

  return (
    <>
      <ClilinChat
        nome={profile?.name}
        cidade={profile?.city}
        acoesTopo={
          <>
            <button className={botao} onClick={() => setShowProfileSettings(true)} title="Configurações" aria-label="Configurações">
              <Settings className="h-4 w-4" />
            </button>
            <button className={botao} onClick={() => navigate('/ajuda')} title="Central de Ajuda" aria-label="Central de Ajuda">
              <BookOpen className="h-4 w-4" />
            </button>
            <button className={botao} onClick={signOut} title="Sair" aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </button>
          </>
        }
      />
      <ProfileSettingsModal open={showProfileSettings} onClose={() => setShowProfileSettings(false)} userType="CLIENT" />
      <OnboardingTour />
    </>
  );
}
