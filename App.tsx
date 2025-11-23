import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { InventoryItem, FilterType, UserProfile, Store, Franchise } from './types';
import { getStoreInventory, getAllInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, getProductByCode, getStores, addStore, updateStore, getFranchises, addFranchise, getFranchiseStores, getFranchiseUsers } from './services/productService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { ProductCard } from './components/ProductCard';
import { DeleteModal } from './components/DeleteModal';
import { FranchiseDashboard } from './components/FranchiseDashboard';
import { ManageUsersScreen } from './components/ManageUsersScreen';
import { ResetPasswordScreen } from './components/ResetPasswordScreen';
import { UpdatePasswordScreen } from './components/UpdatePasswordScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// --- Components ---

const ProtectedRoute = ({ children, requiredRole }: { children: JSX.Element, requiredRole?: 'admin' | 'manager' | 'store_user' }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.status === 'pending') {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background-light dark:bg-background-dark">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
          <span className="material-symbols-outlined text-5xl text-amber-500 mb-4">hourglass_top</span>
          <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Aguardando Aprovação</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            Seu cadastro foi realizado e está pendente de aprovação pelo gestor da franquia.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Você receberá um e-mail assim que seu acesso for liberado.
          </p>
          <button onClick={() => supabase.auth.signOut()} className="text-primary font-bold hover:underline">
            Voltar para Login
          </button>
        </div>
      </div>
    );
  }

  if (requiredRole) {
    if (requiredRole === 'admin' && profile?.role !== 'admin') {
      return <Navigate to={profile?.role === 'manager' ? '/dashboard-franchise' : '/dashboard-store'} replace />;
    }
    if (requiredRole === 'manager' && profile?.role !== 'manager' && profile?.role !== 'admin') {
      return <Navigate to="/dashboard-store" replace />;
    }
  }

  return children;
};

// --- Screens ---

// 1. Welcome Screen
const WelcomeScreen = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'admin') navigate('/dashboard-general');
      else if (profile.role === 'manager') navigate('/dashboard-franchise');
      else navigate('/dashboard-store');
    }
  }, [user, profile, navigate]);

  return (
    <div className="relative flex min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark">
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="flex w-full max-w-md flex-col items-center">
          <h1 className="text-slate-900 dark:text-white text-4xl font-black tracking-tighter mb-8 font-display">
            WeValid
          </h1>
          <div className="relative w-72 h-72 rounded-full bg-[#FFC72C] flex items-center justify-center mb-8">
            <img src="/perfume_icon.png" alt="WeValid Logo" className="w-40 h-40 object-contain invert drop-shadow-lg" />
          </div>
          <div className="flex w-full flex-col items-center p-4">
            <h2 className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight text-center pb-3 pt-6 font-display">
              Controle de Validade Inteligente
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base font-normal leading-normal pb-3 pt-1 px-4 text-center font-display">
              Gerencie a validade dos produtos de O Boticário de forma eficiente reduzindo perdas.
            </p>
          </div>
        </div>
      </main>
      <footer className="w-full shrink-0 p-4">
        <div className="flex px-4 py-3 max-w-md mx-auto">
          <button
            onClick={() => navigate('/login')}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 flex-1 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] font-display hover:bg-primary/90 transition-colors"
          >
            <span className="truncate">Começar</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

// 2. Login Screen
const LoginScreen = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedFranchise, setSelectedFranchise] = useState('');
  const [franchises, setFranchises] = useState<Franchise[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (user && profile) {
      // if (profile.status === 'pending') return; // Allow redirect so ProtectedRoute shows the pending screen
      if (profile.role === 'admin') navigate('/dashboard-general');
      else if (profile.role === 'manager') navigate('/dashboard-franchise');
      else navigate('/dashboard-store');
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    if (isSignUp) {
      getFranchises().then(setFranchises).catch(console.error);
    }
  }, [isSignUp]);

  const handleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        if (!selectedFranchise) {
          throw new Error("Selecione uma franquia.");
        }
        if (!fullName) {
          throw new Error("Digite seu nome completo.");
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              franchise_id: selectedFranchise
            }
          }
        });
        if (authError) throw authError;

        // Profile is now created automatically by the database trigger 'on_auth_user_created'
        // using the metadata provided above. No need for manual insert/upsert here.

        alert("Cadastro realizado com sucesso! Aguarde a aprovação do gestor da sua franquia.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
    } catch (e: any) {
      console.error(e);
      let msg = e.message;
      if (msg.includes("Invalid login credentials")) msg = "E-mail ou senha incorretos.";
      if (msg.includes("Email not confirmed")) msg = "E-mail não confirmado.";
      if (msg.includes("User already registered")) msg = "Este e-mail já está cadastrado.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <div className="flex w-full max-w-sm flex-col items-center">
        <div className="mb-8">
          <img src="/perfume_icon.png" alt="Logo" className="w-24 h-24 object-contain" />
        </div>
        <h1 className="text-[#111418] dark:text-white tracking-tight text-[28px] font-bold leading-tight text-center pb-8">
          {isSignUp ? 'Solicitar Acesso' : 'Acesse sua conta'}
        </h1>
        <div className="w-full space-y-4">
          {isSignUp && (
            <>
              <label className="flex w-full flex-col">
                <p className="text-[#333333] dark:text-gray-300 text-base font-medium leading-normal pb-2">Nome Completo</p>
                <input
                  className="form-input flex w-full rounded-lg border border-[#dbe0e6] dark:border-gray-700 bg-white dark:bg-background-dark h-14 px-4 text-base"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </label>
              <label className="flex w-full flex-col">
                <p className="text-[#333333] dark:text-gray-300 text-base font-medium leading-normal pb-2">Franquia</p>
                <select
                  className="form-input flex w-full rounded-lg border border-[#dbe0e6] dark:border-gray-700 bg-white dark:bg-background-dark h-14 px-4 text-base"
                  value={selectedFranchise}
                  onChange={e => setSelectedFranchise(e.target.value)}
                >
                  <option value="">Selecione sua franquia...</option>
                  {franchises.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className="flex w-full flex-col">
            <p className="text-[#333333] dark:text-gray-300 text-base font-medium leading-normal pb-2">E-mail</p>
            <input
              className="form-input flex w-full rounded-lg border border-[#dbe0e6] dark:border-gray-700 bg-white dark:bg-background-dark h-14 px-4 text-base"
              placeholder="Digite seu e-mail"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </label>
          <label className="flex w-full flex-col">
            <p className="text-[#333333] dark:text-gray-300 text-base font-medium leading-normal pb-2">Senha</p>
            <input
              className="form-input flex w-full rounded-lg border border-[#dbe0e6] dark:border-gray-700 bg-white dark:bg-background-dark h-14 px-4 text-base"
              placeholder="Digite sua senha"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <div className="w-full pt-8 pb-4">
          <button
            onClick={handleAuth}
            disabled={loading}
            className="flex w-full cursor-pointer items-center justify-center rounded-lg h-14 px-5 bg-primary text-white text-base font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processando...' : (isSignUp ? 'Solicitar Cadastro' : 'Entrar')}
          </button>
        </div>
        <div className="w-full text-center space-y-2">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary hover:underline text-sm font-medium"
          >
            {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
          </button>
          {!isSignUp && (
            <div className="block">
              <button
                type="button"
                onClick={() => navigate('/reset-password')}
                className="text-gray-500 hover:underline text-xs"
              >
                Esqueci minha senha
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 3. General Dashboard (Admin)
const GeneralDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFranchises();
  }, []);

  const loadFranchises = async () => {
    try {
      const data = await getFranchises();
      setFranchises(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <header className="flex items-center bg-white dark:bg-background-dark p-4 justify-between sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
        <span className="material-symbols-outlined text-2xl text-slate-800 dark:text-slate-200">menu</span>
        <h1 className="text-slate-900 dark:text-white text-lg font-bold">Dashboard Admin</h1>
        <button onClick={signOut} className="text-slate-800 dark:text-slate-200">
          <span className="material-symbols-outlined text-2xl">logout</span>
        </button>
      </header>
      <main className="flex-1 p-4 pb-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-slate-900 dark:text-white text-lg font-bold">Franquias</h2>
          <button
            onClick={() => navigate('/add-franchise')}
            className="flex items-center gap-1 bg-primary text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Nova Franquia
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {loading ? <p>Carregando...</p> : franchises.length === 0 ? <p className="text-gray-500">Nenhuma franquia cadastrada.</p> : franchises.map(franchise => (
            <div
              key={franchise.id}
              onClick={() => navigate('/dashboard-franchise', { state: { franchiseId: franchise.id, franchiseName: franchise.name, isAdminView: true } })}
              className="flex gap-4 bg-white dark:bg-slate-800 p-4 justify-between rounded-xl shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-600 shrink-0 size-12">
                  <span className="material-symbols-outlined text-3xl text-slate-600 dark:text-slate-300">domain</span>
                </div>
                <div>
                  <p className="text-slate-900 dark:text-white font-medium">{franchise.name}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 self-center">chevron_right</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

// 3.2 Add Franchise Screen
const AddFranchiseScreen = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Digite o nome da franquia");
      return;
    }
    setLoading(true);
    try {
      await addFranchise(name);
      alert("Franquia criada com sucesso!");
      navigate('/dashboard-general');
    } catch (e) {
      alert("Erro ao criar franquia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <header className="flex items-center bg-white dark:bg-background-dark p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-slate-800 dark:text-white"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="flex-1 text-center text-lg font-bold text-slate-900 dark:text-white">Nova Franquia</h1>
        <div className="w-6"></div>
      </header>
      <main className="p-4 space-y-6">
        <label className="block">
          <span className="text-slate-700 dark:text-slate-300 font-medium">Nome da Franquia *</span>
          <input
            className="form-input w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Grupo Boticário Sul"
          />
        </label>
      </main>
      <footer className="p-4 bg-white dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 sticky bottom-0">
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-primary text-white font-bold py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Criar Franquia'}
        </button>
      </footer>
    </div>
  );
};

// 3.5 Add Store Screen
const AddStoreScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const franchiseId = location.state?.franchiseId;
  const editStore = location.state?.editStore as Store | undefined;

  useEffect(() => {
    if (franchiseId) {
      getFranchiseUsers(franchiseId).then(setUsers).catch(console.error);
    }
  }, [franchiseId]);

  useEffect(() => {
    if (editStore) {
      setName(editStore.name);
      if (editStore.contact_email) {
        setContactEmail(editStore.contact_email);
      }
    }
  }, [editStore]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Digite o nome da loja");
      return;
    }
    if (!contactEmail) {
      alert("Selecione um responsável (email) para a loja");
      return;
    }

    setLoading(true);
    try {
      if (editStore) {
        await updateStore(editStore.id, { name, contact_email: contactEmail });
        alert("Loja atualizada com sucesso!");
      } else {
        await addStore(name, franchiseId, contactEmail);
        alert("Loja criada com sucesso!");
      }
      navigate(-1);
    } catch (e) {
      alert("Erro ao salvar loja");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <header className="flex items-center bg-white dark:bg-background-dark p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-slate-800 dark:text-white"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="flex-1 text-center text-lg font-bold text-slate-900 dark:text-white">{editStore ? 'Editar Loja' : 'Nova Loja'}</h1>
        <div className="w-6"></div>
      </header>
      <main className="p-4 space-y-6">
        <label className="block">
          <span className="text-slate-700 dark:text-slate-300 font-medium">Nome da Loja *</span>
          <input
            className="form-input w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Loja 01 - Centro"
          />
        </label>

        <label className="block">
          <span className="text-slate-700 dark:text-slate-300 font-medium">Responsável (Email da Franquia) *</span>
          <select
            className="form-input w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3"
            value={contactEmail}
            onChange={e => setContactEmail(e.target.value)}
          >
            <option value="">Selecione um usuário...</option>
            {users.filter(u => u.status === 'approved').map(u => (
              <option key={u.id} value={u.email}>{u.full_name} ({u.email})</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">Selecione um usuário já cadastrado na franquia.</p>
        </label>
      </main>
      <footer className="p-4 bg-white dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 sticky bottom-0">
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-primary text-white font-bold py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Salvando...' : (editStore ? 'Atualizar Loja' : 'Criar Loja')}
        </button>
      </footer>
    </div>
  );
};

// 4. Add/Edit Item Screen
const AddItemScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  // Determine storeId: passed from admin nav, or from user profile
  const storeId = location.state?.storeId || profile?.store_id;
  const editItem = location.state?.editItem as InventoryItem | undefined;

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    quantity: '',
    expiryDate: '',
  });
  const [loadingProduct, setLoadingProduct] = useState(false);

  useEffect(() => {
    if (editItem) {
      setFormData({
        code: editItem.product_code,
        description: editItem.product_description || '',
        quantity: editItem.quantity.toString(),
        expiryDate: editItem.expiry_date
      });
    }
  }, [editItem]);

  const handleCodeBlur = async () => {
    if (!formData.code) return;
    setLoadingProduct(true);
    const product = await getProductByCode(formData.code);
    if (product) {
      setFormData(prev => ({ ...prev, description: product.description }));
    }
    setLoadingProduct(false);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.quantity || !formData.expiryDate) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }
    if (!storeId) {
      alert("Erro: Loja não identificada. Entre em contato com o suporte.");
      return;
    }

    try {
      if (editItem) {
        await updateInventoryItem(editItem.id, {
          quantity: parseInt(formData.quantity),
          expiry_date: formData.expiryDate
        });
      } else {
        await addInventoryItem({
          store_id: storeId,
          product_code: formData.code,
          product_description: formData.description,
          quantity: parseInt(formData.quantity),
          expiry_date: formData.expiryDate
        });
      }
      navigate(-1);
    } catch (e) {
      alert("Erro ao salvar item");
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <header className="flex items-center bg-white dark:bg-background-dark p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-slate-800 dark:text-white"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="flex-1 text-center text-lg font-bold text-slate-900 dark:text-white">{editItem ? 'Editar Item' : 'Novo Item'}</h1>
        <div className="w-6"></div>
      </header>
      <main className="p-4 space-y-6">
        <label className="block">
          <span className="text-slate-700 dark:text-slate-300 font-medium">Código do Produto *</span>
          <div className="flex mt-1">
            <input
              type="number"
              className="form-input flex-1 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 disabled:bg-gray-100 dark:disabled:bg-gray-700"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              onBlur={handleCodeBlur}
              placeholder="Digite o código"
              disabled={!!editItem}
            />
            <button disabled={!!editItem} className="bg-primary text-white px-4 rounded-r-lg disabled:opacity-50"><span className="material-symbols-outlined">barcode_scanner</span></button>
          </div>
        </label>

        <label className="block">
          <span className="text-slate-700 dark:text-slate-300 font-medium">Descrição</span>
          <input
            className="form-input w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 disabled:bg-gray-100 dark:disabled:bg-gray-700"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder={loadingProduct ? "Buscando..." : "Descrição do produto"}
            disabled={!!editItem}
          />
        </label>

        <label className="block">
          <span className="text-slate-700 dark:text-slate-300 font-medium">Quantidade *</span>
          <input
            type="number"
            className="form-input w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3"
            value={formData.quantity}
            onChange={e => setFormData({ ...formData, quantity: e.target.value })}
          />
        </label>

        <label className="block">
          <span className="text-slate-700 dark:text-slate-300 font-medium">Data de Validade *</span>
          <input
            type="date"
            className="form-input w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3"
            value={formData.expiryDate}
            onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
          />
        </label>
      </main>
      <footer className="p-4 bg-white dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 sticky bottom-0">
        <button onClick={handleSave} className="w-full bg-primary text-white font-bold py-3 rounded-lg">Salvar Item</button>
      </footer>
    </div>
  );
};

// 5. Store Dashboard
const StoreDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  // Determine context: Admin viewing a store, or Store User viewing their own
  const isAdminView = location.state?.isAdminView || false;

  // Local state for the currently active store
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState(location.state?.storeName || 'Minha Loja');

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>(FilterType.ALL);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [availableStores, setAvailableStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState('');

  // Initialize currentStoreId
  useEffect(() => {
    if (isAdminView) {
      setCurrentStoreId(location.state?.storeId);
    } else if (profile?.store_id) {
      setCurrentStoreId(profile.store_id);
    } else if (profile?.stores && profile.stores.length > 0) {
      // If no default store_id but has linked stores, pick the first one
      setCurrentStoreId(profile.stores[0].id);
    }
  }, [profile, isAdminView, location.state]);

  useEffect(() => {
    if (currentStoreId) {
      loadItems();
      // Fetch store name
      if (isAdminView && location.state?.storeName) {
        // Already have name
      } else {
        let found = false;
        if (!isAdminView && profile?.stores) {
          const s = profile.stores.find(s => s.id === currentStoreId);
          if (s) {
            setStoreName(s.name);
            found = true;
          }
        }

        if (!found) {
          supabase.from('stores').select('name').eq('id', currentStoreId).single()
            .then(({ data }) => {
              if (data) setStoreName(data.name);
            });
        }
      }
    } else {
      setLoading(false);
      if (!isAdminView) {
        // If user has no linked stores, show all available (or maybe none)
        // For now, keep existing behavior but prefer linked stores if any
        if (profile?.stores && profile.stores.length > 0) {
          setAvailableStores(profile.stores);
        } else {
          getStores().then(setAvailableStores);
        }
      }
    }
  }, [currentStoreId, profile]);

  const handleJoinStore = async () => {
    if (!selectedStore || !profile?.id) return;
    try {
      // Update profile's store_id AND add to user_stores
      const { error } = await supabase.from('user_profiles').update({ store_id: selectedStore }).eq('id', profile.id);
      if (error) throw error;

      // Also link in user_stores if not exists
      const { error: linkError } = await supabase.from('user_stores').insert({ user_id: profile.id, store_id: selectedStore });
      if (linkError && linkError.code !== '23505') { // Ignore unique violation
        console.error("Error linking store:", linkError);
      }

      alert("Loja vinculada com sucesso!");
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      alert(`Erro ao vincular loja: ${e.message || JSON.stringify(e)}`);
    }
  };

  const handleSwitchStore = async (newId: string) => {
    setCurrentStoreId(newId);
    if (profile?.id) {
      // Persist selection
      await supabase.from('user_profiles').update({ store_id: newId }).eq('id', profile.id);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      if (currentStoreId) {
        const data = await getStoreInventory(currentStoreId);
        setItems(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteInventoryItem(deleteId);
      setDeleteId(null);
      loadItems();
    }
  };

  const handleEdit = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      navigate('/add', { state: { editItem: item, storeId: currentStoreId } });
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = (item.product_description?.toLowerCase() || '').includes(search.toLowerCase()) || item.product_code.includes(search);
    if (!matchesSearch) return false;

    if (filter === FilterType.TODAY) {
      const today = new Date().toISOString().split('T')[0];
      return item.expiry_date === today;
    }
    if (filter === FilterType.WEEK) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      const pDate = new Date(`${item.expiry_date}T00:00:00`);
      pDate.setHours(0, 0, 0, 0);

      return pDate >= today && pDate <= nextWeek;
    }
    return true;
  });

  if (!currentStoreId && !loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background-light dark:bg-background-dark">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Selecione sua Loja</h2>
          <p className="mb-6 text-slate-600 dark:text-slate-300">Para continuar, você precisa estar vinculado a uma loja.</p>

          <select
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 mb-4 bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
            value={selectedStore}
            onChange={e => setSelectedStore(e.target.value)}
          >
            <option value="">Selecione uma loja...</option>
            {availableStores.map(store => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>

          <button
            onClick={handleJoinStore}
            disabled={!selectedStore}
            className="w-full bg-primary text-white font-bold py-3 rounded-lg disabled:opacity-50 mb-3"
          >
            Entrar na Loja
          </button>

          <button onClick={signOut} className="text-slate-500 hover:underline text-sm">Sair</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-10 bg-background-light dark:bg-background-dark border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center p-4 justify-between">
          {isAdminView ? (
            <button onClick={() => navigate(-1)}><span className="material-symbols-outlined">arrow_back</span></button>
          ) : (
            <span className="material-symbols-outlined">store</span>
          )}

          {/* Store Switcher or Title */}
          {(!isAdminView && profile?.stores && profile.stores.length > 1) ? (
            <div className="flex items-center gap-2">
              <select
                value={currentStoreId || ''}
                onChange={(e) => handleSwitchStore(e.target.value)}
                className="bg-transparent font-bold text-lg border-none focus:ring-0 cursor-pointer text-slate-900 dark:text-white"
              >
                {profile.stores.map(s => (
                  <option key={s.id} value={s.id} className="text-black">{s.name}</option>
                ))}
              </select>
              <span className="material-symbols-outlined text-sm text-slate-500">expand_more</span>
            </div>
          ) : (
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{storeName}</h1>
          )}

          <div className="flex gap-2">
            <span className="material-symbols-outlined text-slate-800 dark:text-slate-200">notifications</span>
            {!isAdminView && (
              <button onClick={signOut} className="text-slate-800 dark:text-slate-200"><span className="material-symbols-outlined">logout</span></button>
            )}
          </div>
        </div>
        <div className="px-4 pb-3">
          <input
            className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-2 pl-4 text-slate-900 dark:text-white"
            placeholder="Buscar produtos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3 px-4 pb-4 overflow-x-auto no-scrollbar">
          <button onClick={() => setFilter(FilterType.TODAY)} className={`px-4 py-1 rounded-full text-sm ${filter === FilterType.TODAY ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-slate-700 dark:text-slate-300'}`}>Hoje</button>
          <button onClick={() => setFilter(FilterType.WEEK)} className={`px-4 py-1 rounded-full text-sm ${filter === FilterType.WEEK ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-slate-700 dark:text-slate-300'}`}>7 Dias</button>
          <button onClick={() => setFilter(FilterType.ALL)} className={`px-4 py-1 rounded-full text-sm ${filter === FilterType.ALL ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-slate-700 dark:text-slate-300'}`}>Todos</button>
        </div>
      </header>
      <main className="flex-1 p-4 pb-24 space-y-3">
        {loading ? <p className="text-center mt-10">Carregando estoque...</p> :
          filteredItems.length === 0 ? <p className="text-center mt-10 text-gray-500">Nenhum item encontrado.</p> :
            filteredItems.map(item => (
              <ProductCard
                key={item.id}
                product={item}
                onDelete={setDeleteId}
                onEdit={handleEdit}
              />
            ))
        }
      </main>
      <button
        onClick={() => navigate('/add', { state: { storeId: currentStoreId } })}
        className="fixed bottom-6 right-6 h-14 w-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

// Main App
const AppContent = () => {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background-light dark:bg-background-dark p-8 text-center">
        <div className="mb-6 rounded-full bg-red-100 p-6 dark:bg-red-900/30">
          <span className="material-symbols-outlined text-6xl text-red-500">error</span>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Configuração Necessária</h1>
        <p className="mb-8 max-w-md text-slate-600 dark:text-slate-300">
          O aplicativo precisa ser conectado ao Supabase para funcionar.
        </p>
        <div className="w-full max-w-lg rounded-lg bg-white p-6 text-left shadow-sm dark:bg-slate-800">
          <p className="mb-4 font-medium text-slate-900 dark:text-white">Siga os passos:</p>
          <ol className="list-decimal space-y-3 pl-5 text-sm text-slate-600 dark:text-slate-300">
            <li>Crie um projeto no <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">Supabase</a>.</li>
            <li>Crie um arquivo <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-700">.env</code> na raiz do projeto.</li>
            <li>Adicione suas credenciais:
              <pre className="mt-2 overflow-x-auto rounded bg-slate-100 p-3 dark:bg-slate-900">
                VITE_SUPABASE_URL=sua_url
                VITE_SUPABASE_ANON_KEY=sua_chave_anon
              </pre>
            </li>
            <li>Reinicie o aplicativo.</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/reset-password" element={<ResetPasswordScreen />} />
      <Route path="/update-password" element={<UpdatePasswordScreen />} />

      <Route path="/dashboard-general" element={
        <ProtectedRoute requiredRole="admin">
          <GeneralDashboard />
        </ProtectedRoute>
      } />

      <Route path="/dashboard-franchise" element={
        <ProtectedRoute>
          <FranchiseDashboard />
        </ProtectedRoute>
      } />

      <Route path="/add-franchise" element={
        <ProtectedRoute requiredRole="admin">
          <AddFranchiseScreen />
        </ProtectedRoute>
      } />

      <Route path="/dashboard-store" element={
        <ProtectedRoute>
          <StoreDashboard />
        </ProtectedRoute>
      } />

      <Route path="/add" element={
        <ProtectedRoute>
          <AddItemScreen />
        </ProtectedRoute>
      } />

      <Route path="/add-store" element={
        <ProtectedRoute>
          <AddStoreScreen />
        </ProtectedRoute>
      } />

      <Route path="/manage-users" element={
        <ProtectedRoute>
          <ManageUsersScreen />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
