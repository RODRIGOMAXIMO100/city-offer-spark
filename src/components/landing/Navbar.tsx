import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const panelPath = role === "ADMIN" ? "/admin" : "/dashboard";

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    navigate("/", { replace: true });
  };
  
  // Navbar should be solid (not transparent) on pages other than landing
  const isLandingPage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    if (isLandingPage) {
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/#${id}`);
    }
    setIsOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled || !isLandingPage
        ? "bg-background/95 backdrop-blur-xl border-b border-border shadow-sm" 
        : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <BrandLogo className="h-10" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link 
              to="/ofertas" 
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-all whitespace-nowrap"
            >
              Ofertas
            </Link>
            <Link 
              to="/empresas" 
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-all"
            >
              Empresas
            </Link>
            <Link 
              to="/divulgadores" 
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-all"
            >
              Divulgadores
            </Link>
            <button 
              onClick={() => scrollToSection("como-funciona")} 
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-all"
            >
              Como Funciona
            </button>
            <Link 
              to="/blog" 
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-all"
            >
              Blog
            </Link>
            <Link 
              to="/transparencia" 
              className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 rounded-lg hover:bg-primary/5 transition-all"
            >
              Transparência
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Button variant="ghost" onClick={handleSignOut} className="font-medium">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
                <Button asChild className="font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  <Link to={panelPath}>Meu painel</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="font-medium">
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button asChild className="font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  <Link to="/auth">Fazer Parte</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in bg-background">
            <div className="flex flex-col gap-2">
              <Link 
                to="/ofertas" 
                onClick={() => setIsOpen(false)}
                className="text-left px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              >
                Ofertas
              </Link>
              <Link 
                to="/empresas" 
                onClick={() => setIsOpen(false)}
                className="text-left px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              >
                Empresas
              </Link>
              <Link 
                to="/divulgadores" 
                onClick={() => setIsOpen(false)}
                className="text-left px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              >
                Divulgadores
              </Link>
              <button 
                onClick={() => scrollToSection("como-funciona")} 
                className="text-left px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              >
                Como Funciona
              </button>
              <Link 
                to="/blog" 
                onClick={() => setIsOpen(false)}
                className="text-left px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              >
                Blog
              </Link>
              <Link 
                to="/transparencia" 
                onClick={() => setIsOpen(false)}
                className="text-left px-4 py-3 text-primary hover:bg-primary/5 rounded-lg transition-colors font-medium"
              >
                Transparência
              </Link>
              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-border">
                {user ? (
                  <>
                    <Button asChild className="w-full">
                      <Link to={panelPath} onClick={() => setIsOpen(false)}>Meu painel</Link>
                    </Button>
                    <Button variant="outline" onClick={handleSignOut} className="w-full">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair da conta
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/auth">Entrar</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link to="/auth">Fazer Parte</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}