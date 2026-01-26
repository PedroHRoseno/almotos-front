# Troubleshooting - Erros de Conexão com Backend

## Erro: "fetch failed" ou 500 no proxy

Se você está recebendo erro 500 com mensagem "fetch failed" ao tentar fazer requisições através do proxy, siga estes passos:

### 1. Verificar Variável de Ambiente na Vercel

**IMPORTANTE**: A variável `NEXT_PUBLIC_API_URL` DEVE estar configurada na Vercel.

1. Acesse: https://vercel.com → Seu Projeto → Settings → Environment Variables
2. Verifique se existe `NEXT_PUBLIC_API_URL`
3. Verifique se o valor está correto (URL pública do Railway, ex: `https://seu-backend.up.railway.app`)
4. **NÃO use** hostnames privados (como `*.railway.internal`)

### 2. Verificar URL do Backend

1. Acesse o dashboard da Railway
2. Vá em Settings → Networking
3. Copie a URL pública (formato: `https://*.up.railway.app`)
4. Teste a URL diretamente no navegador: `https://seu-backend.up.railway.app/reports/dashboard`
5. Se funcionar no navegador, a URL está correta

### 3. Fazer Re-deploy

**CRÍTICO**: Após adicionar/modificar variáveis de ambiente, você DEVE fazer um novo deploy:

1. Na Vercel, vá em Deployments
2. Clique nos três pontos (...) do último deployment
3. Selecione "Redeploy"
4. Ou faça um commit e push para forçar novo deploy

### 4. Verificar Logs

1. Na Vercel, vá em seu projeto → Deployments → Clique no deployment mais recente
2. Vá na aba "Functions" → Clique em `/api/proxy/[...path]`
3. Veja os logs para identificar o erro específico
4. Procure por mensagens como:
   - "NEXT_PUBLIC_API_URL não está configurado"
   - "URL inválida"
   - "Erro ao fazer fetch"

### 5. Verificar CORS no Backend

Se o proxy não funcionar, você pode tentar fazer requisições diretas (se o CORS estiver configurado):

1. No Railway, configure `CORS_ALLOWED_ORIGINS` com a URL da Vercel:
   ```
   CORS_ALLOWED_ORIGINS=https://almotos-front.vercel.app
   ```
2. Ou use `*` para permitir qualquer origem (não recomendado para produção)

### 6. Testar Localmente

Para testar se o problema é específico da Vercel:

1. Crie um arquivo `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=https://seu-backend.up.railway.app
   ```
2. Execute `npm run dev`
3. Teste se as requisições funcionam localmente
4. Se funcionar localmente mas não na Vercel, o problema é a configuração da variável de ambiente na Vercel

## Erros Comuns

### Erro: "Backend URL não configurada"

**Causa**: `NEXT_PUBLIC_API_URL` não está configurada na Vercel.

**Solução**: 
1. Configure a variável na Vercel
2. Faça um re-deploy

### Erro: "Erro ao conectar com o backend" (502)

**Causa**: O servidor da Vercel não consegue acessar o backend.

**Soluções**:
1. Verifique se a URL do backend está correta
2. Verifique se o backend está rodando no Railway
3. Teste a URL diretamente no navegador
4. Verifique se não está usando hostname privado

### Erro: "Timeout ao conectar com o backend" (504)

**Causa**: O backend demorou mais de 30 segundos para responder.

**Soluções**:
1. Verifique se o backend está lento ou sobrecarregado
2. Verifique os logs do backend no Railway
3. Verifique se há problemas de rede

### Erro: 404 em `/api/proxy/*`

**Causa**: A API Route não está sendo encontrada.

**Soluções**:
1. Verifique se o arquivo `src/app/api/proxy/[...path]/route.ts` existe
2. Faça um novo build: `npm run build`
3. Verifique se há erros de compilação

## Alternativa: Requisições Diretas (Sem Proxy)

Se o proxy continuar dando problemas e o CORS estiver configurado no backend, você pode modificar `src/lib/api.ts` para fazer requisições diretas:

```typescript
// Em src/lib/api.ts, substitua:
const PROXY_PREFIX = "/api/proxy";
const getBaseUrl = () =>
  typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

// Por:
const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    // No cliente, usa a variável de ambiente
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
};

// E na função request:
const url = new URL(path, getBackendUrl()); // Sem PROXY_PREFIX
```

**Nota**: Isso só funciona se o CORS estiver configurado corretamente no backend.

## Verificação Rápida

Execute este checklist:

- [ ] `NEXT_PUBLIC_API_URL` está configurada na Vercel?
- [ ] A URL está correta (formato `https://*.up.railway.app`)?
- [ ] Foi feito um re-deploy após configurar a variável?
- [ ] O backend está rodando e acessível?
- [ ] A URL funciona quando testada diretamente no navegador?
- [ ] Os logs da Vercel mostram algum erro específico?

## Suporte

Se nenhuma das soluções acima funcionar:

1. Verifique os logs completos na Vercel
2. Verifique os logs do backend no Railway
3. Teste a URL do backend diretamente (curl ou Postman)
4. Verifique se há problemas de rede ou firewall
