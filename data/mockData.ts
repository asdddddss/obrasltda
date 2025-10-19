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
    // 2024 Event Albums
    { id: 'album-event-2024-04-20', title: 'Error', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-04-20T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-04-20/400/400', description: 'Álbum para o evento Error', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-04-27', title: 'Colyn', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-04-27T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-04-27/400/400', description: 'Álbum para o evento Colyn', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-05-19', title: 'Mila Journee', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-05-19T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-05-19/400/400', description: 'Álbum para o evento Mila Journee', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-06-01', title: 'Illusionize', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-06-01T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-06-01/400/400', description: 'Álbum para o evento Illusionize', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-06-06', title: 'STB', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-06-06T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-06-06/400/400', description: 'Álbum para o evento STB', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-06-08', title: 'After Run Club', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-06-08T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-06-08/400/400', description: 'Álbum para o evento After Run Club', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-07-06', title: 'Cyclus', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-07-06T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-07-06/400/400', description: 'Álbum para o evento Cyclus', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-08-17', title: 'Warung Passo Fundo', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-08-17T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-08-17/400/400', description: 'Álbum para o evento Warung Passo Fundo', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-08-23', title: 'VNTG', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-08-23T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-08-23/400/400', description: 'Álbum para o evento VNTG', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-09-14', title: 'Cassian', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-09-14T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-09-14/400/400', description: 'Álbum para o evento Cassian', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-10-04', title: 'Illusionize', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-10-04T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-10-04/400/400', description: 'Álbum para o evento Illusionize', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-10-11', title: 'Kolsch', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-10-11T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-10-11/400/400', description: 'Álbum para o evento Kolsch', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-10-12', title: 'Moving', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-10-12T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-10-12/400/400', description: 'Álbum para o evento Moving', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-11-01', title: 'Gabss', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-11-01T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-11-01/400/400', description: 'Álbum para o evento Gabss', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-11-02', title: 'Departamento', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-11-02T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-11-02/400/400', description: 'Álbum para o evento Departamento', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-11-29', title: 'Michael Bibi e Mau P', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-11-29T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-11-29/400/400', description: 'Álbum para o evento Michael Bibi e Mau P', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-12-06', title: 'DNA ArtCar', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-12-06T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-12-06/400/400', description: 'Álbum para o evento DNA ArtCar', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-12-13', title: 'DNA ArtCar', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-12-13T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-12-13/400/400', description: 'Álbum para o evento DNA ArtCar', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-12-14', title: 'Energy', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-12-14T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-12-14/400/400', description: 'Álbum para o evento Energy', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2024-12-31', title: 'Mochakk', isEventAlbum: true, createdBy: 'user-1', createdAt: '2024-12-31T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2024-12-31/400/400', description: 'Álbum para o evento Mochakk', photos: [], taggedUsers: [], visibleTo: [] },
    
    // 2026 Event Albums
    { id: 'album-event-2026-01-17', title: 'DNA ArtCar', isEventAlbum: true, createdBy: 'user-1', createdAt: '2026-01-17T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2026-01-17/400/400', description: 'Álbum para o evento DNA ArtCar', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2026-02-14', title: 'VNTG', isEventAlbum: true, createdBy: 'user-1', createdAt: '2026-02-14T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2026-02-14/400/400', description: 'Álbum para o evento VNTG', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2026-02-15', title: 'VNTG', isEventAlbum: true, createdBy: 'user-1', createdAt: '2026-02-15T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2026-02-15/400/400', description: 'Álbum para o evento VNTG', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2026-02-16', title: 'Artbat e Camelphat', isEventAlbum: true, createdBy: 'user-1', createdAt: '2026-02-16T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2026-02-16/400/400', description: 'Álbum para o evento Artbat e Camelphat', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2026-02-27', title: 'Rüfüs du Sol', isEventAlbum: true, createdBy: 'user-1', createdAt: '2026-02-27T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2026-02-27/400/400', description: 'Álbum para o evento Rüfüs du Sol', photos: [], taggedUsers: [], visibleTo: [] },
    { id: 'album-event-2026-12-27', title: 'Universo Paralelo', isEventAlbum: true, createdBy: 'user-1', createdAt: '2026-12-27T22:00:00Z', permission: Role.MEMBER, coverPhoto: 'https://picsum.photos/seed/event-2026-12-27/400/400', description: 'Álbum para o evento Universo Paralelo', photos: [], taggedUsers: [], visibleTo: [] },
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
    
    // 2024 Events
    { id: 'event-2024-04-20', date: '2024-04-20T22:00:00Z', title: 'Error', location: 'Greenvalley BC', albumId: 'album-event-2024-04-20' },
    { id: 'event-2024-04-27', date: '2024-04-27T22:00:00Z', title: 'Colyn', location: 'Levels', albumId: 'album-event-2024-04-27' },
    { id: 'event-2024-05-19', date: '2024-05-19T22:00:00Z', title: 'Mila Journee', location: 'Kontrol', albumId: 'album-event-2024-05-19' },
    { id: 'event-2024-06-01', date: '2024-06-01T22:00:00Z', title: 'Illusionize', location: 'U Club', albumId: 'album-event-2024-06-01' },
    { id: 'event-2024-06-06', date: '2024-06-06T22:00:00Z', title: 'STB', location: 'São Paulo', albumId: 'album-event-2024-06-06' },
    { id: 'event-2024-06-08', date: '2024-06-08T22:00:00Z', title: 'After Run Club', location: 'São Paulo', albumId: 'album-event-2024-06-08' },
    { id: 'event-2024-07-06', date: '2024-07-06T22:00:00Z', title: 'Cyclus', location: 'Green Park', albumId: 'album-event-2024-07-06' },
    { id: 'event-2024-08-17', date: '2024-08-17T22:00:00Z', title: 'Warung', location: 'Passo Fundo', albumId: 'album-event-2024-08-17' },
    { id: 'event-2024-08-23', date: '2024-08-23T22:00:00Z', title: 'VNTG', location: 'Greenvalley Gramado', albumId: 'album-event-2024-08-23' },
    { id: 'event-2024-09-14', date: '2024-09-14T22:00:00Z', title: 'Cassian', location: 'Greenvalley', albumId: 'album-event-2024-09-14' },
    { id: 'event-2024-10-04', date: '2024-10-04T22:00:00Z', title: 'Illusionize', location: 'GoodTimes', albumId: 'album-event-2024-10-04' },
    { id: 'event-2024-10-11', date: '2024-10-11T22:00:00Z', title: 'Kolsch', location: 'Warung', albumId: 'album-event-2024-10-11' },
    { id: 'event-2024-10-12', date: '2024-10-12T22:00:00Z', title: 'Moving', location: 'Green Park', albumId: 'album-event-2024-10-12' },
    { id: 'event-2024-11-01', date: '2024-11-01T22:00:00Z', title: 'Gabss', location: 'Kontrol', albumId: 'album-event-2024-11-01' },
    { id: 'event-2024-11-02', date: '2024-11-02T22:00:00Z', title: 'Departamento', location: '4ü Sunset', albumId: 'album-event-2024-11-02' },
    { id: 'event-2024-11-29', date: '2024-11-29T22:00:00Z', title: 'Michael Bibi e Mau P', location: 'Greenvalley', albumId: 'album-event-2024-11-29' },
    { id: 'event-2024-12-06', date: '2024-12-06T22:00:00Z', title: 'DNA ArtCar', location: 'São Paulo', albumId: 'album-event-2024-12-06' },
    { id: 'event-2024-12-13', date: '2024-12-13T22:00:00Z', title: 'DNA ArtCar', location: 'Expointer', albumId: 'album-event-2024-12-13' },
    { id: 'event-2024-12-14', date: '2024-12-14T22:00:00Z', title: 'Energy', location: 'Green Park', albumId: 'album-event-2024-12-14' },
    { id: 'event-2024-12-31', date: '2024-12-31T22:00:00Z', title: 'Mochakk', location: 'Privilege', albumId: 'album-event-2024-12-31' },

    // 2026 Events
    { id: 'event-2026-01-17', date: '2026-01-17T22:00:00Z', title: 'DNA ArtCar', location: 'Greenvalley', albumId: 'album-event-2026-01-17' },
    { id: 'event-2026-02-14', date: '2026-02-14T22:00:00Z', title: 'VNTG', location: 'Greenvalley', albumId: 'album-event-2026-02-14' },
    { id: 'event-2026-02-15', date: '2026-02-15T22:00:00Z', title: 'VNTG', location: 'P12 Jurerê', albumId: 'album-event-2026-02-15' },
    { id: 'event-2026-02-16', date: '2026-02-16T22:00:00Z', title: 'Artbat e Camelphat', location: 'Greenvalley', albumId: 'album-event-2026-02-16' },
    { id: 'event-2026-02-27', date: '2026-02-27T22:00:00Z', title: 'Rüfüs du Sol', location: 'Curitiba', albumId: 'album-event-2026-02-27' },
    { id: 'event-2026-12-27', date: '2026-12-27T22:00:00Z', title: 'Universo Paralelo', location: 'Bahia', albumId: 'album-event-2026-12-27' },
];

export let musicTracks: MusicTrack[] = [
  {
    id: 'music-1',
    title: 'VINTAGE CULTURE',
    artist: 'CULTURFM',
    url: 'https://storage.googleapis.com/aai-web-samples/samples/ocean.mp3',
    duration: 814,
    hotcues: [],
  },
  {
    id: 'music-2',
    title: 'RICH',
    artist: 'NIGO',
    url: 'https://storage.googleapis.com/aai-web-samples/samples/rich.mp3',
    duration: 153,
    hotcues: [],
  },
];