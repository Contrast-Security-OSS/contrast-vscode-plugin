import {
  addConfigureProject,
  getAllConfiguredProjects,
  getAllProjectList,
  updateConfiguredProjectDelete,
  updateConfigureProject,
} from '../../../webview/utils/redux/slices/projectsSlice';
import { ProjectReducer } from '../../../webview/utils/redux/slices/projectsSlice';

describe('projectSlice', () => {
  const initialState = {
    configuredProjects: null,
    allProjectList: null,
    configuredProjectDelete: null,
    addConfigureProject: null,
    updateConfigureProject: null,
    /* eslint-disable @typescript-eslint/no-explicit-any */
  } as any;

  it('should return the initial state when no action is passed', () => {
    expect(
      ProjectReducer(undefined, {
        type: '',
      })
    ).toEqual(initialState);
  });

  it('should handle getAllConfiguredProjects action', () => {
    const action = getAllConfiguredProjects([{ id: 1, name: 'Project 1' }]);
    const newState = ProjectReducer(initialState, action);
    expect(newState.configuredProjects).toEqual([{ id: 1, name: 'Project 1' }]);
  });

  it('should handle getAllProjectList action', () => {
    const action = getAllProjectList([{ id: 1, name: 'Project 1' }]);
    const newState = ProjectReducer(initialState, action);
    expect(newState.allProjectList).toEqual([{ id: 1, name: 'Project 1' }]);
  });

  it('should handle updateConfiguredProjectDelete action', () => {
    const action = updateConfiguredProjectDelete({
      id: 1,
      name: 'Deleted Project',
    });
    const newState = ProjectReducer(initialState, action);
    expect(newState.configuredProjectDelete).toEqual({
      id: 1,
      name: 'Deleted Project',
    });
  });

  it('should handle addConfigureProject action', () => {
    const action = addConfigureProject({ id: 1, name: 'New Project' });
    const newState = ProjectReducer(initialState, action);
    expect(newState.addConfigureProject).toEqual({
      id: 1,
      name: 'New Project',
    });
  });

  it('should handle updateConfigureProject action', () => {
    const action = updateConfigureProject({ id: 1, name: 'Updated Project' });
    const newState = ProjectReducer(initialState, action);
    expect(newState.updateConfigureProject).toEqual({
      id: 1,
      name: 'Updated Project',
    });
  });
});
