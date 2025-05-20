import { createSlice } from '@reduxjs/toolkit';
import { ScanState } from '../../../../common/types';

const scanState: ScanState = {
  filters: null,
  activeProjectName: null,
  validWorkspaceProjects: [],
  backgroundVulnRunner: false,
  manualRefreshBackgroundVulnRunner: false,
  activeCurrentFile: null,
  activeVulnerabilityReport: null,
  scanRetrievelDetectAcrossIds: false,
};

const scanSlice = createSlice({
  name: 'scan',
  initialState: scanState,
  reducers: {
    getFilters: (state, action) => {
      state.filters = action.payload;
    },
    setActiveProjectName: (state, action) => {
      state.activeProjectName = action.payload;
    },
    setValidWorkspaceProjects: (state, action) => {
      state.validWorkspaceProjects = action.payload;
    },
    setScanBackgroundRunner: (state, action) => {
      state.backgroundVulnRunner = action.payload;
    },
    setScanManualRefreshBackgroundRunner: (state, action) => {
      state.manualRefreshBackgroundVulnRunner = action.payload;
    },
    setActiveCurrentFile: (state, action) => {
      state.activeCurrentFile = action.payload;
    },
    setVulnerabilityReport: (state, action) => {
      state.activeVulnerabilityReport = action.payload;
    },
    setScanRetrievelDetectAcrossIds: (state, action) => {
      state.scanRetrievelDetectAcrossIds = action.payload;
    },
  },
});

export const {
  getFilters,
  setActiveCurrentFile,
  setScanBackgroundRunner,
  setScanManualRefreshBackgroundRunner,
  setVulnerabilityReport,
  setScanRetrievelDetectAcrossIds,
  setActiveProjectName,
  setValidWorkspaceProjects,
} = scanSlice.actions;
const ScanReducer = scanSlice.reducer;

export { ScanReducer };
