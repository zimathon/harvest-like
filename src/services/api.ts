import axios from 'axios';

// 環境変数から API のベース URL を取得
// Vite の場合:
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'; // フォールバックを追加

// Create React App の場合:
// const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

// 環境変数が設定されていない場合の警告
if (!import.meta.env.VITE_API_BASE_URL && import.meta.env.MODE !== 'production') {
  console.warn(
    'Warning: VITE_API_BASE_URL environment variable is not set. Using default:',
    API_URL
  );
}

// Create axios instance
const api = axios.create({
  baseURL: API_URL, // 環境変数から取得した URL を使用
  withCredentials: true, // Cookieを送信するために追加
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized, clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;