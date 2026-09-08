"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/userSlice";
import axios from "axios";

export default function AuthInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // const apiUrl =
        //   process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL ||
        //   "https://api.redaxify.com";
        const res = await axios.get(`/api/proxy?url=/api/users/user`, {
          withCredentials: true,
        });
        dispatch(setUser(res.data.data)); // dispatch user data to Redux
      } catch (err) {
        console.error("User not logged in or session expired", err);
      }
    };

    fetchUser();
  }, [dispatch]);

  return null; // nothing to render
}
