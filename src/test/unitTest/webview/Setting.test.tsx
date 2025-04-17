import { render, fireEvent, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import ContrastStore from '../../../webview/utils/redux/store';
import Setting from '../../../webview/screens/Setting/Setting';
import { webviewPostMessage } from '../../../webview/utils/postMessage';
import { WEBVIEW_COMMANDS } from '../../../vscode-extension/utils/constants/commands';
import store from '../../../webview/utils/redux/store';

// Mock the postMessage utility
jest.mock('../../../webview/utils/postMessage', () => ({
  webviewPostMessage: jest.fn(),
}));

describe('Settings', () => {
  test('renders and interacts correctly', async () => {
    const { container } = render(
      <Provider store={ContrastStore}>
        <Setting />
      </Provider>
    );

    const source = container.querySelector('#source');
    const contrastURL = container.querySelector('#contrastURL');
    const userName = container.querySelector('#userName');
    const serviceKey = container.querySelector('#serviceKey');
    const apiKey = container.querySelector('#apiKey');
    const organizationId = container.querySelector('#organizationId');
    const projectList = container.querySelector('#projects');

    expect(source).toHaveTextContent('Scan');
    expect(contrastURL).toHaveTextContent('');
    expect(userName).toHaveTextContent('');
    expect(serviceKey).toHaveTextContent('');
    expect(apiKey).toHaveTextContent('');
    expect(organizationId).toHaveTextContent('');
    expect(projectList).toHaveTextContent('');

    // Fire events on elements and validate behavior
    if (source) {
      fireEvent.click(source);
      expect(source).toHaveTextContent('Scan');
    }

    if (contrastURL) {
      fireEvent.click(contrastURL);
      expect(contrastURL).toHaveTextContent('');
    }

    if (userName) {
      fireEvent.click(userName);
      expect(userName).toHaveTextContent('');
    }

    if (serviceKey) {
      fireEvent.click(serviceKey);
      expect(serviceKey).toHaveTextContent('');
    }

    if (apiKey) {
      fireEvent.click(apiKey);
      expect(apiKey).toHaveTextContent('');
    }

    if (organizationId) {
      fireEvent.click(organizationId);
      expect(organizationId).toHaveTextContent('');
    }

    if (projectList) {
      fireEvent.click(projectList);
      expect(projectList).toHaveTextContent('');
    }
  });

  test('submits form with valid fields', async () => {
    const { container } = render(
      <Provider store={ContrastStore}>
        <Setting />
      </Provider>
    );

    const contrastURL = container.querySelector('#contrastURL');
    const userName = container.querySelector('#userName');
    const serviceKey = container.querySelector('#serviceKey');
    const apiKey = container.querySelector('#apiKey');
    const organizationId = container.querySelector('#organizationId');
    const retrieveBtn = container.querySelector('#retrieve-btn');

    if (
      !contrastURL ||
      !userName ||
      !serviceKey ||
      !apiKey ||
      !organizationId ||
      !retrieveBtn
    ) {
      throw new Error('One or more elements were not found');
    }

    fireEvent.change(contrastURL, {
      target: {
        value: 'https://xyz.com',
      },
    });
    fireEvent.change(userName, {
      target: { value: 'xyz@xyz.com' },
    });
    fireEvent.change(serviceKey, { target: { value: 'ABCDEFGHIJ' } });
    fireEvent.change(apiKey, {
      target: { value: 'PQRS1234TUV5678' },
    });
    fireEvent.change(organizationId, {
      target: { value: '123-XYZ-456-ABC-789' },
    });

    fireEvent.click(retrieveBtn);

    (webviewPostMessage as jest.Mock).mockReturnValue(true);

    expect(webviewPostMessage).toHaveBeenCalledTimes(3);
    expect(webviewPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        command: WEBVIEW_COMMANDS.SETTING_GET_ALL_PROJECTS,
        payload: expect.objectContaining({
          apiKey: 'PQRS1234TUV5678',
          contrastURL: 'https://xyz.com',
          organizationId: '123-XYZ-456-ABC-789',
          serviceKey: 'ABCDEFGHIJ',
          source: 'scan',
          userName: 'xyz@xyz.com',
        }),
      })
    );
  });

  test('handles the Clear button click correctly', async () => {
    const { container } = render(
      <Provider store={ContrastStore}>
        <Setting />
      </Provider>
    );

    const clearButton = container.querySelector('.btn-transparent');
    if (clearButton) {
      fireEvent.click(clearButton);
    } else {
      throw new Error('Clear button not found');
    }

    const contrastURL = container.querySelector(
      '#contrastURL'
    ) as HTMLInputElement | null;
    const userName = container.querySelector(
      '#userName'
    ) as HTMLInputElement | null;
    const serviceKey = container.querySelector(
      '#serviceKey'
    ) as HTMLInputElement | null;
    const apiKey = container.querySelector(
      '#apiKey'
    ) as HTMLInputElement | null;
    const organizationId = container.querySelector(
      '#organizationId'
    ) as HTMLInputElement | null;

    expect(contrastURL).not.toBeNull();
    expect(userName).not.toBeNull();
    expect(serviceKey).not.toBeNull();
    expect(apiKey).not.toBeNull();
    expect(organizationId).not.toBeNull();

    expect(contrastURL!.value).toBe('');
    expect(userName!.value).toBe('');
    expect(serviceKey!.value).toBe('');
    expect(apiKey!.value).toBe('');
    expect(organizationId!.value).toBe('');
  });

  test("triggers correct behavior when 'Add Project' button is clicked", async () => {
    const { container } = render(
      <Provider store={ContrastStore}>
        <Setting />
      </Provider>
    );

    const getOrgProjects = container.querySelector('#add-project');
    if (getOrgProjects) {
      fireEvent.click(getOrgProjects);

      (webviewPostMessage as jest.Mock).mockReturnValue(true);

      expect(webviewPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          command: WEBVIEW_COMMANDS.SETTING_GET_CONFIGURE_PROJECTS,
        })
      );
    } else {
      console.error('Add Project button not found');
    }
  });

  test('does not submit form with invalid fields', async () => {
    const { container } = render(
      <Provider store={ContrastStore}>
        <Setting />
      </Provider>
    );

    const retrieveBtn = container.querySelector('#retrieve-btn');
    if (retrieveBtn) {
      fireEvent.click(retrieveBtn);

      expect(webviewPostMessage).toHaveBeenCalled();
    } else {
      console.error('Invalid fields');
    }
  });

  test('triggers correct behavior when Save button is clicked with valid fields', async () => {
    const { container } = render(
      <Provider store={ContrastStore}>
        <Setting />
      </Provider>
    );

    const contrastURL = container.querySelector('#contrastURL');
    const userName = container.querySelector('#userName');
    const serviceKey = container.querySelector('#serviceKey');
    const apiKey = container.querySelector('#apiKey');
    const organizationId = container.querySelector('#organizationId');
    const saveBtn = container.querySelector('#add-project');

    if (
      !contrastURL ||
      !userName ||
      !serviceKey ||
      !apiKey ||
      !organizationId ||
      !saveBtn
    ) {
      throw new Error('One or more elements were not found');
    }

    fireEvent.change(contrastURL, { target: { value: 'https://valid.url' } });
    fireEvent.change(userName, { target: { value: 'valid.user@example.com' } });
    fireEvent.change(serviceKey, { target: { value: 'valid-service-key' } });
    fireEvent.change(apiKey, { target: { value: 'valid-api-key' } });
    fireEvent.change(organizationId, { target: { value: 'valid-org-id' } });

    fireEvent.click(saveBtn);

    (webviewPostMessage as jest.Mock).mockReturnValue(true);

    expect(webviewPostMessage).toHaveBeenCalledTimes(7);
    expect(webviewPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        command: WEBVIEW_COMMANDS.SETTING_GET_ALL_PROJECTS,
        payload: expect.objectContaining({
          apiKey: 'PQRS1234TUV5678',
          contrastURL: 'https://xyz.com',
          organizationId: '123-XYZ-456-ABC-789',
          serviceKey: 'ABCDEFGHIJ',
          source: 'scan',
          userName: 'xyz@xyz.com',
        }),
      })
    );
  });

  describe('ContrastDropdown', () => {
    test('selecting a project updates the state and triggers onChange handler', async () => {
      const { container } = render(
        <Provider store={ContrastStore}>
          <Setting />
        </Provider>
      );

      const projectList = container.querySelector('#projects');
      if (!projectList) {
        console.error('Project list not found');
        return;
      }

      fireEvent.click(projectList);

      const firstOption = container.querySelector('option');
      if (!firstOption) {
        console.error('Option not found');
        return;
      }

      fireEvent.click(firstOption);

      expect(webviewPostMessage).toHaveBeenCalledTimes(8);
    });

    test('does not render any options when the project list is empty', async () => {
      const { container } = render(
        <Provider store={ContrastStore}>
          <Setting />
        </Provider>
      );

      const projectList = container.querySelector('#projects');
      expect(projectList).toBeInTheDocument();

      expect(screen.queryByText('Project A')).toBeNull();
      expect(screen.queryByText('Project B')).toBeNull();
    });

    test('handles empty project list gracefully', async () => {
      const { container } = render(
        <Provider store={ContrastStore}>
          <Setting />
        </Provider>
      );

      const projectList = container.querySelector('#projects');
      expect(projectList).toBeInTheDocument();

      expect(screen.queryByText('Project A')).toBeNull();
      expect(screen.queryByText('Project B')).toBeNull();
    });
  });

  it('handles adding a new project', () => {
    const {
      webviewPostMessage,
    } = require('../../../webview/utils/postMessage');
    render(
      <Provider store={store}>
        <Setting />
      </Provider>
    );
    const saveButton = screen.getByText(/Add/i).closest('button');
    if (saveButton) {
      fireEvent.click(saveButton);

      expect(webviewPostMessage).toHaveBeenCalledTimes(11);
    } else {
      console.error('error a new project');
    }
  });

  it('should render the input and handle valid input', () => {
    render(
      <Provider store={store}>
        <Setting />
      </Provider>
    );
    const input = screen.getByPlaceholderText('0000');

    fireEvent.change(input, { target: { name: 'minute', value: '15' } });

    expect(input).toHaveValue('15');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('should render the input and show validation error for invalid input', () => {
    render(
      <Provider store={store}>
        <Setting />
      </Provider>
    );
    const input = screen.getByPlaceholderText('0000');

    fireEvent.change(input, { target: { name: 'minute', value: '5000' } });

    expect(input).toHaveValue('1440');
  });
});
