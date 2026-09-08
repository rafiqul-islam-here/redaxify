import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  id: number | null;
  customerNumber: number | null;	
  name: string;
  email: string;
  userRole: string;
  userAuth: boolean;
  permission: boolean;
  userType?: string;          
  stripeCustomerId?: string; 
  currentSubscriptionId?: number;
}

const initialState: UserState = {
  id: null,
  customerNumber: null,
  name: "",
  email: "",
  userRole: "",
  userType: "",
  userAuth: false,
  permission: false
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => {
      return { ...action.payload };
    },
    updateUser: (state, action: PayloadAction<Partial<UserState>>) => {
      return { ...state, ...action.payload };
    },
    clearUser: () => initialState,
  },
});

export const { setUser, clearUser, updateUser } = userSlice.actions;
export default userSlice.reducer;
