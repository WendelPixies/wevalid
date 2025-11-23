import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFranchiseStores, getPendingUsers, updateUserStatus } from '../services/productService';
import { supabase } from '../services/supabaseClient';
import { Store, UserProfile } from '../types';

export const FranchiseDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile, signOut } = useAuth();

    // Determine context: Admin viewing a franchise, or Manager viewing their own
    const isAdminView = location.state?.isAdminView || false;
    const franchiseId = isAdminView ? location.state?.franchiseId : profile?.franchise_id;
    const franchiseName = location.state?.franchiseName || 'Minha Franquia';

    const [stores, setStores] = useState<Store[]>([]);
    const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();

        // Real-time subscription for user_profiles
        const channel = supabase
            .channel('public:user_profiles')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles', filter: `franchise_id=eq.${franchiseId}` }, (payload) => {
                console.log('Change received!', payload);
                loadData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [franchiseId]);

    const loadData = async () => {
        // Don't set loading to true here to avoid flickering on real-time updates
        // Only set it if it's the first load (stores is empty)
        if (stores.length === 0) setLoading(true);

        try {
            if (franchiseId) {
                const [storesData, usersData] = await Promise.all([
                    getFranchiseStores(franchiseId),
                    getPendingUsers(franchiseId)
                ]);
                setStores(storesData);
                setPendingUsers(usersData);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: string) => {
        try {
            await updateUserStatus(userId, 'approved', 'store_user');
            alert("Usuário aprovado! Lembre-se de vinculá-lo a uma loja na tela 'Gerenciar Usuários'.");
            loadData();
        } catch (e) {
            alert("Erro ao aprovar usuário.");
        }
    };

    const handleReject = async (userId: string) => {
        if (!window.confirm("Tem certeza que deseja rejeitar este usuário?")) return;
        try {
            await updateUserStatus(userId, 'rejected');
            alert("Usuário rejeitado.");
            loadData();
        } catch (e) {
            alert("Erro ao rejeitar usuário.");
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
            <header className="flex items-center bg-white dark:bg-background-dark p-4 justify-between sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                {isAdminView ? (
                    <button onClick={() => navigate(-1)}><span className="material-symbols-outlined">arrow_back</span></button>
                ) : (
                    <span className="material-symbols-outlined text-xl text-slate-800 dark:text-slate-200">domain</span>
                )}
                <div className="flex items-center gap-2">
                    <h1 className="text-slate-900 dark:text-white text-base font-bold">{franchiseName}</h1>
                    {pendingUsers.length > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                            {pendingUsers.length}
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    {!isAdminView && (
                        <button onClick={signOut} className="text-slate-800 dark:text-slate-200">
                            <span className="material-symbols-outlined text-xl">logout</span>
                        </button>
                    )}
                </div>
            </header>
            <main className="flex-1 p-4 pb-20 space-y-4">

                {/* Pending Approvals Section */}
                {pendingUsers.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                        <h2 className="text-amber-800 dark:text-amber-200 text-sm font-bold mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">person_add</span>
                            Solicitações de Acesso ({pendingUsers.length})
                        </h2>
                        <div className="space-y-2">
                            {pendingUsers.map(user => (
                                <div key={user.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{user.full_name || 'Sem nome'}</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">{user.email}</p>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => handleReject(user.id)}
                                            className="flex-1 sm:flex-none px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 text-xs"
                                        >
                                            Rejeitar
                                        </button>
                                        <button
                                            onClick={() => handleApprove(user.id)}
                                            className="flex-1 sm:flex-none px-3 py-1.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 text-xs"
                                        >
                                            Aprovar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Active Users Section */}
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-slate-900 dark:text-white text-sm font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">group</span>
                            Equipe da Franquia
                        </h2>
                    </div>
                    <button
                        onClick={() => navigate('/manage-users', { state: { franchiseId } })}
                        className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <span className="material-symbols-outlined text-lg">manage_accounts</span>
                        Gerenciar Usuários da Franquia
                    </button>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-slate-900 dark:text-white text-sm font-bold">Lojas da Franquia</h2>
                        <button
                            onClick={() => navigate('/add-store', { state: { franchiseId } })}
                            className="flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/90"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Nova Loja
                        </button>
                    </div>
                    <div className="flex flex-col gap-2">
                        {loading ? <p className="text-sm">Carregando...</p> : stores.length === 0 ? <p className="text-gray-500 text-sm">Nenhuma loja cadastrada.</p> : stores.map(store => (
                            <div
                                key={store.id}
                                className="flex gap-3 bg-white dark:bg-slate-800 p-3 justify-between items-center rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                <div
                                    className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                                    onClick={() => navigate('/dashboard-store', { state: { storeId: store.id, storeName: store.name, isAdminView: true } })}
                                >
                                    {/* Icon removed as requested */}
                                    <div className="min-w-0">
                                        <p className="text-slate-900 dark:text-white font-medium text-sm truncate">{store.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate('/add-store', { state: { franchiseId, editStore: store } });
                                        }}
                                        className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-full"
                                        title="Editar Loja"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`Tem certeza que deseja excluir a loja "${store.name}"?`)) {
                                                try {
                                                    const { deleteStore } = await import('../services/productService');
                                                    await deleteStore(store.id);
                                                    loadData();
                                                } catch (err) {
                                                    alert("Erro ao excluir loja.");
                                                }
                                            }
                                        }}
                                        className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full"
                                        title="Excluir Loja"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                    <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};
