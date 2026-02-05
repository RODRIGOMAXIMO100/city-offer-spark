

# Plano: Criar Instruções de Execução Local no README

## Objetivo
Atualizar o `README.md` com instruções detalhadas e claras para rodar o projeto **Clilin** localmente, incluindo pré-requisitos, configuração do ambiente e comandos.

---

## Estrutura do Novo README

### 1. Cabeçalho do Projeto
- Nome: **Clilin** - Plataforma de Ofertas Locais
- Descrição breve do projeto
- Badges (opcional)

### 2. Tecnologias Utilizadas
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase (Lovable Cloud)
- React Query
- React Router

### 3. Pré-requisitos
- Node.js (v18 ou superior)
- npm ou bun
- Git

### 4. Instalação e Execução

```text
# Passo 1: Clonar o repositório
git clone <URL_DO_REPOSITORIO>
cd clilin

# Passo 2: Instalar dependências
npm install
# ou
bun install

# Passo 3: Configurar variáveis de ambiente
# O arquivo .env já está configurado com as credenciais do Supabase
# Não é necessário criar manualmente

# Passo 4: Iniciar servidor de desenvolvimento
npm run dev
# ou
bun dev

# O app estará disponível em http://localhost:5173
```

### 5. Scripts Disponíveis
| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run build:dev` | Gera build de desenvolvimento |
| `npm run preview` | Preview do build de produção |
| `npm run lint` | Executa linter ESLint |

### 6. Estrutura do Projeto

```text
src/
├── components/     # Componentes React
│   ├── auth/       # Componentes de autenticação
│   ├── dashboard/  # Dashboards (Admin, Empresa, Afiliado, Cliente)
│   ├── landing/    # Componentes da landing page
│   ├── ui/         # Componentes shadcn/ui
│   └── onboarding/ # Tour e onboarding
├── contexts/       # Contextos React
├── hooks/          # Custom hooks
├── integrations/   # Integrações (Supabase)
├── pages/          # Páginas da aplicação
├── types/          # Tipos TypeScript
└── lib/            # Utilitários

supabase/
├── functions/      # Edge Functions
└── migrations/     # Migrações do banco
```

### 7. Edge Functions (Backend)
Lista das funções disponíveis:
- `ai-chat` - Chat com IA para clientes
- `process-lead` - Processamento de leads
- `request-withdrawal` - Solicitação de saque
- `create-asaas-payment` - Pagamentos via Asaas
- E outras...

### 8. Ambientes
- **Desenvolvimento**: http://localhost:5173
- **Preview**: https://id-preview--5095792b-7c1f-4c33-8222-92b1dca77719.lovable.app
- **Produção**: https://city-offer-spark.lovable.app

---

## Arquivo a Modificar
- `README.md` - Substituir conteúdo atual pelo novo conteúdo estruturado

## Detalhes Técnicos

O README será escrito em português (pt-BR) para manter consistência com o projeto. Incluirá:
- Emojis para melhor visualização
- Tabelas para scripts
- Código em blocos formatados
- Estrutura de pastas em formato tree

