import { Link } from "react-router-dom";
import { Instagram, Mail } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
          {/* Logo & Description */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center mb-4">
              <BrandLogo className="h-10" />
            </Link>
            <p className="text-muted-foreground max-w-md leading-relaxed">
              Campanhas de alcance com gente de verdade. Empresas colocam o nome na boca do povo
              e divulgadores são premiados todo mês.
            </p>
            <div className="flex gap-3 mt-6">
              <a
                href="https://www.instagram.com/clilinapp"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="mailto:contato@clilin.com"
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"
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
                { label: "Para Empresas", to: "/empresas" },
                { label: "Para Divulgadores", to: "/divulgadores" },
                { label: "Ofertas (em breve)", to: "/clientes" },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="font-display font-semibold mb-4">Recursos</h4>
            <ul className="space-y-3">
              {[
                { label: "Central de Ajuda", to: "/ajuda" },
                { label: "Blog", to: "/blog" },
                { label: "Sobre o Clilin", to: "/sobre" },
                { label: "Transparência", to: "/transparencia" },
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
                { label: "Política de Privacidade", to: "/privacidade" },
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
          <p className="mb-2">Servir. Conectar. Crescer.</p>
          <p>© {new Date().getFullYear()} Clilin. Todos os direitos reservados.</p>
          <p className="mt-1 text-xs">Maximo Aceleradora de Produtos Digitais Ltda - ME · CNPJ 40.695.326/0001-03</p>
        </div>
      </div>
    </footer>
  );
}