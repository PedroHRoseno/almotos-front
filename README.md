# AlMotos - Sistema de Gerenciamento de Veículos

Sistema web completo para gestão de concessionária de veículos, desenvolvido com **Next.js**, **Tailwind CSS** e **Shadcn UI**, integrado com backend Kotlin/Spring Boot.

## Tecnologias

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Shadcn UI** (Componentes: Button, Card, Input, Label, Select, Table, Dialog, Checkbox, etc.)
- **Lucide React** (ícones)
- **React Hook Form** + **Zod** + **@hookform/resolvers** (formulários com validação)
- **Radix UI** (Componentes primitivos: Select, Dialog, Checkbox)
- **ViaCEP API** (Integração para busca de endereços por CEP)

## Estrutura do projeto

```
almotos-front/
├── src/
│   ├── app/                 # App Router (páginas e layout)
│   │   ├── layout.tsx       # Layout raiz com sidebar
│   │   ├── page.tsx         # Dashboard
│   │   ├── login/           # Login (JWT)
│   │   ├── motos/           # Página de veículos (tabela paginada)
│   │   │   └── [placa]/     # Detalhes do veículo (custos, histórico)
│   │   ├── clientes/        # Página de parceiros/clientes
│   │   │   └── [cpf]/       # Detalhes e edição de parceiro
│   │   ├── compras/         # Página de compras (tabela paginada)
│   │   ├── vendas/          # Página de vendas (tabela paginada)
│   │   ├── trocas/          # Página de trocas
│   │   ├── fluxo-caixa/     # Movimentações unificadas + lançamentos da loja
│   │   ├── relatorios/      # Página de relatórios
│   │   ├── guia/            # Guia do sistema (uso e lógica)
│   │   ├── configuracoes/   # Página de configurações
│   │   └── api/proxy/       # API Route proxy para o backend (evita CORS)
│   ├── components/
│   │   ├── forms/          # Formulários
│   │   │   ├── form-veiculo.tsx
│   │   │   ├── form-parceiro.tsx
│   │   │   ├── form-venda.tsx
│   │   │   ├── form-compra.tsx
│   │   │   └── form-troca.tsx
│   │   ├── layout/         # Sidebar e layout
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── sidebar-provider.tsx
│   │   │   └── main-content.tsx
│   │   └── ui/             # Componentes Shadcn-style
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── table.tsx
│   │       ├── dialog.tsx
│   │       ├── checkbox.tsx
│   │       ├── form-field.tsx
│   │       └── searchable-select.tsx  # Componente customizado para busca
│   ├── lib/
│   │   ├── utils.ts         # Utilitários (cn, etc.)
│   │   ├── api.ts           # Cliente API para backend Kotlin
│   │   ├── viacep.ts        # Cliente ViaCEP para busca de endereços
│   │   └── validations/
│   │       └── schemas.ts   # Schemas Zod (Veículo, Parceiro, Venda, Compra, Troca)
│   └── types/
│       └── index.ts         # Tipos TypeScript
├── components.json          # Config Shadcn UI
└── tailwind.config.ts
```

## Menu lateral

O layout inclui um **menu lateral** (sidebar) com:

- **Dashboard** – visão geral com indicadores financeiros e estoque
- **Veículos** – cadastro e listagem de veículos (com detalhes por placa)
- **Clientes** – cadastro e listagem de parceiros/clientes/fornecedores
- **Compras** – registro e listagem de compras
- **Vendas** – registro e listagem de vendas
- **Trocas** – registro e listagem de trocas de veículos
- **Fluxo de Caixa** – movimentações unificadas e lançamentos da loja
- **Relatórios** – indicadores financeiros por período
- **Guia** – explicação do funcionamento e da lógica do sistema
- **Configurações** – preferências do sistema

O menu pode ser **recolhido** (apenas ícones) clicando no botão de seta no header da sidebar.

## Funcionalidades Implementadas

### Dashboard
- Exibe indicadores em tempo real:
  - Motos em estoque, Total de vendas, Total de compras, Total de trocas
  - Custos adicionais, Despesas operacionais
  - Lucro bruto e Lucro líquido (Lucro bruto − Despesas operacionais)
- Gráfico comparativo Lucro Bruto vs Despesas Operacionais

### Veículos
- **Tabela paginada** com todos os veículos
- **Busca** por placa, marca, modelo ou cor
- **Filtro de estoque** (Todos, Disponível, Vendido)
- **Modal** para cadastro de novo veículo
- Formulário com validação completa
- Campos: placa, marca, modelo, ano de fabricação, ano do modelo, cor, quilometragem, status

### Clientes/Parceiros
- **Tabela paginada** com todos os parceiros
- **Busca** por CPF ou nome (com debounce)
- **Visualização de detalhes** do parceiro (página dedicada)
- **Edição** de parceiro via modal
- **Modal** para cadastro de novo parceiro
- **Integração ViaCEP**: Busca de endereço por CEP com botão manual
- Campos: CPF, nome, telefones, endereço completo
- Endereço opcional com validação condicional
- Campo "Rua" opcional para CEPs de cidade

### Compras
- **Tabela paginada** com todas as compras
- **Busca** por placa do veículo, CPF ou nome do fornecedor
- **Modal** para registro de nova compra
- **Cadastro de veículo durante a compra**:
  - Checkbox para ativar cadastro de novo veículo
  - Se marcado, exibe campos completos do veículo
  - Se não marcado, permite seleção via SearchableSelect
- **Cadastro de parceiro durante a compra** via modal
- Campos: veículo, fornecedor, valor da compra, data da compra

### Vendas
- **Tabela paginada** com todas as vendas
- **Busca** por placa do veículo, CPF ou nome do cliente
- **Modal** para registro de nova venda
- **Cadastro de parceiro durante a venda** via modal
- Seleção de veículos disponíveis via SearchableSelect
- Campos: veículo, cliente, valor da venda (data automática)

### Trocas
- Formulário para registro de trocas com **quem paga a diferença** (cliente ou loja)
- Valor da diferença sempre informado em valor absoluto; exibição como positivo/negativo na listagem
- **Seleção de parceiro opcional** via SearchableSelect
- Se não informado, sistema busca automaticamente pela última venda do veículo de entrada
- Campos: veículo de entrada, veículo de saída, valor da diferença, CPF do parceiro (opcional)

### Fluxo de Caixa
- Tabela unificada de movimentações: vendas, compras, trocas, custos de veículos e transações da loja
- Filtros: Este Mês, Entradas, Saídas, Categoria
- **Novo lançamento**: despesas ou receitas da loja (tipo Entrada/Saída, categoria, descrição, valor)

### Relatórios
- Relatório financeiro por período (padrão: últimos 30 dias)
- Total de vendas, compras, trocas, custos adicionais e saldo geral
- Filtros de data personalizados

### Guia
- Visão geral do AlMotos, módulos (Clientes, Veículos, Compras, Vendas, Trocas, Fluxo de Caixa, Relatórios)
- Lógica financeira e fórmulas (Lucro Bruto, Despesas Operacionais, Lucro Líquido)
- Custos adicionais e detalhes do veículo, dicas rápidas

## Componentes Customizados

### SearchableSelect
Componente de seleção com busca integrada, usado para:
- Seleção de veículos (listas grandes)
- Seleção de parceiros (listas grandes)
- Suporta busca por texto adicional (`searchText`)
- Permite limpar seleção
- Indicador visual de erro

### FormField
Componente wrapper para campos de formulário com:
- Label automático
- Indicador de campo obrigatório
- Exibição de erros de validação
- Suporte a children customizados

## Formulários e validação

Formulários modernos com **validação de campos** (Zod) para todas as entidades:

| Entidade | Rota | Campos Principais |
|----------|------|-------------------|
| **Veículo** | `/motos` | placa, marca, modelo, anos, cor, quilometragem, status |
| **Parceiro** | `/clientes` | CPF, nome, telefones, endereço (opcional) |
| **Venda** | `/vendas` | veículo, cliente, valor da venda |
| **Compra** | `/compras` | veículo (ou cadastro), fornecedor, valor, data |
| **Troca** | `/trocas` | veículo entrada, veículo saída, diferença, parceiro (opcional) |

- Validação em tempo real (obrigatório, tipos, limites)
- Mensagens de erro por campo
- Feedback de sucesso/erro ao submeter
- Suporte a renderização dentro de modais

## Integração com Backend

### Configuração da API

O destino das requisições é definido **apenas** pela variável `NEXT_PUBLIC_API_URL`. Use-a em `.env.local` (desenvolvimento) ou nas variáveis de ambiente da Vercel (produção):

| Ambiente | Valor recomendado |
|----------|-------------------|
| Local    | `http://localhost:8080` |
| Produção (Vercel → Railway) | `https://seu-app.up.railway.app` |

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

O frontend **não** chama o backend diretamente: todas as chamadas passam pelo proxy (`/api/proxy/*`), que encaminha para essa URL.

### Proxy e CORS

O proxy está em `src/app/api/proxy/[...path]/route.ts`. Ele usa **somente** `NEXT_PUBLIC_API_URL` para saber para onde encaminhar.

**Fluxo:**
1. O front chama `/api/proxy/vehicles`, `/api/proxy/reports/dashboard`, etc. (mesma origem do Next).
2. A API Route recebe no servidor e repassa para `NEXT_PUBLIC_API_URL` + path.
3. A resposta volta ao cliente sem CORS/DNS da Railway no browser.

**Vantagens:** funciona na Vercel com backend na Railway, evita DNS_HOSTNAME_RESOLVED_PRIVATE e problemas de CORS.

### Endpoints utilizados

- **Autenticação**: `POST /api/auth/login`
- **Veículos**: `GET/POST/PUT/DELETE /vehicles`, `GET /vehicles/available`, `GET /vehicles/{placa}/history`, `GET/POST/DELETE /vehicles/{placa}/costs`
- **Parceiros**: `GET/POST/PUT/DELETE /partners`, `GET /partners/{cpf}`
- **Vendas**: `GET/POST/PUT/DELETE /sales`
- **Compras**: `GET/POST/PUT/DELETE /purchases`
- **Trocas**: `GET/POST/PUT/DELETE /exchanges`
- **Fluxo de caixa**: `GET /financial/movements` (paginado, filtros por data/tipo/categoria)
- **Transações da loja**: `GET/POST/PUT/DELETE /store-transactions`
- **Relatórios**: `GET /reports/dashboard`, `GET /reports/financial`

## Integração ViaCEP

O sistema integra com a API ViaCEP para busca automática de endereços:
- Busca manual via botão "Buscar CEP"
- Preenchimento automático de: rua, bairro, cidade, estado
- Campo "Rua" opcional para CEPs de cidade
- Validação de CEP no formato brasileiro

## Deploy na Vercel

O frontend está preparado para deploy na Vercel. Veja o arquivo `VERCEL_DEPLOY.md` para instruções detalhadas.

### Configuração Rápida

1. **Configure a variável de ambiente na Vercel:**
   - Vá em **Settings** → **Environment Variables**
   - Adicione: `NEXT_PUBLIC_API_URL` = `https://seu-backend.railway.app`
   - Substitua pela URL real do seu backend no Railway

2. **Faça o deploy:**
   - Conecte o repositório na Vercel
   - O Vercel detectará automaticamente o Next.js
   - Após o deploy, re-deploy para aplicar as variáveis de ambiente

**Importante**: Após adicionar/modificar variáveis de ambiente, você **DEVE** fazer um novo deploy.

## Como rodar localmente

1. **Instale as dependências:**

```bash
npm install
```

2. **Configure a URL da API:**

Crie o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

3. **Inicie o servidor de desenvolvimento:**

```bash
npm run dev
```

4. **Certifique-se de que o backend Kotlin está rodando** na porta 8080.

5. Acesse [http://localhost:3000](http://localhost:3000).

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

## Funcionalidades de UX

### Paginação
- Todas as tabelas suportam paginação
- Seletor de tamanho de página (10, 20, 50, 100)
- Navegação: Primeira, Anterior, Próxima, Última
- Indicador de registros exibidos

### Busca
- Busca em tempo real com debounce (500ms)
- Busca case-insensitive
- Indicador visual quando há busca ativa
- Botão para limpar busca

### Modais
- Formulários podem ser renderizados dentro de modais
- Scroll automático para conteúdo longo
- Fechamento automático após sucesso
- Atualização automática da lista após criação/edição

### Feedback Visual
- Loading states em todas as operações assíncronas
- Mensagens de sucesso/erro
- Estados vazios informativos
- Indicadores de erro em campos de formulário

## Dependências Principais

```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "react-hook-form": "^7.0.0",
  "zod": "^3.0.0",
  "@hookform/resolvers": "^3.0.0",
  "@radix-ui/react-select": "^2.0.0",
  "@radix-ui/react-dialog": "^1.0.0",
  "@radix-ui/react-checkbox": "^1.0.0",
  "lucide-react": "^0.400.0"
}
```

## Troubleshooting

### Erro 404 em requisições (Local)
- Verifique se o backend está rodando na porta 8080
- Confirme que o `.env.local` está configurado corretamente
- Reinicie o servidor Next.js após alterar `.env.local`

### Erro 404 em requisições (Vercel)
- **Verifique se `NEXT_PUBLIC_API_URL` está configurada na Vercel**
- Confirme que a URL do backend está correta (sem `/api` no final)
- Faça um **re-deploy** após adicionar/modificar variáveis de ambiente
- Verifique os logs do build na Vercel para ver se há avisos

### Erro "DNS_HOSTNAME_RESOLVED_PRIVATE" (Vercel)
**Este erro foi resolvido!** Agora usamos API Routes ao invés de rewrites.

Se ainda ocorrer:
- Verifique se `NEXT_PUBLIC_API_URL` está configurada na Vercel com a URL **pública** do Railway
- A URL deve ser `https://seu-backend.up.railway.app` (não use hostnames privados)
- Teste a URL do backend diretamente no navegador para confirmar que está acessível
- Faça um re-deploy após configurar a variável de ambiente

### Erro de CORS
- O backend já está configurado com CORS
- Para produção, configure `CORS_ALLOWED_ORIGINS` no Railway com a URL da Vercel (ex: `https://almotos-front.vercel.app`)
- O proxy via API Routes já adiciona headers CORS automaticamente

### Componentes não encontrados
- Execute `npm install` para instalar todas as dependências
- Verifique se os componentes do Shadcn foram instalados corretamente

## Estrutura de Dados

### Tipos TypeScript

Todos os tipos estão definidos em `src/types/index.ts`:
- `Vehicle`, `VehicleCreate`, `VehicleBrand`, `VehicleStatus`
- `PartnerSummary`, `PartnerDetail`, `Customer`
- `Sale`, `SaleResponse`, `SaleCreate`
- `Purchase`, `PurchaseResponse`, `PurchaseCreate`
- `ExchangeResponse`, `TrocaInput`, `ExchangeUpdate`
- `Dashboard`, `FinancialReport`
- `FinancialMovement`, `StoreTransaction`, `StoreTransactionCreate`
- `PageResponse<T>` (para paginação)

## Próximos Passos

- [ ] Implementar edição de veículos
- [ ] Adicionar filtros avançados nas tabelas
- [ ] Implementar exportação de relatórios (PDF/Excel)
- [ ] Adicionar testes automatizados
