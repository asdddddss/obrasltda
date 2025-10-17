import React, { useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types';
import { getMockUsers, updateUser, deleteUser } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { CheckBadgeIcon, UserGroupIcon, UserIcon, TrashIcon } from '../components/icons/Icons';
import UserEditorModal from '../components/UserEditorModal';

type AdminTab = 'users' | 'approvals' | 'content';

const AdminPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<AdminTab>('users');
    const { user: currentUser } = useAuth();
    
    // Editor Modal State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const allUsers = await getMockUsers();
        setUsers(allUsers.sort((a,b) => a.name.localeCompare(b.name)));
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleApproval = async (userToUpdate: User, newStatus: 'APPROVED' | 'REJECTED') => {
        if (!currentUser || (currentUser.role !== Role.ADMIN_MASTER && currentUser.role !== Role.ADMIN)) {
            alert("Você não tem permissão para realizar esta ação.");
            return;
        }
        if (newStatus === 'APPROVED') {
            await updateUser(userToUpdate.id, { status: 'APPROVED' });
        } else { // REJECTED
            await deleteUser(userToUpdate.id);
        }
        fetchUsers(); // Refresh the list
    };

    const handleRoleChange = async (userToUpdate: User, newRole: Role) => {
         if (!currentUser || currentUser.role !== Role.ADMIN_MASTER) {
            alert("Você não tem permissão para realizar esta ação.");
            return;
        }
         if (userToUpdate.id === currentUser.id && newRole !== Role.ADMIN_MASTER) {
            alert("Você não pode rebaixar sua própria conta.");
            return;
        }
        await updateUser(userToUpdate.id, { role: newRole });
        fetchUsers();
    };

    const openEditor = (user: User) => {
        setEditingUser(user);
        setIsEditorOpen(true);
    };
    
    const closeEditor = () => {
        setEditingUser(null);
        setIsEditorOpen(false);
    };

    const handleSaveComplete = () => {
        closeEditor();
        fetchUsers();
    };

    const pendingUsers = users.filter(u => u.status === 'PENDING');
    const approvedUsers = users.filter(u => u.status === 'APPROVED');
    
    const roleColors: { [key in Role]: string } = {
        [Role.ADMIN_MASTER]: "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200",
        [Role.ADMIN]: "bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        [Role.MEMBER]: "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        [Role.READER]: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    };
    
    return (
        <div className="py-8">
            <h1 className="text-3xl font-bold mb-8">Painel Administrativo</h1>
            
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setActiveTab('users')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-200 dark:hover:border-gray-600'}`}>
                        Gerenciar Usuários
                    </button>
                    <button onClick={() => setActiveTab('approvals')} className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'approvals' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-200 dark:hover:border-gray-600'}`}>
                        Aprovações {pendingUsers.length > 0 && <span className="ml-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">{pendingUsers.length}</span>}
                    </button>
                    {/* Add other tabs like 'content' here */}
                </nav>
            </div>

            {loading ? <p>Carregando...</p> : (
                <>
                    {activeTab === 'users' && (
                        <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usuário</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cargo</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aniversário</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Editar</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                    {approvedUsers.map(user => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="flex-shrink-0 h-10 w-10"><img className="h-10 w-10 rounded-full" src={user.avatar} alt="" /></div><div className="ml-4"><div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div><div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div></div></div></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[user.role]}`}>{user.role}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.birthdate ? new Date(user.birthdate).toLocaleDateString() : 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button onClick={() => openEditor(user)} className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-200">Editar</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {activeTab === 'approvals' && (
                        <div>
                            {pendingUsers.length > 0 ? (
                                <div className="space-y-3">
                                    {pendingUsers.map(user => (
                                        <div key={user.id} className="bg-white dark:bg-gray-900 shadow rounded-lg p-4 flex items-center justify-between">
                                            <div className="flex items-center space-x-4"><img className="h-10 w-10 rounded-full" src={user.avatar} alt={user.name} /><p className="font-medium">{user.name}</p></div>
                                            <div className="space-x-3"><button onClick={() => handleApproval(user, 'REJECTED')} className="px-3 py-1 text-sm font-semibold text-red-700 bg-red-100 rounded-md hover:bg-red-200">Rejeitar</button><button onClick={() => handleApproval(user, 'APPROVED')} className="px-3 py-1 text-sm font-semibold text-green-700 bg-green-100 rounded-md hover:bg-green-200">Aprovar</button></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (<p className="text-center text-gray-500 dark:text-gray-400 py-10">Nenhuma conta pendente de aprovação.</p>)}
                        </div>
                    )}
                </>
            )}
            
            {isEditorOpen && editingUser && currentUser && (
                <UserEditorModal
                    user={editingUser}
                    currentUser={currentUser}
                    onClose={closeEditor}
                    onSaveComplete={handleSaveComplete}
                />
            )}
        </div>
    );
};

export default AdminPage;