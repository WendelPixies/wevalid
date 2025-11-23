# Alterações no Banco de Dados - WeValid

## Resumo das Mudanças

### 1. Tabela `franchises` (Franquias)
**Novos campos adicionados:**
- `manager_name` (TEXT): Nome do responsável pela franquia
- `manager_email` (TEXT): Email do responsável
- `phone` (TEXT): Telefone de contato
- `is_active` (BOOLEAN): Status ativo/inativo da franquia (padrão: true)

**Objetivo:** Permitir bloqueio de uso de todos os usuários relacionados à franquia quando `is_active = false`.

### 2. Tabela `products` (Catálogo de Produtos)
**Novo campo adicionado:**
- `unit_cost` (DECIMAL 10,2): Custo unitário do produto

**Objetivo:** Armazenar o valor unitário de cada produto para cálculo de custos de inventário.

### 3. Tabela `inventory_items` (Itens de Inventário)
**Novos campos adicionados:**
- `franchise_id` (UUID): Referência à franquia (através da loja)
- `total_cost` (DECIMAL 10,2): Custo total calculado (quantidade × custo unitário)

**Objetivo:** 
- Facilitar consultas por franquia
- Armazenar o custo total do item no inventário

## Como Aplicar as Migrações

### Opção 1: Via Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá em "SQL Editor"
3. Cole o conteúdo do arquivo `migrations/add_franchise_fields.sql`
4. Execute a query

### Opção 2: Via CLI (se configurado)
```bash
supabase db push
```

## Sobre a Descrição do Produto

**Problema identificado:** A descrição não aparece nos itens de inventário.

**Causa:** A query JOIN com a tabela `products` está correta, mas pode haver produtos sem descrição cadastrada.

**Solução implementada:**
- Ao adicionar um item, se o produto não existir, ele é criado automaticamente
- A descrição é buscada da tabela `products` via JOIN
- Se não houver descrição, exibe "Produto não encontrado"

**Verificação:**
1. Certifique-se de que os produtos têm descrição na tabela `products`
2. Verifique se o JOIN está funcionando corretamente
3. Teste adicionando um novo produto com descrição

## Próximos Passos

1. ✅ Aplicar as migrações SQL no banco
2. ✅ Testar criação de franquia com novos campos
3. ✅ Testar adição de produto com custo unitário
4. ✅ Verificar se o `franchise_id` é preenchido automaticamente nos itens
5. ⏳ Implementar lógica de bloqueio quando `is_active = false`
6. ⏳ Criar relatórios de custo de inventário

## Notas Importantes

- O campo `total_cost` é calculado automaticamente: `quantidade × unit_cost`
- O `franchise_id` é preenchido automaticamente a partir da loja
- Produtos existentes terão `unit_cost = 0` até serem atualizados
- A migração atualiza automaticamente os `franchise_id` dos itens existentes
