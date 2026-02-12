import client from '../client';

export const announcementService = {
    getAllAnnouncements: async () => {
        const response = await client.get('/announcements');
        return response.data;
    },

    createAnnouncement: async (announcementData) => {
        const response = await client.post('/announcements', announcementData);
        return response.data;
    }
};
