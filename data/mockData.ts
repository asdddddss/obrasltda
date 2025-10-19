import { User, Role, MediaItem, Album, Story, EventItem, MusicTrack } from '../types';

// Helper to get a random item from an array
const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubset = <T,>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(arr.length, count));
};

export const users: User[] = [
  { id: 'user-1', name: 'admin', email: 'master@obras.com', avatar: 'https://i.pravatar.cc/150?u=user-1', role: Role.ADMIN_MASTER, birthdate: '1990-01-15T00:00:00Z', status: 'APPROVED' },
  { id: 'user-2', name: 'Admin', email: 'admin@obras.com', avatar: 'https://i.pravatar.cc/150?u=user-2', role: Role.ADMIN, birthdate: '1992-05-20T00:00:00Z', status: 'APPROVED' },
  { id: 'user-3', name: 'Maria Silva', email: 'maria@obras.com', avatar: 'https://i.pravatar.cc/150?u=user-3', role: Role.MEMBER, birthdate: '1995-11-10T00:00:00Z', status: 'APPROVED' },
  { id: 'user-4', name: 'João Souza', email: 'joao@obras.com', avatar: 'https://i.pravatar.cc/150?u=user-4', role: Role.MEMBER, birthdate: '1988-03-25T00:00:00Z', status: 'APPROVED' },
  { id: 'user-5', name: 'Ana Pereira', email: 'ana@obras.com', avatar: 'https://i.pravatar.cc/150?u=user-5', role: Role.READER, birthdate: '2000-07-30T00:00:00Z', status: 'APPROVED' },
  { id: 'user-6', name: 'Carlos Ferreira', email: 'carlos@obras.com', avatar: 'https://i.pravatar.cc/150?u=user-6', role: Role.MEMBER, birthdate: '1998-09-05T00:00:00Z', status: 'APPROVED' },
  { id: 'user-7', name: 'Juliana Lima', email: 'juliana@obras.com', avatar: 'https://i.pravatar.cc/150?u=user-7', role: Role.MEMBER, status: 'APPROVED' },
  { id: 'user-8', name: 'Pendente', email: 'pending@obras.com', avatar: 'https://i.pravatar.cc/150?u=user-8', role: Role.READER, status: 'PENDING' },
];

const approvedUsers = users.filter(u => u.status === 'APPROVED');

export let albums: Album[] = [
    { 
        id: 'album-1', 
        title: 'Férias de Verão 2023',
        description: 'Nossa viagem incrível para a praia. Sol, mar e muita diversão!',
        coverPhoto: 'https://picsum.photos/seed/album1-1/400/400',
        createdBy: 'user-3',
        createdAt: '2023-08-15T10:00:00Z',
        permission: Role.MEMBER,
        visibleTo: [],
        taggedUsers: ['user-3', 'user-4'],
        photos: [], // Will be populated by mediaItems
    },
    { 
        id: 'album-2', 
        title: 'Festa Junina da Firma',
        description: 'O arraiá foi bão demais! Teve quadrilha, quentão e muita risada.',
        coverPhoto: 'https://picsum.photos/seed/album2-1/400/400',
        createdBy: 'user-2',
        isEventAlbum: true,
        createdAt: '2023-06-25T18:30:00Z',
        permission: Role.MEMBER,
        visibleTo: [],
        taggedUsers: ['user-2', 'user-3', 'user-4', 'user-6', 'user-7'],
        photos: [],
    },
     { 
        id: 'album-3', 
        title: 'Retiro de Planejamento',
        description: 'Fotos do nosso retiro estratégico. Muitas ideias e colaboração.',
        coverPhoto: 'https://picsum.photos/seed/album3-1/400/400',
        createdBy: 'user-1',
        createdAt: '2023-02-10T14:00:00Z',
        permission: Role.ADMIN,
        visibleTo: [],
        taggedUsers: ['user-1', 'user-2'],
        photos: [],
    },
];

export let mediaItems: MediaItem[] = [
    // Album 1 Photos
    ...Array.from({ length: 8 }, (_, i) => ({
        id: `media-a1-${i+1}`,
        albumId: 'album-1',
        url: `https://picsum.photos/seed/album1-${i+1}/800/600`,
        type: 'image' as 'image' | 'video',
        description: `Curtindo o dia na praia! #${i+1}`,
        uploadedBy: getRandom(['user-3', 'user-4']),
        createdAt: `2023-08-${10+i}T1${i}:00:00Z`,
        taggedUsers: getRandomSubset(approvedUsers, 2).map(u => u.id),
    })),
    // Album 2 Photos
    ...Array.from({ length: 12 }, (_, i) => ({
        id: `media-a2-${i+1}`,
        albumId: 'album-2',
        url: `https://picsum.photos/seed/album2-${i+1}/800/600`,
        type: 'image' as 'image' | 'video',
        description: `Olha a cobra! É mentira! #${i+1}`,
        uploadedBy: getRandom(['user-2', 'user-6', 'user-7']),
        createdAt: `2023-06-25T19:${i < 10 ? '0'+i : i}:00Z`,
        taggedUsers: getRandomSubset(approvedUsers, 4).map(u => u.id),
    })),
    // Album 3 Photos
    ...Array.from({ length: 5 }, (_, i) => ({
        id: `media-a3-${i+1}`,
        albumId: 'album-3',
        url: `https://picsum.photos/seed/album3-${i+1}/800/600`,
        type: 'image' as 'image' | 'video',
        description: `Brainstorming para o futuro. #${i+1}`,
        uploadedBy: getRandom(['user-1', 'user-2']),
        createdAt: `2023-02-10T15:${i < 10 ? '0'+i : i}:00Z`,
        taggedUsers: ['user-1', 'user-2'],
    })),
    // Albumless photo
    {
        id: `media-orphan-1`,
        url: `https://picsum.photos/seed/orphan1/800/600`,
        type: 'image',
        description: `Foto aleatória sem álbum.`,
        uploadedBy: 'user-6',
        createdAt: `2023-10-05T12:00:00Z`,
        taggedUsers: ['user-7'],
    },
];

export let stories: Story[] = [
    { id: 'story-1', userId: 'user-3', filePath: 'https://picsum.photos/seed/story1/400/800', type: 'image', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString() },
    { id: 'story-2', userId: 'user-4', filePath: 'https://picsum.photos/seed/story2/400/800', type: 'image', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), expiresAt: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString() },
    { id: 'story-3', userId: 'user-6', filePath: 'https://picsum.photos/seed/story3/400/800', type: 'image', createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), expiresAt: new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString() },
];

export let events: EventItem[] = [
    { id: 'event-1', date: '2023-06-25T18:00:00Z', title: 'Festa Junina da Firma', location: 'Sede da Empresa', albumId: 'album-2' },
    { id: 'event-2', date: '2023-12-20T20:00:00Z', title: 'Festa de Fim de Ano', location: 'Salão de Festas Central', albumId: 'album-4' }, // Assuming album-4 will be created for it
    { id: 'event-3', date: '2024-04-01T09:00:00Z', title: 'Hackathon Interno', location: 'Auditório Principal', albumId: 'album-5' },
];

export let musicTracks: MusicTrack[] = [];