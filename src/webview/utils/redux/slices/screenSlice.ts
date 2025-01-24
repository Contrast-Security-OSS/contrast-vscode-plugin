import { createSlice } from '@reduxjs/toolkit';
import { ScreenState } from '../../../../common/types';

const screenState: ScreenState = {
  data: null,
};

const LocaleSlicer = createSlice({
  name: 'screen',
  initialState: screenState,
  reducers: {
    setScreen: (state, action) => {
      state.data = action.payload;
    },
  },
});

export const { setScreen } = LocaleSlicer.actions;
const ScreenReducer = LocaleSlicer.reducer;

export { ScreenReducer };
