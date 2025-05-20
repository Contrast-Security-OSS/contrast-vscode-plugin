import { fireEvent, render, waitFor } from '@testing-library/react';
import RetrieveVulnerabilities from '../../../webview/screens/Assess/tabs/RetrieveVulnerabilities/RetrieveVulnerabilities';
import { Provider } from 'react-redux';
import { configureStore, Store, UnknownAction } from '@reduxjs/toolkit';
import {
  AssessFilterReducer,
  getAssessFilters,
  getBuilNumber,
  getConfiguredApplications,
  getCustomSessionMetaData,
  getServerListbyOrgId,
} from '../../../webview/utils/redux/slices/assessFilter';
import { LocaleReducer } from '../../../webview/utils/redux/slices/localeSlice';
import { ThemeReducer } from '../../../webview/utils/redux/slices/contrastTheme';
import { configuredProject1, configuredProject2 } from '../../mocks/testMock';
import { webviewPostMessage } from '../../../webview/utils/postMessage';
import { ConfiguredProject } from '../../../common/types';
// Mock webviewPostMessage to avoid errors
jest.mock('../../../webview/utils/postMessage', () => ({
  webviewPostMessage: jest.fn(),
}));

describe('Retrieve Vulnerabilities', () => {
  let store: Store<unknown, UnknownAction, unknown>;
  const renderRetrieveVulnerabilities = () => {
    return render(
      <Provider store={store}>
        <RetrieveVulnerabilities />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a fresh Redux store instance before each test
    store = configureStore({
      reducer: {
        assessFilter: AssessFilterReducer, // Use the actual reducer
        i10ln: LocaleReducer,
        theme: ThemeReducer,
      },
    });
  });

  const dispatchConfiguredApplications = (
    data: Array<ConfiguredProject> | []
  ) => {
    store.dispatch(
      getConfiguredApplications({
        code: 200,
        responseData: data,
      })
    );
  };

  const dispatchServerList = (data: Array<Record<string, string | number>>) => {
    store.dispatch(
      getServerListbyOrgId({
        code: 200,
        responseData: data,
      })
    );
  };

  const dispatchBuildNumber = (
    data: Array<Record<string, string | number>>
  ) => {
    store.dispatch(
      getBuilNumber({
        code: 200,
        responseData: data,
      })
    );
  };

  test('should render default state with disabled application components and initial values', () => {
    const { container } = renderRetrieveVulnerabilities();

    const application = container.querySelector('#application');
    const server = container.querySelector('#server');
    const buildNumber = container.querySelector('#buildNumber');
    const status = container.querySelector('#status');
    const severity = container.querySelector('#severity');
    const refresh = container.querySelector('#refresh');
    const buildClear = container.querySelector('#buildClear');
    const dateRange = container.querySelector('#dateRange');

    expect(application).toHaveTextContent('No Applications Found');
    expect(server).toHaveTextContent('No Servers Found');
    expect(buildNumber).toHaveTextContent('No Build Numbers Found');

    expect(status?.children[0].querySelector('input')).toBeChecked();
    expect(status?.children[1].querySelector('input')).toBeChecked();
    expect(status?.children[2].querySelector('input')).toBeChecked();
    expect(status?.children[3].querySelector('input')).not.toBeChecked();
    expect(status?.children[4].querySelector('input')).not.toBeChecked();

    expect(severity?.children[0].querySelector('input')).toBeChecked();
    expect(severity?.children[1].querySelector('input')).toBeChecked();
    expect(severity?.children[2].querySelector('input')).toBeChecked();
    expect(severity?.children[3].querySelector('input')).not.toBeChecked();
    expect(severity?.children[4].querySelector('input')).not.toBeChecked();

    expect(dateRange).toHaveTextContent('All');

    expect(refresh).not.toBeEnabled();
    expect(buildClear).toBeEnabled();
  });

  test('should show "No Applications Found" when no applications are available', async () => {
    const { container } = renderRetrieveVulnerabilities();

    const application = container.querySelector('#application');
    expect(application).toHaveTextContent('No Applications Found');
  });

  test('should update the application list when data is loaded', async () => {
    const { container } = renderRetrieveVulnerabilities();

    dispatchConfiguredApplications([]);

    const application = container.querySelector('#application');
    await waitFor(() => {
      expect(application).toHaveTextContent('No Applications Found');
    });

    dispatchConfiguredApplications([
      configuredProject1,
      { ...configuredProject2, source: 'assess' },
    ]);

    await waitFor(() => {
      expect(application).not.toHaveTextContent('No Applications Found');
      expect(application).toHaveTextContent(configuredProject2.projectName);
    });
  });

  test('should show "No Servers Found" initially, then update the server list on data load', async () => {
    const { container } = renderRetrieveVulnerabilities();

    const server = container.querySelector('#server');
    dispatchConfiguredApplications([]);

    await waitFor(() => {
      expect(server).toHaveTextContent('No Servers Found');
    });

    dispatchConfiguredApplications([
      configuredProject1,
      { ...configuredProject2, source: 'assess' },
    ]);

    await waitFor(() => {
      expect(webviewPostMessage).toHaveBeenCalledWith({
        command: 'getServerListbyOrgId',
        payload: { ...configuredProject2, source: 'assess' },
        screen: 'CONFIGURE_ASSESS',
      });

      dispatchServerList([
        {
          server_id: 101,
          name: 'Team1',
        },
      ]);

      expect(server).toHaveTextContent('Team1');
    });
  });

  test('should show "No Build Numbers Found" initially, then update the build number when data is loaded', async () => {
    const { container } = renderRetrieveVulnerabilities();

    const buildNumber = container.querySelector('#buildNumber');
    dispatchBuildNumber([]);

    await waitFor(() => {
      expect(buildNumber).toHaveTextContent('No Build Numbers Found');
    });

    dispatchConfiguredApplications([
      configuredProject1,
      { ...configuredProject2, source: 'assess' },
    ]);

    await waitFor(() => {
      expect(webviewPostMessage).toHaveBeenCalledWith({
        command: 'getBuilNumber',
        payload: { ...configuredProject2, source: 'assess' },
        screen: 'CONFIGURE_ASSESS',
      });

      dispatchBuildNumber([
        {
          keycode: 101,
          label: '1.90',
        },
      ]);
    });

    await waitFor(() => {
      expect(buildNumber).toHaveTextContent('1.90');
    });
  });

  test('should reset application and server data when "Clear" button is clicked', async () => {
    const { container } = renderRetrieveVulnerabilities();
    const server = container.querySelector('#server');
    const buildNumber = container.querySelector('#buildNumber');

    store.dispatch(
      getAssessFilters({
        code: 200,
        responseData: null,
      })
    );

    dispatchServerList([
      {
        server_id: 101,
        name: 'Team1',
      },
    ]);

    dispatchBuildNumber([
      {
        keycode: 101,
        label: '1.90',
      },
    ]);

    await waitFor(() => {
      expect(server).toHaveTextContent('Team1');
      expect(buildNumber).toHaveTextContent('1.90');
    });

    const clear = container.querySelector('#buildClear');
    if (clear && (clear as HTMLButtonElement).disabled === false) {
      fireEvent.click(clear);
      await waitFor(() => {
        expect(server).toHaveTextContent('No Servers Found');
        expect(buildNumber).toHaveTextContent('No Build Numbers Found');
      });
    }
  });

  describe('Refresh Button', () => {
    test('should call webviewPostMessage with server and build data when "Refresh" button is clicked', async () => {
      const { container } = renderRetrieveVulnerabilities();
      dispatchConfiguredApplications([
        configuredProject1,
        { ...configuredProject2, source: 'assess' },
      ]);

      const refresh = container.querySelector('#refresh');
      const run = container.querySelector('#run');
      const clear = container.querySelector('#clear');
      if (refresh) {
        fireEvent.click(refresh);
        await waitFor(() => {
          expect(webviewPostMessage).toHaveBeenCalledWith({
            command: 'getServerListbyOrgId',
            payload: { ...configuredProject2, source: 'assess' },
            screen: 'CONFIGURE_ASSESS',
          });

          expect(webviewPostMessage).toHaveBeenCalledWith({
            command: 'getBuilNumber',
            payload: { ...configuredProject2, source: 'assess' },
            screen: 'CONFIGURE_ASSESS',
          });

          expect(run).not.toBeEnabled();
          expect(clear).toBeEnabled();
        });
      }
    });

    test('should disable the "Refresh" button after it is clicked', async () => {
      const { container } = renderRetrieveVulnerabilities();
      const refresh = container.querySelector('#refresh');
      if (refresh && (refresh as HTMLButtonElement).disabled !== false) {
        fireEvent.click(refresh);
        await waitFor(() => {
          expect(refresh).toBeDisabled();
        });
      }
    });
  });
  describe(' status and severity checkbox', () => {
    test('should check respective checkbox if user click', () => {
      const { container } = renderRetrieveVulnerabilities();
      const status = container.querySelector('#status');
      const severity = container.querySelector('#severity');

      if (status) {
        const CriticalCheckbox = status?.children[0].querySelector('input');
        if (CriticalCheckbox) {
          fireEvent.click(CriticalCheckbox);
          expect(CriticalCheckbox).not.toBeChecked();
        }
      }

      if (severity) {
        const LowCheckbox = severity?.children[0].querySelector('input');
        if (LowCheckbox) {
          fireEvent.click(LowCheckbox);
          expect(LowCheckbox).not.toBeChecked();
        }
      }
    });
  });

  describe('range', () => {
    test('should be disabled if the date filter is not equal to custom', async () => {
      const { container, getByText } = renderRetrieveVulnerabilities();

      // Ensure "From" and "To" date fields are initially disabled
      ['From', 'To'].forEach((item) => {
        const FromTo = container.querySelector(`#${item.toLowerCase()}Date`);
        expect(FromTo).toBeDisabled();
        expect(FromTo).toHaveTextContent('');
      });

      // Get the dropdown and simulate opening it
      const dateRange = container.querySelector('#dateRange');
      expect(dateRange).toHaveTextContent('All'); // Ensure initial state

      if (dateRange) {
        fireEvent.click(dateRange);
        let customOption = getByText('Last Hour');
        fireEvent.click(customOption);

        await waitFor(() => {
          expect(dateRange).toHaveTextContent('Last Hour'); // Ensure dropdown updates
        });

        // Ensure "From" and "To" fields are now enabled
        ['From', 'To'].forEach((item) => {
          const FromTo = container.querySelector(`#${item.toLowerCase()}Date`);
          expect(FromTo).toBeDisabled();
        });

        fireEvent.click(dateRange);
        customOption = getByText('Last Day');
        fireEvent.click(customOption);

        await waitFor(() => {
          expect(dateRange).toHaveTextContent('Last Day'); // Ensure dropdown updates
        });

        // Ensure "From" and "To" fields are now enabled
        ['From', 'To'].forEach((item) => {
          const FromTo = container.querySelector(`#${item.toLowerCase()}Date`);
          const FromToSlots = container.querySelector(
            `#${item.toLowerCase()}Slots`
          );
          expect(FromTo).toBeDisabled();
          expect(FromToSlots).toHaveTextContent('');
        });
      }
    });
    test('should be enabled if the date filt er is custom', async () => {
      const { container, getByText } = renderRetrieveVulnerabilities();

      const dateRange = container.querySelector('#dateRange');
      expect(dateRange).toHaveTextContent('All');

      if (dateRange) {
        fireEvent.click(dateRange);
        const customOption = getByText('Custom');
        fireEvent.click(customOption);

        await waitFor(() => {
          expect(dateRange).toHaveTextContent('Custom');
        });

        ['From', 'To'].forEach((item) => {
          const FromTo = container.querySelector(`#${item.toLowerCase()}Date`);
          const FromToSlots = container.querySelector(
            `#${item.toLowerCase()}Slots`
          );
          expect(FromTo).toBeEnabled();
          expect(FromToSlots).not.toHaveTextContent('');
        });
      }
    });
  });

  describe('session meta data diabled/enabled', () => {
    test('should checked first radio button', () => {
      const { container } = renderRetrieveVulnerabilities();
      const NoneRadio = container.querySelector('#radio-none-radio');
      const CustomSessionRadio = container.querySelector(
        '#radio-custom-session-radio'
      );
      const MostRecentSessionRadio = container.querySelector(
        '#radio-most-recent-session-radio'
      );
      if (NoneRadio) {
        expect(NoneRadio).toBeEnabled();
      }

      expect(CustomSessionRadio).not.toBeEnabled();
      expect(MostRecentSessionRadio).not.toBeEnabled();
    });

    test('should enable the custom session radio if application has custom session data', async () => {
      const { container } = renderRetrieveVulnerabilities();
      const CustomSessionRadio = container.querySelector(
        '#radio-custom-session-radio'
      );
      store.dispatch(
        getCustomSessionMetaData({
          code: 200,
          responseData: [
            {
              id: '41450',
              label: 'Test Run',
              values: [
                {
                  value: '20250131.11',
                  count: 10,
                },
                {
                  value: '20250131.10',
                  count: 2,
                },
                {
                  value: '20250131.12',
                  count: 0,
                },
              ],
            },
          ],
        })
      );

      await waitFor(() => {
        expect(CustomSessionRadio).toBeEnabled();
      });
    });

    test('should show the systemProperty and systemValue dropdowns when the user selects the Custom Session radio button', async () => {
      const { container } = renderRetrieveVulnerabilities(); // Ensure this renders correctly

      const CustomSessionRadio = container.querySelector(
        '#radio-custom-session-radio'
      ) as HTMLInputElement;
      const systemValue = () => container.querySelector('#system-value');
      const systemProperty = () => container.querySelector('#system-property');

      // Mock API response to enable the Custom Session radio button
      store.dispatch(
        getCustomSessionMetaData({
          code: 200,
          responseData: [
            {
              id: '41450',
              label: 'Test Run',
              values: [
                { value: '20250131.11', count: 10 },
                { value: '20250131.10', count: 2 },
                { value: '20250131.12', count: 0 },
              ],
            },
          ],
        })
      );

      await waitFor(() => {
        expect(CustomSessionRadio).toBeEnabled(); // Ensure it is enabled
      });

      // Click the Custom Session radio button
      fireEvent.click(CustomSessionRadio);

      await waitFor(() => {
        expect(CustomSessionRadio).toBeChecked();
        expect(systemProperty()).toBeInTheDocument();
        expect(systemProperty()).toHaveTextContent('Test Run');
        expect(systemValue()).toBeInTheDocument();
        expect(systemValue()).toHaveTextContent('20250131.11');
      });
    });
  });
});
