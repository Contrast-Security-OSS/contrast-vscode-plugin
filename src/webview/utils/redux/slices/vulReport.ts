import { createSlice } from '@reduxjs/toolkit';
import { VulReport } from '../../../../common/types';

const vulReportState: VulReport = {
  currentFile: null,
  allFiles: null,
};

const vulnerablitySlicer = createSlice({
  name: 'vulReport',
  initialState: vulReportState,
  reducers: {
    getCurrentFileVulnerability: (state, action) => {
      state.currentFile = action.payload;
    },
    getAllFilesVulnerability: (state, action) => {
      state.allFiles = action.payload;
    },
  },
});

export const { getCurrentFileVulnerability, getAllFilesVulnerability } =
  vulnerablitySlicer.actions;
const vulnerabilityReducer = vulnerablitySlicer.reducer;

export { vulnerabilityReducer };
