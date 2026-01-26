# Debug - Botão não funciona na Vercel

## Problema
O botão "Nova Compra" não funciona na Vercel (Chrome), mas funciona localmente.

## Mudanças Realizadas

1. **Handler com useCallback**: Criado `handleOpenModal` usando `useCallback` para garantir que o handler seja estável
2. **Logs de debug**: Adicionados logs no console para rastrear o comportamento
3. **Monitoramento de estado**: `useEffect` para monitorar mudanças no estado do modal
4. **Type="button"**: Garantido que o botão não seja do tipo submit

## Como Testar

1. **Abra o console do navegador** (F12 → Console)
2. **Clique no botão "Nova Compra"**
3. **Verifique os logs**:
   - Deve aparecer: `[Compras] handleOpenModal chamado`
   - Deve aparecer: `[Compras] Modal aberto com sucesso`
   - Deve aparecer: `[Compras] Estado do modal mudou: true`

## Possíveis Causas

### 1. JavaScript não está carregando
- Verifique se há erros no console
- Verifique a aba Network se os arquivos JS estão sendo carregados
- Verifique se há bloqueadores de script (AdBlock, etc.)

### 2. Erro silencioso
- Abra o console e verifique se há erros em vermelho
- Verifique a aba Console → Errors

### 3. Problema de hidratação do React
- Verifique se há warnings de hidratação no console
- Procure por: "Hydration failed" ou "Text content does not match"

### 4. Problema com o Dialog/Radix UI
- Verifique se o `@radix-ui/react-dialog` está instalado corretamente
- Verifique se há conflitos de versão

### 5. Problema com event handlers
- Tente clicar com o botão direito → Inspecionar elemento
- Verifique se o evento onClick está anexado ao elemento

## Soluções Alternativas

Se o problema persistir, tente:

### Solução 1: Usar button nativo
```tsx
<button
  onClick={handleOpenModal}
  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2"
  type="button"
>
  <Plus className="h-4 w-4" />
  Nova Compra
</button>
```

### Solução 2: Adicionar event listener manualmente
```tsx
useEffect(() => {
  const button = document.getElementById('nova-compra-btn');
  if (button) {
    button.addEventListener('click', handleOpenModal);
    return () => button.removeEventListener('click', handleOpenModal);
  }
}, [handleOpenModal]);
```

### Solução 3: Verificar build de produção
```bash
npm run build
npm run start
```
Teste localmente com build de produção para ver se o problema ocorre.

## Próximos Passos

1. Teste na Vercel e verifique os logs do console
2. Compartilhe os logs/erros encontrados
3. Se necessário, implementaremos uma das soluções alternativas
