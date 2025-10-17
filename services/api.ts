import { MOCK_USERS, MOCK_ALBUMS, MOCK_ALBUMLESS_MEDIA, MOCK_STORIES, MOCK_EVENTS } from '../data/mockData';
import { User, Role, Album, MediaItem, Story, EventItem } from '../types';

// Let's make the mock data mutable for simulation purposes
let users = [...MOCK_USERS];
let albums = [...MOCK_ALBUMS];
let albumlessMedia = [...MOCK_ALBUMLESS_MEDIA];
let stories = [...MOCK_STORIES];
let events = [...MOCK_EVENTS];

// Helper to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- User Management ---

export const getMockUsers = async (): Promise<User[]> => {
  await delay(100);
  return [...users];
};

export const getUser = async (id: string): Promise<User | undefined> => {
  await delay(50);
  return users.find(u => u.id === id);
};

export const login = async (name: string, pass: string): Promise<User | null> => {
    await delay(300);
    // In a real app, 'pass' would be hashed and checked. Here we ignore it.
    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.status === 'APPROVED');
    return user || null;
};

export const registerUser = async (name: string, password: string): Promise<{ success: boolean; message: string }> => {
    await delay(500);
    if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
        return { success: false, message: 'Este nome de usuário já está em uso.' };
    }
    const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
        role: Role.READER,
        status: 'PENDING',
        birthdate: undefined,
    };
    users.push(newUser);
    return { success: true, message: 'Usuário registrado com sucesso. Aguardando aprovação.' };
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User | null> => {
    await delay(200);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        users[userIndex] = { ...users[userIndex], ...updates };
        return users[userIndex];
    }
    return null;
}

export const deleteUser = async (userId: string): Promise<boolean> => {
    await delay(300);
    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);
    return users.length < initialLength;
}

export const getUsersWithBirthdays = async (): Promise<User[]> => {
    await delay(100);
    return users
      .filter(u => u.birthdate && u.status === 'APPROVED')
      .sort((a, b) => {
          const dateA = new Date(a.birthdate!);
          const dateB = new Date(b.birthdate!);
          // Sort by month, then day
          if (dateA.getMonth() !== dateB.getMonth()) {
              return dateA.getMonth() - dateB.getMonth();
          }
          return dateA.getDate() - dateB.getDate();
      });
}

// --- Content Visibility Helpers ---

const canUserView = (contentPermission: Role, userRole: Role | undefined): boolean => {
    if (!userRole) userRole = Role.READER; // Guest user

    if (contentPermission === Role.READER) return true;
    if (contentPermission === Role.MEMBER) return [Role.MEMBER, Role.ADMIN, Role.ADMIN_MASTER].includes(userRole);
    if (contentPermission === Role.ADMIN) return [Role.ADMIN, Role.ADMIN_MASTER].includes(userRole);
    if (contentPermission === Role.ADMIN_MASTER) return userRole === Role.ADMIN_MASTER;
    
    return false;
};

// --- Media & Albums ---

export const getMediaForFeed = async (user: User | null): Promise<MediaItem[]> => {
    await delay(500);
    const visibleAlbums = albums.filter(album => canUserView(album.permission, user?.role));
    const mediaFromAlbums = visibleAlbums.flatMap(album => album.photos);
    const allVisibleMedia = [...mediaFromAlbums, ...albumlessMedia];
    
    return allVisibleMedia.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getAllVisibleAlbums = async (user: User | null): Promise<Album[]> => {
    await delay(200);
    return albums
        .filter(album => canUserView(album.permission, user?.role))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getAlbumById = async (albumId: string, user: User | null): Promise<Album | undefined> => {
    await delay(250);
    const album = albums.find(a => a.id === albumId);
    if (!album || !canUserView(album.permission, user?.role)) {
        return undefined;
    }
    return album;
};


export const getAlbumsForUser = async (userId: string, currentUser: User | null): Promise<{ albums: Album[] }> => {
    await delay(200);
    // Returns albums created by the user that the current user can see
    const userAlbums = albums.filter(a => a.createdBy === userId && canUserView(a.permission, currentUser?.role));
    return { albums: userAlbums };
};

export const getContentForUserProfile = async (profileUserId: string, currentUser: User | null): Promise<{ taggedInAlbums: Album[], taggedInMedia: MediaItem[] }> => {
    await delay(400);
    const visibleAlbums = await getAllVisibleAlbums(currentUser);

    const taggedInAlbums = visibleAlbums.filter(album => album.taggedUsers.includes(profileUserId));
    
    const mediaFromVisibleAlbums = visibleAlbums.flatMap(album => album.photos);
    const allVisibleMedia = [...mediaFromVisibleAlbums, ...albumlessMedia];

    const taggedInMedia = allVisibleMedia
        .filter(media => media.taggedUsers?.includes(profileUserId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { taggedInAlbums, taggedInMedia };
};

export const createAlbum = async (albumData: { title: string; description: string; permission: Role; isEventAlbum?: boolean }, creator: User): Promise<Album> => {
    await delay(400);
    const newAlbum: Album = {
        id: `album-${Date.now()}`,
        title: albumData.title,
        description: albumData.description,
        permission: albumData.permission,
        coverPhoto: 'https://picsum.photos/seed/newalbum/800/600', // Placeholder
        createdBy: creator.id,
        createdAt: new Date().toISOString(),
        visibleTo: [],
        taggedUsers: [],
        photos: [],
        isEventAlbum: albumData.isEventAlbum || false,
    };
    albums.unshift(newAlbum);
    return newAlbum;
};

export const addMediaItems = async (files: File[], uploader: User, albumId?: string): Promise<MediaItem[]> => {
    await delay(1000); // Simulate upload time
    
    const newMediaItems: MediaItem[] = files.map((file, index) => ({
      id: `media-${Date.now()}-${index}`,
      albumId: albumId,
      url: URL.createObjectURL(file), // In real app, this would be a server URL
      type: file.type.startsWith('video/') ? 'video' : 'image',
      description: '',
      uploadedBy: uploader.id,
      createdAt: new Date().toISOString(),
      taggedUsers: [],
    }));

    if (albumId) {
        const albumIndex = albums.findIndex(a => a.id === albumId);
        if (albumIndex > -1) {
            albums[albumIndex].photos.unshift(...newMediaItems);
            // Update cover photo if it's the first photo
            if (albums[albumIndex].photos.length === newMediaItems.length) {
                const firstImage = newMediaItems.find(m => m.type === 'image');
                if (firstImage) {
                    albums[albumIndex].coverPhoto = firstImage.url;
                }
            }
        }
    } else {
        albumlessMedia.unshift(...newMediaItems);
    }
    
    return newMediaItems;
};

export const updateMediaItem = async (mediaId: string, updates: Partial<MediaItem>): Promise<MediaItem | null> => {
    await delay(300);

    const findAndupdate = (mediaList: MediaItem[]): MediaItem | null => {
        const mediaIndex = mediaList.findIndex(m => m.id === mediaId);
        if (mediaIndex > -1) {
            mediaList[mediaIndex] = { ...mediaList[mediaIndex], ...updates };
            return mediaList[mediaIndex];
        }
        return null;
    }

    // Check albumless media first
    let updatedMedia = findAndupdate(albumlessMedia);
    if(updatedMedia) {
        // Handle moving from no-album to an album
        if (updates.albumId) {
            albumlessMedia = albumlessMedia.filter(m => m.id !== mediaId);
            const newAlbum = albums.find(a => a.id === updates.albumId);
            newAlbum?.photos.unshift(updatedMedia);
        }
        return updatedMedia;
    }

    // Check all albums
    for (const album of albums) {
        updatedMedia = findAndupdate(album.photos);
        if (updatedMedia) {
             // If albumId changed, we need to move the media item
             if (updates.albumId !== undefined && updates.albumId !== album.id) {
                // Remove from old album
                album.photos = album.photos.filter(p => p.id !== mediaId);
                
                if(updates.albumId === '' || updates.albumId === null) {
                    // Moved to no album
                    albumlessMedia.unshift(updatedMedia);
                } else {
                    // Moved to new album
                    const newAlbum = albums.find(a => a.id === updates.albumId);
                    newAlbum?.photos.unshift(updatedMedia);
                }
            }
            return updatedMedia;
        }
    }
    return null;
};


export const deleteMediaItem = async (mediaId: string, albumId?: string): Promise<boolean> => {
    await delay(300);
    if (albumId) {
        const albumIndex = albums.findIndex(a => a.id === albumId);
        if (albumIndex > -1) {
            const initialLength = albums[albumIndex].photos.length;
            albums[albumIndex].photos = albums[albumIndex].photos.filter(p => p.id !== mediaId);
            return albums[albumIndex].photos.length < initialLength;
        }
    } else {
        const initialLength = albumlessMedia.length;
        albumlessMedia = albumlessMedia.filter(m => m.id !== mediaId);
        return albumlessMedia.length < initialLength;
    }
    return false;
};

// --- Stories ---

export const getStories = async (): Promise<Story[]> => {
    await delay(150);
    const now = new Date();
    // Filter out expired stories
    return stories.filter(s => new Date(s.expiresAt) > now);
};

export const addStory = async (userId: string, file: File): Promise<Story> => {
    await delay(600);
    const now = new Date();
    const newStory: Story = {
        id: `story-${Date.now()}`,
        userId,
        filePath: URL.createObjectURL(file), // This would be a server URL in a real app
        type: file.type.startsWith('video/') ? 'video' : 'image',
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    };
    stories.unshift(newStory);
    return newStory;
};

// --- Search ---

export const searchContent = async (query: string, currentUser: User | null): Promise<{ users: User[], albums: Album[], media: MediaItem[] }> => {
    await delay(400);
    const lowerQuery = query.toLowerCase();

    if (!lowerQuery) return { users: [], albums: [], media: [] };
    
    const foundUsers = users.filter(u => u.name.toLowerCase().includes(lowerQuery));
    
    const visibleAlbums = await getAllVisibleAlbums(currentUser);
    const foundAlbums = visibleAlbums.filter(a => a.title.toLowerCase().includes(lowerQuery) || a.description.toLowerCase().includes(lowerQuery));
    
    const visibleMedia = await getMediaForFeed(currentUser);
    const foundMedia = visibleMedia.filter(m => m.description.toLowerCase().includes(lowerQuery));

    return { users: foundUsers, albums: foundAlbums, media: foundMedia };
};


// --- Events ---
export const getEvents = async (): Promise<EventItem[]> => {
    await delay(200);
    return [...events].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const createEvent = async (eventData: Omit<EventItem, 'id' | 'albumId'> & { albumId?: string, createAlbumAutomatically?: boolean }, currentUser: User): Promise<EventItem> => {
    await delay(400);
    if (currentUser.role !== Role.ADMIN && currentUser.role !== Role.ADMIN_MASTER) {
        throw new Error("Permission denied");
    }

    let finalAlbumId = eventData.albumId;

    if (eventData.createAlbumAutomatically) {
        const newAlbum = await createAlbum({ 
            title: eventData.title, 
            description: `Álbum para o evento ${eventData.title} em ${new Date(eventData.date).toLocaleDateString()}`, 
            permission: Role.MEMBER,
            isEventAlbum: true,
        }, currentUser);
        finalAlbumId = newAlbum.id;
    }

    if (!finalAlbumId) {
        throw new Error("O ID do álbum é necessário para criar um evento.");
    }
    
    const newEvent: EventItem = {
        id: `event-${Date.now()}`,
        title: eventData.title,
        location: eventData.location,
        date: eventData.date,
        albumId: finalAlbumId,
    };
    events.push(newEvent);
    return newEvent;
};

export const updateEvent = async (eventId: string, updates: Partial<Omit<EventItem, 'id'>>, currentUser: User): Promise<EventItem | null> => {
    await delay(300);
     if (currentUser.role !== Role.ADMIN && currentUser.role !== Role.ADMIN_MASTER) {
        throw new Error("Permission denied");
    }
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex > -1) {
        const originalEvent = events[eventIndex];
        events[eventIndex] = { ...originalEvent, ...updates };

        // Also update the linked album if the title or creation date changes
        const linkedAlbumIndex = albums.findIndex(a => a.id === originalEvent.albumId);
        if (linkedAlbumIndex > -1) {
            if (updates.title) albums[linkedAlbumIndex].title = updates.title;
            if (updates.date) albums[linkedAlbumIndex].createdAt = updates.date;
        }

        return events[eventIndex];
    }
    return null;
};

export const deleteEvent = async (eventId: string, currentUser: User): Promise<boolean> => {
    await delay(300);
    if (currentUser.role !== Role.ADMIN && currentUser.role !== Role.ADMIN_MASTER) {
        throw new Error("Permission denied");
    }
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex > -1) {
        const { albumId } = events[eventIndex];
        // Delete the event
        events.splice(eventIndex, 1);
        // And its associated album
        const albumIndex = albums.findIndex(a => a.id === albumId);
        if (albumIndex > -1) {
            albums.splice(albumIndex, 1);
        }
        return true;
    }
    return false;
}

// --- Admin Functions ---

export const getAllAlbumsForAdmin = async (): Promise<Album[]> => {
    await delay(100);
    return [...albums].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getAllAlbumlessMediaForAdmin = async (): Promise<MediaItem[]> => {
    await delay(100);
    return [...albumlessMedia].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};