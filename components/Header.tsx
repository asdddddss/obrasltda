import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { UserIcon, SunIcon, MoonIcon, CogIcon, ArrowLeftOnRectangleIcon } from './icons/Icons';
import { Role } from '../types';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-30 lg:left-64">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Hidden on large screens because it's in the sidebar */}
          <Link to="/" className="text-2xl font-bold text-gray-900 dark:text-white lg:hidden">
            OBRAS LTDA
          </Link>
          <div className="flex-1"></div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
             <button onClick={toggleTheme} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
             </button>
             
             {user ? (
                // Profile Dropdown for authenticated user
                <div className="relative" ref={profileDropdownRef}>
                    <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
                        <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-brand-500" />
                    </button>

                    {profileDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                            <Link to={`/profile/${user.id}`} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                               <UserIcon className="h-5 w-5 mr-2" /> Perfil
                            </Link>
                            {user.role === Role.ADMIN_MASTER && (
                              <Link to="/admin" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                 <CogIcon className="h-5 w-5 mr-2" /> Admin
                              </Link>
                            )}
                            <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" /> Sair
                            </button>
                        </div>
                    )}
                </div>
             ) : (
                // Login button for guest user
                <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-semibold bg-brand-500 text-white rounded-lg hover:bg-brand-600">
                    Entrar
                </button>
             )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;