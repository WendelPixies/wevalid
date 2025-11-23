# Debug do Dashboard

## Como verificar os erros

1. Acesse: `http://localhost:3001/dash-login.html`
2. Faça login com suas credenciais
3. Quando abrir o dashboard (`/dash.html`), pressione **F12** para abrir o DevTools
4. Vá na aba **Console**
5. Verifique se há erros em vermelho

## Possíveis problemas:

### 1. Não há dados no banco
- Verifique se você tem franquias, lojas, usuários e produtos cadastrados
- Use o app mobile para adicionar dados primeiro

### 2. Erro de permissão (RLS)
- Mensagem: "permission denied" ou "row level security"
- Solução: Verificar políticas RLS no Supabase

### 3. Erro de query
- Mensagem: "column does not exist" ou similar
- Solução: Aplicar migrações SQL pendentes

### 4. Erro de autenticação
- Mensagem: "not authenticated" ou "no session"
- Solução: Fazer logout e login novamente

## Logs que devem aparecer no console:

Se tudo estiver funcionando, você deve ver:
```
Loading profile for user: [uuid]
Profile loaded: {role: "admin", ...}
Loading franchises for admin...
Franchises loaded: 2
Stores loaded: 5
```

## Me envie:

1. **Screenshot do console** com os erros (se houver)
2. **Mensagem de erro** que aparece na tela (se houver)
3. **Sua role** (admin, manager ou store_user)

Com essas informações posso corrigir o problema!
