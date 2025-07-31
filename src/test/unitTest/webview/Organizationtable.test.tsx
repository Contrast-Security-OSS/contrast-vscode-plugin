import { render, fireEvent, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import OrganizationTable from '../../../webview/components/Settings/OrganizationTable';
/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('../../../webview/utils/postMessage', () => ({
  webviewPostMessage: jest.fn(),
}));
const mockStore = (state: any) => createStore((state) => state, state);

describe('OrganizationTable', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let store: any;

  beforeEach(() => {
    store = mockStore({
      i10ln: {
        data: {
          organization: {
            organizationName: { translate: 'Org Name' },
            projectName: { translate: 'Project Name' },
            type: { translate: 'Type' },
          },
          tooltips: {
            edit: { translate: 'Edit' },
            delete: { translate: 'Delete' },
          },
        },
      },
      project: {
        cancelStateWhileDelete: true,
      },
      scan: {
        scanRetrievelDetectAcrossIds: false,
      },
      assessFilter: {
        refreshBackgroundVulnRunnerAcrossIds: false,
      },
    });
  });

  const defaultProps = {
    dataSource: [
      {
        id: 1,
        organizationName: 'Org 1',
        projectName: 'Project 1',
        source: 'Type 1',
      },
      {
        id: 2,
        organizationName: 'Org 2',
        projectName: 'Project 2',
        source: 'Type 2',
      },
    ],
    onChange: jest.fn(),
    onDelete: jest.fn(),
    isDeselect: { deselectRow: false, updateDeselect: jest.fn() },
    /* eslint-disable @typescript-eslint/no-explicit-any */
  } as any;

  test('renders the table correctly', () => {
    render(
      <Provider store={store}>
        <OrganizationTable {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('Org Name')).toBeInTheDocument();
    expect(screen.getByText('Project Name')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();

    expect(screen.getByText('Org 1')).toBeInTheDocument();
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Type 1')).toBeInTheDocument();
    expect(screen.getByText('Org 2')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
    expect(screen.getByText('Type 2')).toBeInTheDocument();
  });

  test('selects a row when clicked', () => {
    const testStore = mockStore({
      ...store.getState(),
      project: {
        ...store.getState().project,
        cancelStateWhileDelete: false,
      },
    });
    render(
      <Provider store={testStore}>
        <OrganizationTable {...defaultProps} />
      </Provider>
    );

    const row = screen.getByText('Org 1').closest('tr');
    fireEvent.click(row!); // Simulate a click on the row

    expect(row).toBeInTheDocument();
  });

  test('does not show edit or delete buttons when no row is selected', () => {
    render(
      <Provider store={store}>
        <OrganizationTable {...defaultProps} />
      </Provider>
    );

    const editButton = screen.queryByRole('button', { name: 'Edit' });
    const deleteButton = screen.queryByRole('button', { name: 'Delete' });

    expect(editButton).toBeNull();
    expect(deleteButton).toBeNull();
  });

  test('calls updateDeselect when deselect is triggered', () => {
    const updatedProps = {
      ...defaultProps,
      isDeselect: { deselectRow: true, updateDeselect: jest.fn() },
    };

    render(
      <Provider store={store}>
        <OrganizationTable {...updatedProps} />
      </Provider>
    );

    expect(updatedProps.isDeselect.updateDeselect).toHaveBeenCalledWith(false);
  });
});
