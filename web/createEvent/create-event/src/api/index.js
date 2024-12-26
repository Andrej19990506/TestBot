const API_URL = '/api';

const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

export const getEvents = async () => {
    try {
        const response = await fetch(`${API_URL}/events`, {
            headers: defaultHeaders
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const getChats = async () => {
    try {
        const response = await fetch(`${API_URL}/chats`, {
            headers: defaultHeaders
        });

        if (!response.ok) {
            throw new Error('Не удалось загрузить список чатов');
        }

        return response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const createEvent = async (eventData) => {
    try {
        const response = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: defaultHeaders,
            body: JSON.stringify(eventData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Не удалось создать событие');
        }

        return response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const deleteEvent = async (id) => {
    try {
        const response = await fetch(`${API_URL}/events/${id}`, {
            method: 'DELETE',
            headers: defaultHeaders
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}; 