import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            let { data, error } = await supabase
                .from('user_profiles')
                .select(`
                    *,
                    user_stores (
                        stores (
                            id,
                            name
                        )
                    )
                `)
                .eq('id', userId)
                .single();

            if (error && error.code === 'PGRST116') {
                // Profile not found (PGRST116 is the specific code for no rows returned by .single())
                // Attempt to create a default profile
                console.log("Profile not found, creating default...");
                const { data: newProfile, error: createError } = await supabase
                    .from('user_profiles')
                    .insert([{ id: userId, email: user?.email, role: 'store_user' }])
                    .select()
                    .single();

                if (createError) {
                    console.error("Error creating default profile:", createError);
                    // Fallback in memory if DB insert fails (e.g. RLS)
                    data = { id: userId, email: user?.email || '', role: 'store_user' };
                } else {
                    data = newProfile;
                }
            } else if (error) {
                console.error('Error fetching profile:', error);
            }

            // If data is still null (e.g. other error), provide a safe fallback so the app doesn't hang
            if (!data) {
                data = { id: userId, email: user?.email || '', role: 'store_user' };
            } else {
                // Transform nested stores
                const stores = data.user_stores?.map((us: any) => us.stores) || [];
                data = { ...data, stores };
            }

            setProfile(data);
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
            // Fallback
            setProfile({ id: userId, email: user?.email || '', role: 'store_user' });
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
