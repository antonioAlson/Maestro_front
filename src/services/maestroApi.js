import axios from 'axios';

const maestroApi = axios.create({
  baseURL: import.meta.env.VITE_MAESTRO_API_URL || 'http://localhost:3000/api',
});

maestroApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('maestro_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

maestroApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('maestro_token');
      window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);

export default maestroApi;
