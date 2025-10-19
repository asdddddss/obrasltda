
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboardIcon, CalendarDaysIcon, CakeIcon, UserIcon, PlusCircleIcon } from './icons/Icons';

interface BottomNavBarProps {
  onAddClick: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ onAddClick }) => {
  const { user } = useAuth();

  const commonClasses = "flex flex-col items-center justify-center flex-1 py-2 text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors";
  const activeClasses = "text-brand-500 dark:text-brand-400";

  // Um componente genérico de item de navegação que lida com rotas públicas/privadas
  const NavItem: React.FC<{ to: string; icon: React.FC<any>; isPublic?: boolean; }> = ({ to, icon: Icon, isPublic = true }) => {
    if (!isPublic && !user) {
      // Para rotas protegidas quando deslogado, link para login
      return (
        <Link to="/login" className={commonClasses}>
          <Icon className="h-7 w-7" />
        </Link>
      );
    }
    return (
      <NavLink to={to} className={({ isActive }) => `${commonClasses} ${isActive ? activeClasses : ''}`}>
        <Icon className="h-7 w-7" />
      </NavLink>
    );
  };

  const ProfileNavItem = () => {
    if (user) {
      return (
        <NavLink to={`/profile/${user.id}`} className={({ isActive }) => `${commonClasses} ${isActive ? activeClasses : ''}`}>
          <img src={user.avatar} alt="Perfil" className="h-7 w-7 rounded-full object-cover" />
        </NavLink>
      );
    }
    return (
      <Link to="/login" className={commonClasses}>
        <UserIcon className="h-7 w-7" />
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-around z-50 lg:hidden shadow-[0_-2px_5px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_5px_rgba(0,0,0,0.2)] pb-[env(safe-area-inset-bottom)]">
      <NavItem to="/" icon={LayoutDashboardIcon} />
      <NavItem to="/events" icon={CalendarDaysIcon} />
      
      {user ? (
        <button 
          onClick={onAddClick} 
          className="flex flex-col items-center justify-center flex-1 py-2 text-brand-500 hover:text-brand-600 transition-colors"
          aria-label="Adicionar mídia"
        >
          <PlusCircleIcon className="h-8 w-8" />
        </button>
      ) : (
        // Um espaço reservado para manter o layout de 5 itens consistente
        <span className="flex-1"></span>
      )}
      
      <NavItem to="/birthdays" icon={CakeIcon} isPublic={false} />
      <ProfileNavItem />
    </nav>
  );
};

export default BottomNavBar;