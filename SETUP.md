# Configuração do Front-end para Backend Kotlin v2.0

## ⚠️ IMPORTANTE: Configuração da URL da API

O backend Kotlin v2.0 **NÃO usa o prefixo `/api`** nos endpoints. Todos os endpoints estão diretamente na raiz:
- ✅ `/reports/dashboard`
- ✅ `/vehicles`
- ✅ `/partners`
- ❌ ~~`/api/reports/dashboard`~~

## Passos para Configurar

1. **Crie o arquivo `.env.local`** na raiz do projeto `almotos-front`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**IMPORTANTE**: A URL deve ser `http://localhost:8080` (sem `/api` no final).

2. **Reinicie o servidor Next.js** após criar/modificar o `.env.local`:

```bash
# Pare o servidor (Ctrl+C) e inicie novamente
npm run dev
```

3. **Verifique se o backend Kotlin está rodando** na porta 8080:

```bash
# No diretório do backend Kotlin
cd vehicle-sales-manager-v2-kotlin
./gradlew bootRun
```

## Verificação

Após configurar, você pode testar se está funcionando:

1. Acesse `http://localhost:3000`
2. O dashboard deve carregar os dados do backend
3. Verifique o console do navegador - não deve haver erros 404

## Troubleshooting

### Erro 404 em `/api/reports/dashboard`

**Causa**: O `NEXT_PUBLIC_API_URL` ainda tem `/api` ou o servidor não foi reiniciado.

**Solução**:
1. Verifique o conteúdo do `.env.local` - deve ser exatamente `NEXT_PUBLIC_API_URL=http://localhost:8080`
2. Reinicie o servidor Next.js completamente
3. Limpe o cache do navegador (Ctrl+Shift+R)

### Erro de CORS

**Causa**: O backend não está permitindo requisições do front-end.

**Solução**: O backend já está configurado com CORS para `http://localhost:3000`. Se ainda houver erro, verifique se o backend está rodando.

## Estrutura de Endpoints

O front-end está configurado para usar os seguintes endpoints:

- **Veículos**: `/vehicles`, `/vehicles/available`
- **Parceiros**: `/partners`, `/partners/{cpf}`
- **Vendas**: `/sales`
- **Compras**: `/purchases`
- **Trocas**: `/exchanges` (ou `/trocas` para compatibilidade)
- **Relatórios**: `/reports/dashboard`, `/reports/financial`

Todos os endpoints usam paginação (exceto dashboard e relatórios).
