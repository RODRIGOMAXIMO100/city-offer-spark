# 🐝 Clilin - Plataforma de Ofertas Locais

Plataforma que conecta empresas locais, divulgadores e clientes através de ofertas e um sistema de afiliados com comissões.

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Lovable Cloud)
- **Estado**: React Query (TanStack Query)
- **Roteamento**: React Router v6
- **IA**: Integração com modelos Gemini/GPT

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) v18 ou superior
- npm (incluído no Node.js) ou [Bun](https://bun.sh/)
- [Git](https://git-scm.com/)

---

## 🛠️ Instalação e Execução

### 1. Clone o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd clilin
```

### 2. Instale as dependências

```bash
# Usando npm
npm install

# Ou usando bun (mais rápido)
bun install
```

### 3. Configure as variáveis de ambiente

O arquivo `.env` já está configurado com as credenciais do Lovable Cloud. Não é necessário criar manualmente.

> ⚠️ **Nota**: Nunca commite credenciais sensíveis. O `.env` do projeto contém apenas chaves públicas.

### 4. Inicie o servidor de desenvolvimento

```bash
# Usando npm
npm run dev

# Ou usando bun
bun dev
```

### 5. Acesse a aplicação

Abra [http://localhost:5173](http://localhost:5173) no seu navegador.

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento com hot-reload |
| `npm run build` | Gera build otimizado para produção |
| `npm run build:dev` | Gera build de desenvolvimento |
| `npm run preview` | Preview local do build de produção |
| `npm run lint` | Executa o ESLint para verificar o código |

---

## 📁 Estrutura do Projeto

```
src/
├── assets/         # Imagens e assets estáticos
├── components/     # Componentes React
│   ├── auth/       # Componentes de autenticação
│   ├── dashboard/  # Dashboards (Admin, Empresa, Afiliado, Cliente)
│   ├── landing/    # Componentes da landing page
│   ├── ui/         # Componentes shadcn/ui
│   └── onboarding/ # Tour e onboarding de usuários
├── contexts/       # Contextos React (Auth, Onboarding)
├── data/           # Dados estáticos (estados, cidades)
├── hooks/          # Custom hooks (useAuth, useOffers, etc.)
├── integrations/   # Integrações externas (Supabase)
├── lib/            # Utilitários e funções auxiliares
├── pages/          # Páginas da aplicação
└── types/          # Tipos e interfaces TypeScript

supabase/
├── functions/      # Edge Functions (backend serverless)
└── migrations/     # Migrações do banco de dados

public/             # Assets públicos (favicon, manifest, etc.)
```

---

## 🔧 Edge Functions (Backend)

O projeto utiliza Edge Functions para lógica de backend:

| Função | Descrição |
|--------|-----------|
| `ai-chat` | Chat com IA para clientes buscarem ofertas |
| `process-lead` | Processa e valida leads capturados |
| `request-withdrawal` | Solicitação de saque de afiliados |
| `create-asaas-payment` | Integração com gateway de pagamentos Asaas |
| `check-signup-eligibility` | Validação anti-fraude no cadastro |
| `check-lead-fraud` | Detecção de leads fraudulentos |
| `approve-withdrawal` | Aprovação administrativa de saques |

---

## 🌐 Ambientes

| Ambiente | URL |
|----------|-----|
| **Desenvolvimento** | http://localhost:5173 |
| **Preview** | https://id-preview--5095792b-7c1f-4c33-8222-92b1dca77719.lovable.app |
| **Produção** | https://city-offer-spark.lovable.app |

---

## 👥 Tipos de Usuário

A plataforma possui 4 tipos de usuários:

1. **Cliente**: Busca ofertas via chat com IA
2. **Empresa**: Cria ofertas e recebe leads
3. **Divulgador (Afiliado)**: Compartilha ofertas e ganha comissões
4. **Admin**: Gerencia toda a plataforma

---

## 🔐 Autenticação

- Login via email/senha
- Login via Google (OAuth)
- Verificação de email obrigatória
- Proteção contra spam com Cloudflare Turnstile

---

## 📊 Funcionalidades Principais

- ✅ Dashboard personalizado por tipo de usuário
- ✅ Sistema de comissões por níveis (Bronze, Prata, Ouro)
- ✅ Chat com IA para busca de ofertas
- ✅ Sistema de pagamentos integrado (Asaas)
- ✅ Detecção de fraude em leads
- ✅ Blog integrado com SEO
- ✅ Sistema de notificações
- ✅ Suporte a múltiplas cidades

---

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

## 📞 Suporte

- **Central de Ajuda**: https://city-offer-spark.lovable.app/ajuda
- **WhatsApp**: Disponível na aplicação
