import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;


export const checkUserSubscription = async (userId: number) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users/${userId}/subscription`);
    return response.data;
  } catch (error) {
    console.error("Error checking subscription:", error);
    return { isSubscribed: false, subscription: null };
  }
};

export const getActiveSubscription = async (userId: number) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users/${userId}/subscription/active`);
    return response.data;
  } catch (error) {
    console.error("Error getting active subscription:", error);
    return null;
  }
};