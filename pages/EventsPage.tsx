import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getEvents, getAllVisibleAlbums, getMockUsers } from '../services/api';
import { EventItem, Role, Album, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import EventEditorModal from '../components/EventEditorModal';
import SelectionModal from '../components/SelectionModal';
import { PlusIcon, FunnelIcon, ChevronDownIcon, ChevronUpIcon } from '../components/icons/Icons';

type TimelineItem = (EventItem & { itemType: 'event'; date: string }) | (Album & { itemType: 'album'; date: string });

const EventsPage: React.FC = () => {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [allAlbums, setAllAlbums] = useState<Album[]>([]); // All albums for filtering logic
    const [users, setUsers] = useState<User[]>([]); // Users for filtering
    const [showAllAlbums, setShowAllAlbums] = useState(false);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

    // Filter state
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
    const [isPeopleModalOpen, setIsPeopleModalOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const [eventData, albumData, userData] = await Promise.all([
            getEvents(),
            getAllVisibleAlbums(user),
            getMockUsers()
        ]);
        setEvents(eventData);
        setAllAlbums(albumData);
        setUsers(userData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const timelineItems = useMemo((): TimelineItem[] => {
        let filteredEvents = events;
        let displayableAlbums = allAlbums.filter(a => !a.isEventAlbum);

        if (selectedPeople.length > 0) {
            const peopleSet = new Set(selectedPeople);
            
            const relevantAlbumIds = new Set(
                allAlbums
                    .filter(album => album.taggedUsers.some(taggedUserId => peopleSet.has(taggedUserId)))
                    .map(a => a.id)
            );

            filteredEvents = events.filter(e => relevantAlbumIds.has(e.albumId));
            displayableAlbums = displayableAlbums.filter(a => relevantAlbumIds.has(a.id));
        }

        const eventItems: TimelineItem[] = filteredEvents.map(e => ({ ...e, itemType: 'event' }));
        if (showAllAlbums) {
            const albumItems: TimelineItem[] = displayableAlbums.map(a => ({ ...a, itemType: 'album', date: a.createdAt }));
            return [...eventItems, ...albumItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return eventItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [events, allAlbums, showAllAlbums, selectedPeople]);

    const itemsByYear = useMemo(() => {
        return timelineItems.reduce((acc, item) => {
            const year = new Date(item.date).getFullYear();
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(item);
            return acc;
        }, {} as Record<number, TimelineItem[]>);
    }, [timelineItems]);
    
    const formatEventDate = (isoDate: string) => {
        const date = new Date(isoDate);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        return { day, month };
    };

    const handleCreateClick = () => {
        setEditingEvent(null);
        setIsEditorOpen(true);
    };

    const handleEditClick = (event: EventItem) => {
        setEditingEvent(event);
        setIsEditorOpen(true);
    }
    
    const handleEditorClose = () => {
        setIsEditorOpen(false);
        setEditingEvent(null);
    }
    
    const handleSaveComplete = () => {
        handleEditorClose();
        fetchData(); // Refresh data
    }

    const isAdmin = user?.role === Role.ADMIN || user?.role === Role.ADMIN_MASTER;

    if (loading) {
        return <p className="text-center py-10">Carregando...</p>;
    }

    return (
        <div className="py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold">Eventos e Álbuns</h1>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                        <FunnelIcon className="h-4 w-4" />
                        <span>Filtros</span>
                        {isFilterOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                    </button>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={showAllAlbums} onChange={() => setShowAllAlbums(!showAllAlbums)} className="h-4 w-4 rounded text-brand-600 border-gray-300 focus:ring-brand-500" />
                        <span className="text-sm font-medium">Exibir álbuns</span>
                    </label>
                    {isAdmin && (
                        <button 
                            onClick={handleCreateClick}
                            className="flex items-center space-x-2 bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-4 rounded-lg"
                        >
                            <PlusIcon className="h-5 w-5" />
                            <span>Novo Evento</span>
                        </button>
                    )}
                </div>
            </div>
            
             {isFilterOpen && (
                <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md mb-6">
                    <button 
                        onClick={() => setIsPeopleModalOpen(true)}
                        className="w-full text-left p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        <span className="font-semibold">Pessoas</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                            {selectedPeople.length > 0 ? `${selectedPeople.length} selecionada(s)` : 'Todas'}
                        </span>
                    </button>
                    {selectedPeople.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-right">
                            <button
                                onClick={() => setSelectedPeople([])}
                                className="text-sm text-brand-500 hover:underline"
                            >
                                Limpar Filtro
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-10">
                {Object.keys(itemsByYear).sort((a,b) => Number(b) - Number(a)).map(year => (
                    <div key={year}>
                        <h2 className="text-2xl font-bold mb-4">{year}</h2>
                        <div className="space-y-4">
                            {itemsByYear[Number(year)].map(item => {
                                const { day, month } = formatEventDate(item.date);
                                if(item.itemType === 'event') {
                                    return (
                                        <div key={item.id} className="group flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg border-l-4 border-brand-500">
                                            <Link to={`/album/${item.albumId}`} className="flex-grow">
                                                <div className="flex items-center space-x-4">
                                                    <div className="text-center w-16 flex-shrink-0">
                                                        <p className="font-bold text-xl text-brand-600 dark:text-brand-400">{day}</p>
                                                        <p className="text-sm uppercase font-semibold text-gray-500">{month}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-brand-500 transition">{item.title}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.location}</p>
                                                    </div>
                                                </div>
                                            </Link>
                                            {isAdmin && (
                                                <button onClick={() => handleEditClick(item)} className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 ml-4 opacity-0 group-hover:opacity-100 transition">
                                                    Editar
                                                </button>
                                            )}
                                        </div>
                                    )
                                } else { // Album
                                    return (
                                         <Link to={`/album/${item.id}`} key={item.id} className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition">
                                            <div className="flex items-center space-x-4">
                                                <div className="text-center w-16 flex-shrink-0">
                                                    <p className="font-bold text-lg text-gray-600 dark:text-gray-400">{day}</p>
                                                    <p className="text-sm uppercase text-gray-500">{month}</p>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-brand-500 transition">{item.title}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{item.description}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                }
                            })}
                        </div>
                    </div>
                ))}
            </div>
            {isEditorOpen && user && (
                <EventEditorModal 
                    event={editingEvent}
                    currentUser={user}
                    onClose={handleEditorClose}
                    onSaveComplete={handleSaveComplete}
                />
            )}
            <SelectionModal
                isOpen={isPeopleModalOpen}
                onClose={() => setIsPeopleModalOpen(false)}
                title="Filtrar por Pessoas"
                items={users.filter(u => u.status === 'APPROVED').map(u => ({ id: u.id, name: u.name, avatar: u.avatar }))}
                selectedIds={selectedPeople}
                onApply={setSelectedPeople}
            />
        </div>
    );
};

export default EventsPage;