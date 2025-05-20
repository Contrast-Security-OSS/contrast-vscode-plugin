import { createSlice } from '@reduxjs/toolkit';
import { AssessFilterState } from '../../../../common/types';

const assessFilterState: AssessFilterState = {
  configuredApplications: null,
  builNumber: null,
  customSessionMetaData: null,
  mostRecentMetaData: null,
  serverListbyOrgId: null,
  filters: null,
  allFiles: null,
  backgroundVulnRunner: false,
  markAsBtnBehaviour: false,
  orgTags: null,
  tagsOkBehaviour: false,
  currentFile: null,
  manualRefreshBackgroundVulnRunner: false,
  activeCurrentFile: null,
  refreshBackgroundVulnRunnerAcrossIds: false,
};

const assessFilterSlice = createSlice({
  name: 'assessFilter',
  initialState: assessFilterState,
  reducers: {
    getConfiguredApplications: (state, action) => {
      state.configuredApplications = action.payload;
    },
    getServerListbyOrgId: (state, action) => {
      state.serverListbyOrgId = action.payload;
    },
    getBuilNumber: (state, action) => {
      state.builNumber = action.payload;
    },
    getCustomSessionMetaData: (state, action) => {
      state.customSessionMetaData = action.payload;
    },
    getMostRecentMetaData: (state, action) => {
      state.mostRecentMetaData = action.payload;
    },
    getAssessFilters: (state, action) => {
      state.filters = action.payload;
    },
    getAssessAllFilesVulnerability: (state, action) => {
      state.allFiles = action.payload;
    },
    setBackgroundRunner: (state, action) => {
      state.backgroundVulnRunner = action.payload;
    },
    setMarkAsOkBehaviour: (state, action) => {
      state.markAsBtnBehaviour = action.payload;
    },
    getOrganizationTags: (state, action) => {
      state.orgTags = action.payload;
    },
    setTagsOkBehaviour: (state, action) => {
      state.tagsOkBehaviour = action.payload;
    },
    getAssessCurrentFileVulnerability: (state, action) => {
      state.currentFile = action.payload;
    },
    setManualRefreshBackgroundRunner: (state, action) => {
      state.manualRefreshBackgroundVulnRunner = action.payload;
    },
    setAssessActiveCurrentFile: (state, action) => {
      state.activeCurrentFile = action.payload;
    },
    setRefreshBackgroundRunnerAcrossIds: (state, action) => {
      state.refreshBackgroundVulnRunnerAcrossIds = action.payload;
    },
  },
});

export const {
  getConfiguredApplications,
  getServerListbyOrgId,
  getBuilNumber,
  getCustomSessionMetaData,
  getMostRecentMetaData,
  getAssessFilters,
  getAssessAllFilesVulnerability,
  setBackgroundRunner,
  setMarkAsOkBehaviour,
  getOrganizationTags,
  setTagsOkBehaviour,
  getAssessCurrentFileVulnerability,
  setManualRefreshBackgroundRunner,
  setAssessActiveCurrentFile,
  setRefreshBackgroundRunnerAcrossIds,
} = assessFilterSlice.actions;
const AssessFilterReducer = assessFilterSlice.reducer;

export { AssessFilterReducer };
