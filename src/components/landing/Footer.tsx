import { Link } from "react-router-dom";
import { Instagram, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <Link to="/" className="text-2xl font-bold text-primary">
              clilin
            </Link>
            <p className="mt-3 text-muted-foreground max-w-md">
              Plataforma de ofertas locais que conecta empresas, divulgadores e clientes 
              de forma inteligente e eficiente.
            </p>
            <div className="flex gap-4 mt-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="mailto:contato@clilin.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Plataforma</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/auth?role=COMPANY" className="text-muted-foreground hover:text-foreground transition-colors">
                  Para Empresas
                </Link>
              </li>
              <li>
                <Link to="/auth?role=AFFILIATE" className="text-muted-foreground hover:text-foreground transition-colors">
                  Para Divulgadores
                </Link>
              </li>
              <li>
                <Link to="/auth?role=CLIENT" className="text-muted-foreground hover:text-foreground transition-colors">
                  Para Clientes
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/termos" className="text-muted-foreground hover:text-foreground transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} clilin. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
