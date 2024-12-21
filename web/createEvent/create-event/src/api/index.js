const API_URL = process.env.REACT_APP_API_URL;

export const getEvents = async () => {
  const response = await fetch(`${API_URL}/events`);
  if (!response.ok) {
    throw new Error('Не удалось загрузить события');
  }
  return response.json();
};

export const getChats = async () => {
  const response = await fetch(`${API_URL}/chats`);
  if (!response.ok) {
    throw new Error('Не удалось загрузить список чатов');
  }
  return response.json();
};

export const createEvent = async (eventData) => {
  const response = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });
  if (!response.ok) {
    throw new Error('Не удалось создать событие');
  }
  return response.json();
}; 