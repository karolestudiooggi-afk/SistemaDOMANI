# Domani — Planilhas colaborativas

App de planilhas flexíveis organizadas por **projeto → aba → colunas/linhas**, com **acesso restrito**: um único administrador geral cria os logins e decide quais projetos cada pessoa enxerga. Frontend em **Next.js 14 (App Router)** conectado a um backend **Supabase** (Postgres + Auth + Storage + Realtime + Edge Functions).

---

## 1. Como funciona o acesso

- **Não há cadastro público.** Ninguém cria a própria conta.
- Existe **um administrador geral**: `ai@estudiooggi.com`. Ele vê tudo e faz tudo.
- O admin cria os logins das outras pessoas (tela **Usuários**), define uma senha inicial e escolhe **quais projetos** cada uma acessa e com qual papel (viewer / editor / admin).
- **Login apenas por email + senha.** Sem Google, sem link mágico.
- **Esqueci a senha:** o próprio usuário pede na tela de login (recebe um email com link), ou o admin dispara/redefine pela tela Usuários.

### Credenciais iniciais do admin

```
Email:  ai@estudiooggi.com
Senha:  Oggi@2026
```

> Troque essa senha no primeiro acesso, em **Configurações**.

---

## 2. Rodar o projeto

Pré-requisitos: Node.js 18.17+ (recomendado 20/22) e npm.

```bash
npm install
cp .env.local.example .env.local   # já vem preenchido para este backend
npm run dev
```

Abra http://localhost:3000. Você cai no login; entre com o admin acima.

Build de produção:

```bash
npm run build
npm run start
```

Variáveis de ambiente (`.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=https://vgxzybcobxixqshthrwa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_D-EimSoUEVyrTyqAKTbbIQ_rZBSId-W
```

---

## 3. Ajustes necessários no painel Supabase

Alguns passos de Auth precisam ser feitos uma vez no painel (não dá para automatizar):

1. **Authentication → Providers → Email:** deixe **habilitado** (com "Confirm email" ligado ou não — os usuários já são criados confirmados). **Não** precisa ativar Google nem Magic Link.
2. **Authentication → URL Configuration:**
   - *Site URL*: a URL do app (ex.: `http://localhost:3000` em dev, seu domínio em produção).
   - *Redirect URLs*: inclua `http://localhost:3000/**` e, em produção, `https://SEU_DOMINIO/**`. Isso cobre a página `/redefinir-senha`.
3. **Authentication → Emails:** o template padrão de "Reset Password" já funciona. Personalize se quiser.
4. **Authentication → Policies:** ative **Leaked password protection** (recomendado).
5. **Database → Replication (Realtime):** confirme que a publication `supabase_realtime` inclui `linhas`, `colunas` e `abas` para a colaboração ao vivo.

> Para o envio de emails de recuperação em produção, configure um SMTP próprio em **Authentication → SMTP Settings** (o SMTP de teste do Supabase tem limite baixo de envios).

---

## 4. Importar uma planilha pronta

Na tela **Projetos** (ou dentro de **Planilha**), clique em **Importar**:

- Aceita **Excel (.xlsx, .xls)** e **CSV**.
- **Suporta múltiplas abas** — cada aba do arquivo vira uma aba do projeto.
- A **primeira linha** de cada aba é usada como cabeçalho (nomes das colunas).
- O tipo de cada coluna (texto / número / data) é **detectado automaticamente**.
- Você escolhe importar para um **projeto novo** ou para um **projeto existente**.

---

## 5. Papéis e permissões

- **viewer** — só leitura das planilhas do projeto.
- **editor** — cria/edita/exclui linhas, colunas e abas.
- **admin (do projeto)** — tudo do editor dentro daquele projeto.
- **admin geral** (`ai@estudiooggi.com`) — vê todos os projetos, cria usuários, concede acessos, cria/exclui projetos e importa planilhas.

As permissões são reforçadas no banco por **Row Level Security** — mesmo chamadas diretas à API respeitam os papéis.

---

## 6. Estrutura

```
src/
  app/
    layout.tsx              Layout raiz (fontes, tema anti-flash, toasts)
    page.tsx                Redireciona para /dashboard ou /login
    login/                  Login por email/senha + "esqueci a senha"
    redefinir-senha/        Define nova senha a partir do link do email
    auth/callback/          Troca de código de sessão (recuperação)
    (app)/                  Área autenticada (com sidebar)
      dashboard/            KPIs, gráficos e atividades recentes
      planilha/             Grade editável: abas, colunas, linhas, importar
      projetos/             (admin) Projetos + quem tem acesso + importar
      usuarios/             (admin) Cria logins, concede acessos, reseta senha
      abas/                 Reordenação de abas (drag-and-drop)
      historico/            Linha do tempo de alterações
      configuracoes/        Perfil, preferências (tema/fonte)
  components/               UI, sidebar, logo, onboarding, importar-dialog…
  hooks/                    usePerfil (super-admin + acessos), useProjetos, useRealtime
  lib/                      supabase (client/server), tipos, utils, importar (SheetJS)
  middleware.ts             Proteção de rotas + refresh de sessão
```

### Backend (Supabase) — Edge Functions
`criarUsuario`, `gerenciarAcessos`, `recuperarSenha`, `importarPlanilha`, `createProjeto`, `addAba` — todas exigem sessão válida e checam se quem chama é o admin geral (ou tem papel suficiente no projeto).

### Modelo de dados
`usuarios` (perfil, com `is_super_admin`), `acessos` (usuário ↔ projeto ↔ papel), `projetos`, `abas`, `colunas`, `linhas`, `logs`. Tabela `equipes` existe por compatibilidade, mas o acesso agora é direto por `acessos`.

---

## 7. Marca

- Logo oficial em `public/logo-vertical*.png` (wordmark "Domani.AI").
- Paleta: chumbo `#1D1D1F`, laranja `#E56D23`, preto e branco.
- Tipografia: **Archivo** (display), **Inter** (texto), **JetBrains Mono** (dados).
- Dark por padrão, com tema claro e ajuste de tamanho de fonte em Configurações.

---

> Os componentes foram escritos e revisados manualmente. Rode `npm run build` na sua máquina para validar o build completo — o ambiente de origem não tinha acesso ao registro npm para compilar.
