# AlMotos - Sistema de Gerenciamento de Motos

Sistema web para gestão de concessionária de motos, desenvolvido com **Next.js**, **Tailwind CSS** e **Shadcn UI**.

## Tecnologias

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Shadcn UI** (Button, Card, Input, Label, Select e tema)
- **Lucide React** (ícones)
- **React Hook Form** + **Zod** + **@hookform/resolvers** (formulários com validação)

## Estrutura do projeto

```
almotos-front/
├── src/
│   ├── app/                 # App Router (páginas e layout)
│   │   ├── layout.tsx       # Layout raiz com sidebar
│   │   ├── page.tsx         # Dashboard
│   │   ├── motos/
│   │   ├── clientes/
│   │   ├── vendas/
│   │   ├── trocas/
│   │   ├── relatorios/
│   │   └── configuracoes/
│   ├── components/
│   │   ├── forms/           # Formulários (Veículo, Venda, Troca)
│   │   │   ├── form-veiculo.tsx
│   │   │   ├── form-venda.tsx
│   │   │   └── form-troca.tsx
│   │   ├── layout/          # Sidebar e layout
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── sidebar-provider.tsx
│   │   │   └── main-content.tsx
│   │   └── ui/              # Componentes Shadcn-style
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       └── form-field.tsx
│   └── lib/
│       ├── utils.ts         # Utilitários (cn, etc.)
│       ├── api.ts           # Cliente API (openapi.json)
│       └── validations/
│           └── schemas.ts   # Schemas Zod (Veículo, Venda, Troca)
├── components.json          # Config Shadcn UI
└── tailwind.config.ts
```

## Menu lateral

O layout inclui um **menu lateral** (sidebar) com:

- **Dashboard** – visão geral
- **Motos** – cadastro de veículos
- **Clientes** – cadastro de clientes
- **Vendas** – registro de vendas
- **Trocas** – registro de trocas de veículos
- **Relatórios** – indicadores
- **Configurações** – preferências do sistema

O menu pode ser **recolhido** (apenas ícones) clicando no botão de seta no header da sidebar.

## Formulários e validação

Formulários modernos com **validação de campos** (Zod) para as entidades do `openapi.json`:

| Entidade | Rota | Campos |
|----------|------|--------|
| **Veículo** | `/motos` | modelo, marca, ano, preço, cor, status (DISPONÍVEL / VENDIDO / RESERVADO) |
| **Venda** | `/vendas` | veículo, nome do cliente, valor da venda, data/hora |
| **Troca** | `/trocas` | veículo de entrada, veículo de saída, valor da diferença |

- Validação em tempo real (obrigatório, tipos, limites).
- Mensagens de erro por campo.
- Feedback de sucesso/erro ao submeter.
- API base: `NEXT_PUBLIC_API_URL` (padrão `http://localhost:8080`). Configure em `.env.local` (veja `.env.example`).

## Como rodar

1. Instale as dependências:

```bash
npm install
```

2. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

3. (Opcional) Crie `.env.local` com `NEXT_PUBLIC_API_URL=http://localhost:8080` se a API estiver em outra URL.

4. Acesse [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` – servidor de desenvolvimento (Turbopack)
- `npm run build` – build de produção
- `npm run start` – servidor de produção
- `npm run lint` – ESLint

## Adicionando componentes Shadcn

Com o projeto configurado, você pode adicionar mais componentes do Shadcn via CLI:

```bash
npx shadcn@latest add [componente]
```

Exemplos: `npx shadcn@latest add input`, `npx shadcn@latest add table`, etc.
