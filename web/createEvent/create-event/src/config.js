const isDev = process.env.NODE_ENV === 'development';
const API_URL = isDev ? 'http://localhost:5000/api' : '/api';

export { API_URL };