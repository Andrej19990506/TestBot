const isDev = process.env.NODE_ENV === 'development';

export const API_URL = isDev 
  ? '/api'  // Для локальной разработки
  : '/api';  // Возвращаем обратно для разработки