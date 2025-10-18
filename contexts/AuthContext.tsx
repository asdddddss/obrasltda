
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { User, Role } from '../types';
import { login as apiLogin, getMockUsers } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (name: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      return null;
    }
  });

  const login = useCallback(async (name: string, pass: string): Promise<boolean> => {
    try {
      const loggedInUser = await apiLogin(name, pass);
      if (loggedInUser) {
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
