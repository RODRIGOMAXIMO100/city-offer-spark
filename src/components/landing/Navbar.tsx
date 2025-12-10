import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-primary">
            clilin
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection("como-funciona")} className="text-muted-foreground hover:text-foreground transition-colors">
              Como Funciona
            </button>
            <button onClick={() => scrollToSection("empresas")} className="text-muted-foreground hover:text-foreground transition-colors">
              Para Empresas
            </button>
            <button onClick={() => scrollToSection("divulgadores")} className="text-muted-foreground hover:text-foreground transition-colors">
              Para Divulgadores
            </button>
            <button onClick={() => scrollToSection("faq")} className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </button>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Começar Grátis</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              <button onClick={() => scrollToSection("como-funciona")} className="text-left px-2 py-2 text-muted-foreground hover:text-foreground">
                Como Funciona
              </button>
              <button onClick={() => scrollToSection("empresas")} className="text-left px-2 py-2 text-muted-foreground hover:text-foreground">
                Para Empresas
              </button>
              <button onClick={() => scrollToSection("divulgadores")} className="text-left px-2 py-2 text-muted-foreground hover:text-foreground">
                Para Divulgadores
              </button>
              <button onClick={() => scrollToSection("faq")} className="text-left px-2 py-2 text-muted-foreground hover:text-foreground">
                FAQ
              </button>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link to="/auth">Começar Grátis</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
