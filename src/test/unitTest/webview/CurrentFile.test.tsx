import { render, screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { webviewPostMessage } from '../../../webview/utils/postMessage';
import { CurrentFileVul } from '../../../webview/screens/Scan/tabs/CurrentFile/CurrentFileVul';
import {
  WEBVIEW_COMMANDS,
  WEBVIEW_SCREENS,
} from '../../../vscode-extension/utils/constants/commands';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../webview/utils/postMessage', () => ({
  webviewPostMessage: jest.fn(),
}));

describe('CurrentFileVul Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should send a postMessage command to get current file vulnerabilities on mount', () => {
    (useSelector as unknown as jest.Mock).mockReturnValueOnce(null);

    render(<CurrentFileVul />);

    expect(webviewPostMessage).toHaveBeenCalledWith({
      command: WEBVIEW_COMMANDS.SCAN_GET_CURRENTFILE_VUL,
      payload: null,
      screen: WEBVIEW_SCREENS.SCAN,
    });
  });

  test('should not render the VulnerabilityReport when no vulnerabilities are available', () => {
    (useSelector as unknown as jest.Mock).mockReturnValue({
      code: 404,
      responseData: [],
    });

    render(<CurrentFileVul />);

    expect(webviewPostMessage).toHaveBeenCalledWith({
      command: 'getCurrentFileVul',
      payload: null,
      screen: 'CONFIGURE_SCAN',
    });

    expect(screen.queryByText('Found 6 issues in 3 file')).toBeNull();
  });
});
