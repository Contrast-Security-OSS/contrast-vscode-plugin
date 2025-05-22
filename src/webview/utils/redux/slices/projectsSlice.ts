import { createSlice } from '@reduxjs/toolkit';
import { ProjectState } from '../../../../common/types';

const projectState: ProjectState = {
  configuredProjects: null,
  allProjectList: null,
  allApplicationList: null,
  configuredProjectDelete: null,
  addConfigureProject: null,
  updateConfigureProject: null,
  cancelStateWhileDelete: false,
  settingActions: false,
};

const projectSlice = createSlice({
  name: 'project',
  initialState: projectState,
  reducers: {
    getAllConfiguredProjects: (state, action) => {
      state.configuredProjects = action.payload;
    },
    getAllProjectList: (state, action) => {
      state.allProjectList = action.payload;
    },
    // New
    getAllApplicationList: (state, action) => {
      state.allApplicationList = action.payload;
    },
    updateConfiguredProjectDelete: (state, action) => {
      state.configuredProjectDelete = action.payload;
    },
    addConfigureProject: (state, action) => {
      state.addConfigureProject = action.payload;
    },
    updateConfigureProject: (state, action) => {
      state.updateConfigureProject = action.payload;
    },
    setCancelStateWhileDelete: (state, action) => {
      state.cancelStateWhileDelete = action.payload;
    },
    setSettingActions: (state, action) => {
      state.settingActions = action.payload;
    },
  },
});

export const {
  getAllConfiguredProjects,
  getAllProjectList,
  getAllApplicationList,
  updateConfiguredProjectDelete,
  addConfigureProject,
  updateConfigureProject,
  setCancelStateWhileDelete,
  setSettingActions,
} = projectSlice.actions;
const ProjectReducer = projectSlice.reducer;

export { ProjectReducer };
