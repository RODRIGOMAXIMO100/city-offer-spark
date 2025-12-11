import { Link } from "react-router-dom";
import { Instagram, Mail } from "lucide-react";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Logo & Description */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center mb-4">
              <img src={logo} alt="clilin" className="h-10" />
            </Link>
            <p className="text-muted-foreground max-w-md leading-relaxed">
              Plataforma de ofertas locais que conecta empresas, divulgadores e clientes 
              de forma inteligente e eficiente.
            </p>
            <div className="flex gap-3 mt-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="mailto:contato@clilin.com"
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Plataforma</h4>
            <ul className="space-y-3">
              {[
                { label: "Para Empresas", to: "/auth?role=COMPANY" },
                { label: "Para Divulgadores", to: "/auth?role=AFFILIATE" },
                { label: "Para Clientes", to: "/auth?role=CLIENT" },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {[
                { label: "Termos de Uso", to: "/termos" },
                { label: "Privacidade", to: "/privacidade" },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} clilin. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}