import { render, screen, fireEvent } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { AllVulnerabilityFiles } from '../../../webview/screens/Scan/tabs/AllVulnerability/AllVulnerabilityFiles';
import { webviewPostMessage } from '../../../webview/utils/postMessage';
import {
  WEBVIEW_COMMANDS,
  WEBVIEW_SCREENS,
} from '../../../vscode-extension/utils/constants/commands';
import {
  PaneHeader,
  VulnerabilityReport,
} from '../../../webview/components/Scan/Vulnerability/VulnerabilityReport';
import { allProjectVul } from '../../../webview/utils/constant';
import { childNode, parentNode } from '../../mocks/testMock';
import { ProjectVulnerability } from '../../../common/types';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../webview/utils/postMessage', () => ({
  webviewPostMessage: jest.fn(),
}));

const vulnerabilityData: ProjectVulnerability[] = [
  {
    level: 0,
    label: 'Vulnerability A',
    issuesCount: 0,
    filesCount: 0,
    child: [
      {
        level: 2,
        label: 'Vulnerability B',
        issuesCount: 1,
        filePath: '',
        fileType: '',
      },
    ],
  },
];

describe('AllVulnerabilityFiles Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send a postMessage command to get all vulnerabilities on mount', () => {
    (useSelector as unknown as jest.Mock).mockReturnValueOnce(null);

    render(<AllVulnerabilityFiles />);

    expect(webviewPostMessage).toHaveBeenCalledWith({
      command: 'getAllFilesVulnerability',
      payload: null,
      screen: WEBVIEW_SCREENS.SCAN,
    });
  });

  it('should render the vulnerability report with tree data', () => {
    render(<VulnerabilityReport treeData={vulnerabilityData} />);

    expect(screen.getByText('Vulnerability A')).toBeInTheDocument();
  });

  it('should render the correct color for CRITICAL severity', () => {
    const node = {
      severity: 'CRITIlightgrayCAL',
      label: 'Test Vulnerability',
      issuesCount: 1,
      lineNumber: 10,
    };

    render(<PaneHeader node={node} onClick={() => {}} show={false} />);

    const severityIcon = screen.getByTestId('warning-icon');
    expect(severityIcon).toHaveStyle('color: red');
  });

  it('should render the correct color for HIGH severity', () => {
    const node = {
      severity: 'HIGH',
      label: 'Test Vulnerability',
      issuesCount: 1,
      lineNumber: 10,
    };

    render(<PaneHeader node={node} onClick={() => {}} show={false} />);

    const severityIcon = screen.getByTestId('warning-icon');
    expect(severityIcon).toHaveStyle('color: orange');
  });

  it('should render the correct color for MEDIUM severity', () => {
    const node = {
      severity: 'MEDIUM',
      label: 'Test Vulnerability',
      issuesCount: 1,
      lineNumber: 10,
    };

    render(<PaneHeader node={node} onClick={() => {}} show={false} />);

    const severityIcon = screen.getByTestId('warning-icon');
    expect(severityIcon).toHaveStyle('color: yellow');
  });

  it('should render the correct color for LOW severity', () => {
    const node = {
      severity: 'LOW',
      label: 'Test Vulnerability',
      issuesCount: 1,
      lineNumber: 10,
    };

    render(<PaneHeader node={node} onClick={() => {}} show={false} />);

    const severityIcon = screen.getByTestId('warning-icon');
    expect(severityIcon).toHaveStyle('color: gray');
  });

  it('should render the correct color for NOTE severity', () => {
    const node = {
      severity: 'NOTE',
      label: 'Test Vulnerability',
      issuesCount: 1,
      lineNumber: 10,
    };

    render(<PaneHeader node={node} onClick={() => {}} show={false} />);

    const severityIcon = screen.getByTestId('warning-icon');
    expect(severityIcon).toHaveStyle('color: lightgray');
  });

  it('should update the state when getAllVulFromState contains a valid response', () => {
    const mockVulState = {
      code: 200,
      responseData: allProjectVul,
    };
    (useSelector as unknown as jest.Mock).mockReturnValueOnce(mockVulState);

    render(<AllVulnerabilityFiles />);
  });

  describe('PaneHeader Component', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should send a postMessage with the correct payload when clicked (level 1)', () => {
      const handleClick = jest.fn();

      render(
        <PaneHeader
          node={childNode}
          parentNode={undefined}
          onClick={handleClick}
          show={true}
        />
      );

      const label = screen.getByText('Replace this use of console.log');
      fireEvent.click(label);

      expect(webviewPostMessage).toHaveBeenCalledWith({
        command: WEBVIEW_COMMANDS.SCAN_OPEN_VULNERABILITY_FILE,
        payload: {
          ...childNode,
          scrollToLine: false,
        },
        screen: WEBVIEW_SCREENS.SCAN,
      });
    });

    it('should send a postMessage with the correct payload when clicked (level 0)', () => {
      const handleClick = jest.fn();

      render(
        <PaneHeader
          node={childNode}
          parentNode={parentNode}
          onClick={handleClick}
          show={true}
        />
      );

      const label = screen.getByText('Replace this use of console.log');
      fireEvent.click(label);

      expect(webviewPostMessage).toHaveBeenCalledWith({
        command: WEBVIEW_COMMANDS.SCAN_OPEN_VULNERABILITY_FILE,
        payload: {
          ...childNode,
          fileName: parentNode.label,
          fileType: parentNode.fileType,
          filePath: parentNode.filePath,
          child: parentNode.child,
          scrollToLine: true,
        },
        screen: WEBVIEW_SCREENS.SCAN,
      });
    });
  });
});
