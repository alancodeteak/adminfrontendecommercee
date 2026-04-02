import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  sidebarOpen: false
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    openSidebar(state) {
      state.sidebarOpen = true;
    },
    closeSidebar(state) {
      state.sidebarOpen = false;
    }
  }
});

export const { toggleSidebar, openSidebar, closeSidebar } = uiSlice.actions;
export default uiSlice.reducer;

