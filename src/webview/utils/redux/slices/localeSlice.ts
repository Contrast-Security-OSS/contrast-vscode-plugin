import { createSlice } from '@reduxjs/toolkit';
import { LocaleState } from '../../../../common/types';

const localeState: LocaleState = {
  data: null,
};

const LocaleSlicer = createSlice({
  name: 'locale',
  initialState: localeState,
  reducers: {
    setLocale: (state, action) => {
      state.data = action.payload;
    },
  },
});

export const { setLocale } = LocaleSlicer.actions;
const LocaleReducer = LocaleSlicer.reducer;

export { LocaleReducer };
