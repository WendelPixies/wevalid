# Implementação de Filtros por Permissão no Dashboard

## Objetivo
Implementar lógica de permissões para filtros no dashboard:
- **Admin**: Ver dropdown de franquias + dropdown de lojas (cascade)
- **Manager**: Ver apenas dropdown de lojas (da sua franquia)

## Mudanças Necessárias no `public/dashboard.html`

### 1. Adicionar Dropdown de Franquias (HTML)

Substituir a seção de filtros (linhas 80-92) por:

```html
<main class="container mx-auto px-4 py-8">
    <div class="mb-8 fade-in">
        <div class="bg-white rounded-2xl shadow-lg p-6">
            <!-- Franchise Filter (Admin only) -->
            <div id="franchiseFilterContainer" class="hidden mb-6">
                <label class="block text-sm font-bold text-slate-700 mb-3">
                    <span class="material-symbols-outlined inline-block align-middle mr-2">business</span>
                    Filtrar por Franquia
                </label>
                <select id="franchiseFilter" onchange="filterByFranchise()"
                    class="w-full md:w-96 px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-lg font-medium">
                    <option value="all">🏢 Todas as Franquias</option>
                </select>
            </div>

            <!-- Store Filter -->
            <div>
                <label class="block text-sm font-bold text-slate-700 mb-3">
                    <span class="material-symbols-outlined inline-block align-middle mr-2">store</span>
                    Filtrar por Loja
                </label>
                <select id="storeFilter" onchange="filterByStore()"
                    class="w-full md:w-96 px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-lg font-medium">
                    <option value="all">📊 Todas as Lojas (Visão Geral)</option>
                </select>
            </div>
        </div>
    </div>
```

### 2. Adicionar Variáveis Globais (JavaScript)

Adicionar após as variáveis existentes:

```javascript
let currentUser = null;
let currentProfile = null;  // NOVO
let allFranchises = [];     // NOVO
let allEmployees = [];
let allProducts = [];
let allStores = [];
```

### 3. Atualizar função `loadData()`

Substituir a função loadData() por:

```javascript
async function loadData() {
    currentUser = await checkAuth();
    if (!currentUser) {
        document.getElementById('franchiseName').textContent = 'Não autenticado';
        return;
    }

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

    // Se for ADMIN, carregar todas as franquias
    if (profile.role === 'admin') {
        const { data: franchises } = await supabase
            .from('franchises')
            .select('*')
            .order('name');
        
        allFranchises = franchises || [];
        populateFranchiseFilter();
        document.getElementById('franchiseFilterContainer').classList.remove('hidden');
        
        // Carregar todas as lojas de todas as franquias
        const { data: stores } = await supabase
            .from('stores')
            .select('*')
            .order('name');
        allStores = stores || [];
    } else {
        // Manager ou store_user: apenas lojas da sua franquia
        if (!profile.franchise_id) {
            alert('Usuário sem franquia associada');
            return;
        }

        document.getElementById('franchiseName').textContent = profile.franchises?.name || 'Franquia';

        const { data: stores } = await supabase
            .from('stores')
            .select('*')
            .eq('franchise_id', profile.franchise_id)
            .order('name');
        allStores = stores || [];
    }

    populateStoreFilter();
    await loadDashboardData();
}
```

### 4. Adicionar função `populateFranchiseFilter()`

```javascript
function populateFranchiseFilter() {
    const select = document.getElementById('franchiseFilter');
    select.innerHTML = '<option value="all">🏢 Todas as Franquias</option>';
    allFranchises.forEach(franchise => {
        const option = document.createElement('option');
        option.value = franchise.id;
        option.textContent = `🏢 ${franchise.name}`;
        select.appendChild(option);
    });
}
```

### 5. Adicionar função `filterByFranchise()`

```javascript
window.filterByFranchise = async function() {
    const selectedFranchise = document.getElementById('franchiseFilter').value;
    
    // Atualizar lista de lojas baseado na franquia selecionada
    if (selectedFranchise === 'all') {
        const { data: stores } = await supabase
            .from('stores')
            .select('*')
            .order('name');
        allStores = stores || [];
    } else {
        const { data: stores } = await supabase
            .from('stores')
            .select('*')
            .eq('franchise_id', selectedFranchise)
            .order('name');
        allStores = stores || [];
    }
    
    populateStoreFilter();
    document.getElementById('storeFilter').value = 'all';
    await loadDashboardData();
};
```

### 6. Criar função `loadDashboardData()`

```javascript
async function loadDashboardData() {
    const selectedFranchise = currentProfile.role === 'admin' 
        ? document.getElementById('franchiseFilter').value 
        : currentProfile.franchise_id;

    let franchiseFilter = {};
    if (selectedFranchise !== 'all') {
        franchiseFilter = { franchise_id: selectedFranchise };
    }

    // Load employees
    const { data: employees } = await supabase
        .from('user_profiles')
        .select(`*, user_stores (stores (id, name))`)
        .match(franchiseFilter)
        .eq('status', 'approved');

    allEmployees = employees?.map(e => ({
        ...e,
        stores: e.user_stores?.map(us => us.stores) || []
    })) || [];

    // Load products
    const { data: products } = await supabase
        .from('inventory_items')
        .select(`*, products (description, category, unit_cost), stores (name)`)
        .match(franchiseFilter)
        .order('expiry_date', { ascending: true });

    allProducts = products?.map(p => ({
        ...p,
        product_description: p.products?.description,
        category: p.products?.category,
        store_name: p.stores?.name
    })) || [];

    updateDashboard();
}
```

## Resumo das Mudanças

1. ✅ Adicionar dropdown de franquias (oculto por padrão)
2. ✅ Mostrar dropdown de franquias apenas para admins
3. ✅ Implementar filtro cascade (franquia → lojas)
4. ✅ Managers veem apenas lojas da sua franquia
5. ✅ Admins podem ver todas as franquias e todas as lojas

## Testando

1. Login como **Admin**: Deve ver dropdown de franquias + lojas
2. Login como **Manager**: Deve ver apenas dropdown de lojas da sua franquia
3. Selecionar franquia (admin): Dropdown de lojas deve atualizar
4. Dados devem filtrar corretamente
