import { createSlice } from '@reduxjs/toolkit';
import { ProjectState } from '../../../../common/types';

const projectState: ProjectState = {
  configuredProjects: null,
  allProjectList: null,
  configuredProjectDelete: null,
  addConfigureProject: null,
  updateConfigureProject: null,
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
    updateConfiguredProjectDelete: (state, action) => {
      state.configuredProjectDelete = action.payload;
    },
    addConfigureProject: (state, action) => {
      state.addConfigureProject = action.payload;
    },
    updateConfigureProject: (state, action) => {
      state.updateConfigureProject = action.payload;
    },
  },
});

export const {
  getAllConfiguredProjects,
  getAllProjectList,
  updateConfiguredProjectDelete,
  addConfigureProject,
  updateConfigureProject,
} = projectSlice.actions;
const ProjectReducer = projectSlice.reducer;

export { ProjectReducer };
