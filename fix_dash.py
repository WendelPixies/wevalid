import re

# Read the file
with open('f:/wevalidity/public/dash.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add manage button to Employees header
old_header = '''                <div class="p-4 border-b">
                    <h2 class="text-lg font-semibold text-gray-800">Funcionários</h2>
                </div>'''

new_header = '''                <div class="p-4 border-b flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-gray-800">Funcionários</h2>
                    <button id="manageUsersBtn" onclick="window.location.href='/manage-users.html'" class="hidden px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all">
                        Gerenciar
                    </button>
                </div>'''

content = content.replace(old_header, new_header)

# 2. Show button for admin
old_admin = '''            if (profile.role === 'admin') {
                document.getElementById('adminControls').classList.remove('hidden');
                document.getElementById('franchiseFilterContainer').classList.remove('hidden');'''

new_admin = '''            if (profile.role === 'admin') {
                document.getElementById('adminControls').classList.remove('hidden');
                document.getElementById('franchiseFilterContainer').classList.remove('hidden');
                document.getElementById('manageUsersBtn').classList.remove('hidden');'''

content = content.replace(old_admin, new_admin)

# 3. Show button for manager
old_manager = '''            } else {
                if (!profile.franchise_id) {
                    alert('Usuário sem franquia associada');
                    return;
                }
                const { data: stores } = await supabase.from('stores').select('*').eq('franchise_id', profile.franchise_id).order('name');'''

new_manager = '''            } else {
                if (!profile.franchise_id) {
                    alert('Usuário sem franquia associada');
                    return;
                }
                // Show manage button for managers
                if (profile.role === 'manager') {
                    document.getElementById('manageUsersBtn').classList.remove('hidden');
                }
                const { data: stores } = await supabase.from('stores').select('*').eq('franchise_id', profile.franchise_id).order('name');'''

content = content.replace(old_manager, new_manager)

# 4. Filter admins in renderEmployees
old_render = '''        function renderEmployees(employees) {
            const container = document.getElementById('employeesList');
            if (employees.length === 0) {
                container.innerHTML = '<p class="text-center text-gray-400 py-8">Nenhum funcionário encontrado</p>';
                return;
            }

            container.innerHTML = employees.map(emp => {'''

new_render = '''        function renderEmployees(employees) {
            const container = document.getElementById('employeesList');
            
            // Filter out admins if current user is not admin
            const filteredEmployees = currentProfile.role === 'admin' 
                ? employees 
                : employees.filter(emp => emp.role !== 'admin');
            
            if (filteredEmployees.length === 0) {
                container.innerHTML = '<p class="text-center text-gray-400 py-8">Nenhum funcionário encontrado</p>';
                return;
            }

            container.innerHTML = filteredEmployees.map(emp => {'''

content = content.replace(old_render, new_render)

# 5. Fix timezone in renderProducts
old_date = '''            container.innerHTML = products.slice(0, 20).map(product => {
                const expiryDate = new Date(product.expiry_date);
                const today = new Date();
                const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));'''

new_date = '''            container.innerHTML = products.slice(0, 20).map(product => {
                // Parse date in São Paulo timezone (UTC-3)
                const expiryDate = new Date(product.expiry_date + 'T00:00:00-03:00');
                const today = new Date();
                const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));'''

content = content.replace(old_date, new_date)

# 6. Fix days format
old_days = '''                            <span class="${urgencyColor}">${expiryDate.toLocaleDateString('pt-BR')} (${daysUntilExpiry}d)</span>'''

new_days = '''                            <span class="${urgencyColor}">${expiryDate.toLocaleDateString('pt-BR')} (${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'dia' : 'dias'})</span>'''

content = content.replace(old_days, new_days)

# Write the file
with open('f:/wevalidity/public/dash.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Modificações aplicadas com sucesso!")
