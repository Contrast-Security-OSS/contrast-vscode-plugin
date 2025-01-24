import { createSlice } from '@reduxjs/toolkit';
import { ScanState } from '../../../../common/types';

const scanState: ScanState = {
  filters: null,
  activeCurrentFile: null,
  activeVulnerabilityReport: null,
};

const scanSlice = createSlice({
  name: 'scan',
  initialState: scanState,
  reducers: {
    getFilters: (state, action) => {
      state.filters = action.payload;
    },
    setActiveCurrentFile: (state, action) => {
      state.activeCurrentFile = action.payload;
    },
    setVulnerabilityReport: (state, action) => {
      state.activeVulnerabilityReport = action.payload;
    },
  },
});

export const { getFilters, setActiveCurrentFile, setVulnerabilityReport } =
  scanSlice.actions;
const ScanReducer = scanSlice.reducer;

export { ScanReducer };
