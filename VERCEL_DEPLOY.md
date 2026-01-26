# Deploy do Frontend na Vercel

Este documento descreve como fazer o deploy do frontend na Vercel e conectá-lo ao backend no Railway.

## Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Backend já deployado no Railway (veja `vehicle-sales-manager-v2-kotlin/DEPLOY.md`)
3. URL do backend Railway (ex: `https://seu-app.railway.app`)

## Passos para Deploy

### 1. Conectar Repositório

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em **"Add New..."** → **"Project"**
3. Conecte seu repositório GitHub/GitLab/Bitbucket
4. Selecione o diretório `almotos-front` (ou o repositório que contém o frontend)

### 2. Configurar Variáveis de Ambiente

**IMPORTANTE**: Configure a variável de ambiente antes de fazer o deploy!

1. Na página de configuração do projeto na Vercel, vá em **"Environment Variables"**
2. Adicione a seguinte variável:

```
NEXT_PUBLIC_API_URL=https://seu-backend.railway.app
```

**Substitua `https://seu-backend.railway.app` pela URL real do seu backend no Railway.**

**Como encontrar a URL do Railway:**
- No Railway, vá no serviço do backend
- Clique em **"Settings"** → **"Networking"**
- Copie a URL pública (ex: `https://vehicle-sales-manager-v2-kotlin-production.up.railway.app`)

### 3. Configurar Build Settings

O Vercel detecta automaticamente projetos Next.js, mas verifique:

- **Framework Preset**: Next.js
- **Root Directory**: `almotos-front` (se o projeto estiver em um monorepo)
- **Build Command**: `npm run build` (padrão)
- **Output Directory**: `.next` (padrão)

### 4. Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar
3. Após o deploy, acesse a URL fornecida pela Vercel

## Verificação

Após o deploy, verifique:

1. **Acesse a URL da Vercel** (ex: `https://almotos-front.vercel.app`)
2. **Verifique o console do navegador** - não deve haver erros 404
3. **Teste uma funcionalidade** - por exemplo, acesse o Dashboard e verifique se os dados carregam

## Troubleshooting

### Erro 404 em `/api/proxy/*`

**Causa**: A variável `NEXT_PUBLIC_API_URL` não está configurada ou está incorreta.

**Solução**:
1. No Vercel, vá em **"Settings"** → **"Environment Variables"**
2. Verifique se `NEXT_PUBLIC_API_URL` está configurada
3. Verifique se a URL está correta (sem barra no final)
4. **Re-deploy** o projeto após adicionar/modificar variáveis de ambiente

### Erro de CORS

**Causa**: O backend no Railway não está permitindo requisições da origem da Vercel.

**Solução**:
1. No Railway, configure a variável de ambiente `CORS_ALLOWED_ORIGINS`
2. Adicione a URL da Vercel: `https://seu-app.vercel.app`
3. Para múltiplas origens: `https://seu-app.vercel.app,http://localhost:3000`
4. Reinicie o serviço no Railway

### Erro "DNS_HOSTNAME_RESOLVED_PRIVATE"

**Causa**: A URL do backend está incorreta ou o backend não está acessível publicamente.

**Solução**:
1. Verifique se o backend está realmente deployado e rodando no Railway
2. Teste a URL do backend diretamente no navegador: `https://seu-backend.railway.app/reports/dashboard`
3. Verifique se a URL no `NEXT_PUBLIC_API_URL` está correta (sem `/api` no final)
4. Certifique-se de que o backend está usando HTTPS (Railway fornece HTTPS automaticamente)

### Variável de Ambiente Não Funciona

**Importante**: Variáveis de ambiente que começam com `NEXT_PUBLIC_` são expostas ao cliente.

**Após adicionar/modificar variáveis de ambiente:**
1. Você **DEVE** fazer um novo deploy
2. Variáveis de ambiente são injetadas no build time
3. Se você apenas adicionar a variável sem re-deploy, ela não estará disponível

**Como fazer re-deploy:**
- Vá em **"Deployments"** no Vercel
- Clique nos três pontos (...) do último deployment
- Selecione **"Redeploy"**

## Estrutura de Proxy

O frontend usa um proxy via Next.js rewrites para evitar problemas de CORS:

- **Frontend chama**: `/api/proxy/vehicles`
- **Next.js reescreve para**: `${NEXT_PUBLIC_API_URL}/vehicles`
- **Backend recebe**: `GET /vehicles`

Isso permite que o frontend faça requisições sem problemas de CORS, já que as requisições são feitas para o mesmo domínio (Vercel) e o Next.js faz o proxy internamente.

## Exemplo de Configuração Completa

### No Railway (Backend)

Variáveis de ambiente:
```
SPRING_DATASOURCE_URL=jdbc:postgresql://...
SPRING_DATASOURCE_USERNAME=...
SPRING_DATASOURCE_PASSWORD=...
CORS_ALLOWED_ORIGINS=https://almotos-front.vercel.app,http://localhost:3000
```

### No Vercel (Frontend)

Variáveis de ambiente:
```
NEXT_PUBLIC_API_URL=https://vehicle-sales-manager-v2-kotlin-production.up.railway.app
```

**Nota**: Substitua pela URL real do seu backend no Railway.

## URLs de Exemplo

- **Frontend (Vercel)**: `https://almotos-front.vercel.app`
- **Backend (Railway)**: `https://vehicle-sales-manager-v2-kotlin-production.up.railway.app`

Certifique-se de que:
1. A URL do backend está correta no `NEXT_PUBLIC_API_URL`
2. A URL do frontend está incluída no `CORS_ALLOWED_ORIGINS` do backend
3. Ambas as aplicações estão rodando e acessíveis
