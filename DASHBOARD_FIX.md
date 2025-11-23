# Correção do Dashboard - Erro "Perfil não encontrado"

## Problema
O dashboard está mostrando "Perfil não encontrado" porque a query com join na tabela `franchises` está falhando.

## Solução

Abra o arquivo: `f:\wevalidity\public\dash.html`

### Passo 1: Localize as linhas 152-166

Procure por este código:

```javascript
        // Load initial data
        async function loadData() {
            currentUser = await checkAuth();
            if (!currentUser) return;

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('*, franchises(name)')
                .eq('id', currentUser.id)
                .single();

            if (!profile) {
                alert('Perfil não encontrado');
                return;
            }

            currentProfile = profile;
```

### Passo 2: Substitua por este código:

```javascript
        // Load initial data
        async function loadData() {
            currentUser = await checkAuth();
            if (!currentUser) return;

            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();

            if (profileError) {
                console.error('Profile error:', profileError);
                alert('Erro ao carregar perfil: ' + profileError.message);
                return;
            }

            if (!profile) {
                alert('Perfil não encontrado');
                return;
            }

            currentProfile = profile;
```

### O que mudou:

1. ✅ Removido o join `franchises(name)` que estava causando erro
2. ✅ Adicionado `error: profileError` para capturar erros
3. ✅ Adicionado log de erro no console
4. ✅ Mensagem de erro mais descritiva

### Após fazer a correção:

1. Salve o arquivo
2. Recarregue a página do dashboard (F5)
3. O dashboard deve carregar normalmente!

## Se ainda houver erro:

Abra o console do navegador (F12) e me envie a mensagem de erro que aparecer.
