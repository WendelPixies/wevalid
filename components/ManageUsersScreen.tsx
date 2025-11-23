import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFranchiseUsers, updateUserStatus, getFranchiseStores, updateUserProfile } from '../services/productService';
import { UserProfile, Store } from '../types';

export const ManageUsersScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile } = useAuth();

    const franchiseId = location.state?.franchiseId || profile?.franchise_id;

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        if (franchiseId) {
            loadData();
        }
    }, [franchiseId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, storesData] = await Promise.all([
                getFranchiseUsers(franchiseId),
                getFranchiseStores(franchiseId)
            ]);
            setUsers(usersData);
            setStores(storesData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveUser = async (userId: string) => {
        if (!window.confirm("Tem certeza que deseja remover o acesso deste usuário?")) return;
        try {
            await updateUserStatus(userId, 'rejected');
            alert("Acesso removido com sucesso.");
            loadData();
        } catch (e) {
            alert("Erro ao remover usuário.");
        }
    };

    const handlePromoteToManager = async (userId: string) => {
        if (!window.confirm("Tem certeza que deseja promover este usuário a Gestor? Ele terá acesso total à franquia.")) return;
        try {
            // Pass null (or empty string if DB requires, but usually null) for store_id to clear it
            // updateUserStatus signature: (userId, status, role, storeId)
            // We need to cast null to string if strict, or update service to accept null.
            // Let's update service to accept null or handle it.
            // Actually, in updateUserStatus: if (storeId !== undefined) updateData.store_id = storeId;
            // So if we pass null, it should update to null.
            await updateUserStatus(userId, 'approved', 'manager', null as any);
            alert("Usuário promovido a Gestor!");
            loadData();
        } catch (e) {
            alert("Erro ao promover usuário.");
        }
    };

    const handleDemoteToStoreUser = async (userId: string) => {
        if (!window.confirm("Tem certeza que deseja remover as permissões de Gestor deste usuário?")) return;
        try {
            await updateUserStatus(userId, 'approved', 'store_user');
            alert("Usuário agora é um operador de loja.");
            loadData();
        } catch (e) {
            alert("Erro ao alterar permissão.");
        }
    };

    const handleAssignStore = async (userId: string, storeId: string) => {
        try {
            await updateUserStatus(userId, 'approved', 'store_user', storeId);
            alert("Loja vinculada com sucesso!");
            loadData();
        } catch (e) {
            alert("Erro ao vincular loja.");
        }
    };

    const handleEditUser = (user: UserProfile) => {
        setEditingUser(user);
        setEditName(user.full_name || '');
    };

    const handleUpdateUser = async () => {
        if (!editingUser || !editName.trim()) return;
        try {
            await updateUserProfile(editingUser.id, { full_name: editName });
            alert("Usuário atualizado com sucesso!");
            setEditingUser(null);
            loadData();
        } catch (e) {
            alert("Erro ao atualizar usuário.");
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
            <header className="flex items-center bg-white dark:bg-background-dark p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="text-slate-800 dark:text-white"><span className="material-symbols-outlined">arrow_back</span></button>
                <h1 className="flex-1 text-center text-lg font-bold text-slate-900 dark:text-white">Gerenciar Equipe</h1>
                <div className="w-6"></div>
            </header>
            <main className="p-4 space-y-4">
                {loading ? <p className="text-center mt-10">Carregando equipe...</p> :
                    users.length === 0 ? <p className="text-center mt-10 text-gray-500">Nenhum usuário ativo encontrado.</p> :
                        users.map(user => (
                            <div key={user.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">{user.full_name || 'Sem nome'}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">{user.email}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-red-100 text-red-700' :
                                        user.role === 'manager' ? 'bg-purple-100 text-purple-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {user.role === 'admin' ? 'Administrador' :
                                            user.role === 'manager' ? 'Gestor' : 'Operador'}
                                    </span>
                                    <button onClick={() => handleEditUser(user)} className="ml-2 text-slate-400 hover:text-primary">
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                </div>

                                {/* Store Assignment Section */}
                                {user.role === 'store_user' ? (
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Loja Vinculada</label>
                                        <select
                                            className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                            value={user.store_id || ''}
                                            onChange={(e) => handleAssignStore(user.id, e.target.value)}
                                        >
                                            <option value="">Selecione uma loja...</option>
                                            {stores.map(store => (
                                                <option key={store.id} value={store.id}>{store.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="mb-4">
                                        <p className="text-sm font-bold text-purple-700 bg-purple-50 p-2 rounded border border-purple-100 text-center">
                                            Gestor da Franquia (Acesso Total)
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                                    {user.role !== 'admin' && (
                                        <>
                                            {user.role !== 'manager' ? (
                                                profile?.role === 'admin' && (
                                                    <button
                                                        onClick={() => handlePromoteToManager(user.id)}
                                                        className="flex-1 bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-purple-100 transition-colors"
                                                    >
                                                        Promover a Gestor
                                                    </button>
                                                )
                                            ) : (
                                                profile?.role === 'admin' && (
                                                    <button
                                                        onClick={() => handleDemoteToStoreUser(user.id)}
                                                        className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors"
                                                    >
                                                        Tornar Operador
                                                    </button>
                                                )
                                            )}

                                            <button
                                                onClick={() => handleRemoveUser(user.id)}
                                                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
                                            >
                                                Remover Acesso
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
            </main>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Editar Usuário</h3>
                        <label className="block mb-4">
                            <span className="text-slate-700 dark:text-slate-300 font-medium">Nome Completo</span>
                            <input
                                className="form-input w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                            />
                        </label>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdateUser}
                                className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
