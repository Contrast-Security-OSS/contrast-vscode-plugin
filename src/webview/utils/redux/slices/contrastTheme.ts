import { createSlice } from '@reduxjs/toolkit';

const contrastTheme: Record<string, number | null> = {
  data: null,
};

const ThemeSlicer = createSlice({
  name: 'contrastTheme',
  initialState: contrastTheme,
  reducers: {
    setContrastTheme: (state, action) => {
      state.data = action.payload;
    },
  },
});

export const { setContrastTheme } = ThemeSlicer.actions;
const ThemeReducer = ThemeSlicer.reducer;

export { ThemeReducer };
