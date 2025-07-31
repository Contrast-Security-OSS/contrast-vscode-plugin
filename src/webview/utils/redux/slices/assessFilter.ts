import { createSlice } from '@reduxjs/toolkit';
import { AssessFilterState } from '../../../../common/types';

const assessFilterState: AssessFilterState = {
  configuredApplications: null,
  buildNumber: null,
  assessEnvironments: null,
  assessTags: null,
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
  environmentsList: null,
  serversList: null,
  quickViewList: null,
  libraryUsageList: null,
  libraryLicenceList: null,
  tagList: null,
  scaFilters: null,
  scaSeverities: null,
  scaStatus: null,
  scaAllFiles: null,
  scaOrgTags: null,
  scaTagsOkBehaviour: false,
  scaCveOverview: null,
  scaAutoRefresh: null,
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
    getBuildNumber: (state, action) => {
      state.buildNumber = action.payload;
    },
    getAssessEnvironmentsList: (state, action) => {
      state.assessEnvironments = action.payload;
    },
    getAssessTagsList: (state, action) => {
      state.assessTags = action.payload;
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
    getEnvironmentsList: (state, action) => {
      state.environmentsList = action.payload;
    },
    getServersList: (state, action) => {
      state.serversList = action.payload;
    },
    getQuickViewList: (state, action) => {
      state.quickViewList = action.payload;
    },
    getLibraryUsageList: (state, action) => {
      state.libraryUsageList = action.payload;
    },
    getLibraryLicenceList: (state, action) => {
      state.libraryLicenceList = action.payload;
    },
    getTagList: (state, action) => {
      state.tagList = action.payload;
    },
    getScaFilters: (state, action) => {
      state.scaFilters = action.payload;
    },
    getScaStaus: (state, action) => {
      state.scaStatus = action.payload;
    },
    getScaSeverities: (state, action) => {
      state.scaSeverities = action.payload;
    },
    getScaAllFilesVulnerability: (state, action) => {
      state.scaAllFiles = action.payload;
    },
    getScaOrganizationTags: (state, action) => {
      state.scaOrgTags = action.payload;
    },
    setScaTagsOkBehaviour: (state, action) => {
      state.scaTagsOkBehaviour = action.payload;
    },
    getScaCveOverview: (state, action) => {
      state.scaCveOverview = action.payload;
    },
    getScaAutoRefresh: (state, action) => {
      state.scaAutoRefresh = action.payload;
    },
  },
});

export const {
  getConfiguredApplications,
  getServerListbyOrgId,
  getBuildNumber,
  getAssessEnvironmentsList,
  getAssessTagsList,
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
  getEnvironmentsList,
  getServersList,
  getQuickViewList,
  getLibraryUsageList,
  getLibraryLicenceList,
  getTagList,
  getScaFilters,
  getScaStaus,
  getScaSeverities,
  getScaAllFilesVulnerability,
  getScaOrganizationTags,
  setScaTagsOkBehaviour,
  getScaAutoRefresh,
} = assessFilterSlice.actions;
const AssessFilterReducer = assessFilterSlice.reducer;

export { AssessFilterReducer };
