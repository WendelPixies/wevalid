# WeValid Dashboard - Guia de Configuração

## 📊 Dashboard Web Criado!

Foi criada uma página web completa para gestão da franquia em: `public/dashboard.html`

### Funcionalidades Implementadas:

#### 1. **Filtro por Loja**
- Dropdown no topo permite selecionar uma loja específica ou ver todas
- Atualiza automaticamente todos os cards ao mudar a seleção

#### 2. **Cards de Estatísticas**
- 👥 Total de Funcionários
- 📦 Total de Produtos
- ⚠️ Produtos Vencendo em 7 dias
- 💰 Custo Total do Inventário

#### 3. **Lista de Funcionários**
- Mostra nome, email e função (Admin/Gestor/Operador)
- Indica em quais lojas cada funcionário está cadastrado
- Gestores aparecem como "Todas as lojas"

#### 4. **Lista de Produtos**
- Ordenados por data de validade (mais próximos primeiro)
- Mostra: loja, código, descrição, quantidade, validade e custo
- Cores indicativas de urgência:
  - 🔴 Vermelho: Vence em até 7 dias
  - 🟡 Amarelo: Vence em até 30 dias
  - 🟢 Verde: Mais de 30 dias
- Exibe categoria do produto (se cadastrada)

#### 5. **Ranking por Categoria**
- Cards coloridos mostrando as categorias mais valiosas
- Para cada categoria:
  - Número de produtos diferentes
  - Quantidade total de itens
  - Custo total
- Ordenado por custo (maior para menor)

## 🔧 Configuração Necessária

### 1. Aplicar Migração SQL

Execute no Supabase SQL Editor:

```sql
-- Arquivo: migrations/add_category_field.sql
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category TEXT;

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
```

### 2. Configurar Variáveis de Ambiente

O dashboard precisa das credenciais do Supabase. Existem duas opções:

#### Opção A: Usar as mesmas variáveis do app (Recomendado)
O dashboard já está configurado para ler do `.env` via Vite.

#### Opção B: Substituir diretamente no HTML
Abra `public/dashboard.html` e substitua:
```javascript
const SUPABASE_URL = 'SUA_URL_AQUI';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_AQUI';
```

### 3. Acessar o Dashboard

**Desenvolvimento:**
```
http://localhost:3001/dashboard.html
```

**Produção (após deploy):**
```
https://seu-dominio.com/dashboard.html
```

## 🎨 Design

- **Gradiente roxo** no header
- **Cards com hover** animado
- **Cores por urgência** nos produtos
- **Ranking colorido** por categoria
- **Responsivo** para desktop e mobile
- **Ícones Material Symbols**

## 📝 Próximos Passos

1. ✅ Aplicar migração SQL no Supabase
2. ✅ Testar o dashboard localmente
3. ⏳ Adicionar categorias aos produtos existentes
4. ⏳ Fazer deploy para produção
5. ⏳ (Opcional) Criar rota de autenticação dedicada para o dashboard

## 🔐 Segurança

- O dashboard usa autenticação do Supabase
- Usuários sem login são redirecionados para `/login`
- Apenas usuários da franquia veem seus dados
- RLS (Row Level Security) do Supabase protege os dados

## 💡 Dicas

- Para adicionar categoria a um produto, atualize a tabela `products`
- Categorias sugeridas: "Perfumaria", "Maquiagem", "Cabelos", "Corpo e Banho", etc.
- O dashboard atualiza automaticamente ao mudar o filtro de loja
- Produtos sem categoria aparecem como "Sem Categoria"
