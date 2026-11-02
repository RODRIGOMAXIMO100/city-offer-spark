import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Toda página nova abre no topo. Exceções: link com #seção (a própria página rola até ela)
// e o botão Voltar do navegador (mantém onde a pessoa estava).
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const tipo = useNavigationType();

  useEffect(() => {
    if (hash || tipo === "POP") return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash, tipo]);

  return null;
}
