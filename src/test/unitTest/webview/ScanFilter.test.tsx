import { configureStore } from '@reduxjs/toolkit';
import { ScanState } from '../../../common/types';
import {
  getFilters,
  ScanReducer,
  setActiveCurrentFile,
  setVulnerabilityReport,
} from '../../../webview/utils/redux/slices/ScanFilter';

import { VulReport } from '../../../common/types';
import {
  getAllFilesVulnerability,
  getCurrentFileVulnerability,
  vulnerabilityReducer,
} from '../../../webview/utils/redux/slices/vulReport';

describe('scanSlice', () => {
  const initialState: ScanState = {
    filters: null,
    activeCurrentFile: null,
    activeVulnerabilityReport: null,
    scanRetrievelDetectAcrossIds: false,
    activeProjectName: null,
    backgroundVulnRunner: false,
    manualRefreshBackgroundVulnRunner: false,
    validWorkspaceProjects: [],
  };

  const store = configureStore({
    reducer: {
      scan: ScanReducer,
    },
  });

  it('should return the initial state', () => {
    const state = store.getState().scan;
    expect(state).toEqual(initialState);
  });

  it('should handle getFilters action', () => {
    const filtersPayload = { someKey: 'someValue' };

    store.dispatch(getFilters(filtersPayload));

    const state = store.getState().scan;
    expect(state.filters).toEqual(filtersPayload);
  });

  it('should handle setActiveCurrentFile action', () => {
    const activeCurrentFilePayload = true;

    store.dispatch(setActiveCurrentFile(activeCurrentFilePayload));

    const state = store.getState().scan;
    expect(state.activeCurrentFile).toBe(activeCurrentFilePayload);
  });

  it('should handle setVulnerabilityReport action', () => {
    const activeVulnerabilityReportPayload = true;

    store.dispatch(setVulnerabilityReport(activeVulnerabilityReportPayload));

    const state = store.getState().scan;
    expect(state.activeVulnerabilityReport).toBe(
      activeVulnerabilityReportPayload
    );
  });

  it('should handle multiple actions correctly', () => {
    const filtersPayload = { someKey: 'someValue' };
    const activeCurrentFilePayload = true;
    const activeVulnerabilityReportPayload = true;

    store.dispatch(getFilters(filtersPayload));
    store.dispatch(setActiveCurrentFile(activeCurrentFilePayload));
    store.dispatch(setVulnerabilityReport(activeVulnerabilityReportPayload));

    const state = store.getState().scan;
    expect(state.filters).toEqual(filtersPayload);
    expect(state.activeCurrentFile).toBe(activeCurrentFilePayload);
    expect(state.activeVulnerabilityReport).toBe(
      activeVulnerabilityReportPayload
    );
  });

  describe('vulnerabilitySlice', () => {
    const initialState: VulReport = {
      currentFile: null,
      allFiles: null,
    };

    it('should return the initial state', () => {
      expect(vulnerabilityReducer(undefined, { type: 'unknown' })).toEqual(
        initialState
      );
    });

    it('should handle getCurrentFileVulnerability', () => {
      const payload = {
        fileName: 'file1.js',
        vulnerabilities: ['vul1', 'vul2'],
      };
      const action = getCurrentFileVulnerability(payload);

      const state = vulnerabilityReducer(initialState, action);

      expect(state.currentFile).toEqual(payload);
      expect(state.allFiles).toBeNull();
    });

    it('should handle getAllFilesVulnerability', () => {
      const payload = [
        { fileName: 'file1.js', vulnerabilities: ['vul1'] },
        { fileName: 'file2.js', vulnerabilities: ['vul2'] },
      ];
      const action = getAllFilesVulnerability(payload);

      const state = vulnerabilityReducer(initialState, action);

      expect(state.allFiles).toEqual(payload);
      expect(state.currentFile).toBeNull();
    });
  });
});
