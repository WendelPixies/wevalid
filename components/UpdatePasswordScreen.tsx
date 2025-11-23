import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export const UpdatePasswordScreen = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.updateUser({ password: password });
            if (error) throw error;

            alert('Senha atualizada com sucesso!');
            navigate('/');
        } catch (error: any) {
            setError(error.message || 'Erro ao atualizar senha.');
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
                <h1 className="text-[#111418] dark:text-white tracking-tight text-[28px] font-bold leading-tight text-center pb-4">
                    Nova Senha
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
                    Digite sua nova senha abaixo.
                </p>

                <form onSubmit={handleUpdatePassword} className="w-full space-y-4">
                    <label className="block">
                        <input
                            type="password"
                            placeholder="Nova senha"
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111418] dark:text-white focus:outline-0 focus:ring-0 border border-[#dce0e5] dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-[#dce0e5] h-14 placeholder:text-[#637588] p-4 text-base font-normal leading-normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>
                    <label className="block">
                        <input
                            type="password"
                            placeholder="Confirme a nova senha"
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111418] dark:text-white focus:outline-0 focus:ring-0 border border-[#dce0e5] dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-[#dce0e5] h-14 placeholder:text-[#637588] p-4 text-base font-normal leading-normal"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </label>

                    {error && (
                        <div className="p-3 rounded-lg text-sm text-center bg-red-100 text-red-700">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Atualizando...' : 'Atualizar Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
};
