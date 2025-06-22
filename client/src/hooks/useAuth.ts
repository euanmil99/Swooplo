import { useState, useEffect, createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
  timezone: string;
  subscriptionTier: 'basic' | 'pro' | 'enterprise';
  subscriptionStatus: 'active' | 'inactive' | 'cancelled';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Check if user is authenticated on mount
  const { data: userData, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then(res => res.data.user),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (!isLoading) {
      setUser(userData || null);
      setLoading(false);
    }
  }, [userData, isLoading]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.post('/auth/login', { email, password }),
    onSuccess: (response) => {
      const { user: userData, token } = response.data;
      setUser(userData);
      localStorage.setItem('token', token);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) =>
      api.post('/auth/register', data),
    onSuccess: (response) => {
      const { user: userData, token } = response.data;
      setUser(userData);
      localStorage.setItem('token', token);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      setUser(null);
      localStorage.removeItem('token');
      queryClient.clear();
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<User>) =>
      api.put('/auth/profile', data),
    onSuccess: (response) => {
      const { user: userData } = response.data;
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (data: RegisterData) => {
    await registerMutation.mutateAsync(data);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const updateProfile = async (data: Partial<User>) => {
    await updateProfileMutation.mutateAsync(data);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 