# Configuração do Deploy na Vercel

Este documento explica como configurar o frontend na Vercel para se conectar com o backend na Railway.

## Problema Resolvido

O erro `DNS_HOSTNAME_RESOLVED_PRIVATE` que ocorria na Vercel foi resolvido substituindo os `rewrites` do Next.js por **API Routes**. Agora o proxy funciona corretamente em produção.

## Passos para Configurar

### 1. Configurar Variável de Ambiente na Vercel

1. Acesse o dashboard da Vercel: https://vercel.com
2. Selecione seu projeto (`almotos-front`)
3. Vá em **Settings** → **Environment Variables**
4. Clique em **Add New**
5. Adicione a seguinte variável:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://vehicle-sales-manager-v2-kotlin-production.up.railway.app`
     - ⚠️ **IMPORTANTE**: Substitua pela URL **pública** real do seu backend no Railway
   - **Environment**: Selecione **Production**, **Preview** e **Development** (ou apenas Production se preferir)
6. Clique em **Save**

### 2. Verificar URL do Backend no Railway

1. Acesse o dashboard da Railway: https://railway.app
2. Selecione seu projeto do backend
3. Vá na aba **Settings** → **Networking**
4. Copie a URL pública (formato: `https://seu-projeto.up.railway.app`)
5. **IMPORTANTE**: Use a URL pública, não use hostnames privados (como `*.railway.internal`)

### 3. Fazer Re-deploy

Após adicionar/modificar variáveis de ambiente, você **DEVE** fazer um novo deploy:

1. Na Vercel, vá em **Deployments**
2. Clique nos três pontos (...) do último deployment
3. Selecione **Redeploy**
4. Ou faça um novo commit e push para o repositório

## Verificação

Após o deploy, verifique se está funcionando:

1. Acesse a URL do seu frontend na Vercel
2. Abra o console do navegador (F12)
3. Verifique se não há erros 404 ou DNS
4. Teste uma funcionalidade (ex: listar veículos)

## Troubleshooting

### Erro 404 em `/api/proxy/vehicles`

**Causa**: A variável `NEXT_PUBLIC_API_URL` não está configurada ou está incorreta.

**Solução**:
1. Verifique se a variável está configurada na Vercel
2. Confirme que a URL está correta (sem `/api` no final)
3. Faça um re-deploy após configurar a variável

### Erro "DNS_HOSTNAME_RESOLVED_PRIVATE"

**Causa**: A URL do backend está usando um hostname privado ou está incorreta.

**Solução**:
1. Use a URL **pública** do Railway (formato: `https://*.up.railway.app`)
2. Não use hostnames privados (como `*.railway.internal`)
3. Teste a URL diretamente no navegador para confirmar que está acessível

### Erro de CORS

**Causa**: O backend não está permitindo requisições do frontend.

**Solução**:
1. No Railway, configure a variável `CORS_ALLOWED_ORIGINS` com a URL da Vercel:
   ```
   CORS_ALLOWED_ORIGINS=https://almotos-front.vercel.app
   ```
2. Ou use `*` para permitir qualquer origem (não recomendado para produção)

### Backend não responde

**Causa**: O backend pode estar offline ou com problemas.

**Solução**:
1. Verifique os logs do backend no Railway
2. Teste a URL do backend diretamente no navegador
3. Verifique se o backend está rodando e acessível

## Estrutura da Solução

A solução usa **API Routes** do Next.js ao invés de `rewrites`:

- **Arquivo**: `src/app/api/proxy/[...path]/route.ts`
- **Funcionamento**:
  1. Frontend faz requisição para `/api/proxy/vehicles`
  2. API Route recebe no servidor Next.js
  3. API Route faz proxy para o backend usando `NEXT_PUBLIC_API_URL`
  4. Resposta é retornada ao frontend

**Vantagens**:
- ✅ Funciona corretamente na Vercel
- ✅ Resolve problemas de DNS com hostnames privados
- ✅ Mantém CORS configurado
- ✅ Melhor tratamento de erros

## Variáveis de Ambiente

### Desenvolvimento Local

Crie o arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Produção (Vercel)

Configure na Vercel:

```
NEXT_PUBLIC_API_URL=https://seu-backend.up.railway.app
```

## Próximos Passos

Após configurar:

1. ✅ Teste todas as funcionalidades
2. ✅ Verifique os logs na Vercel
3. ✅ Monitore erros no console do navegador
4. ✅ Configure CORS no backend se necessário
