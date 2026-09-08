import axios from 'axios';

// Main API for non-video operations (auth, folders, etc.)
const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;