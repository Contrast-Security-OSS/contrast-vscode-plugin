import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Events,
  PaneHeader,
  TreeRow,
  TreeView,
} from '../../../webview/screens/Assess/tabs/VulnerabilityReport/tabs/Events';

jest.mock('../../../webview/utils/postMessage', () => ({
  webviewPostMessage: jest.fn(),
}));

describe('PaneHeader Component', () => {
  const mockOnClick = jest.fn();
  const nodeMock = {
    child: [],
    label: 'Test Node',
    type: 'Creation',
  };

  test('renders PaneHeader with label', () => {
    render(<PaneHeader node={nodeMock} onClick={mockOnClick} show={false} />);
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  test('renders warning icon with correct color', () => {
    render(<PaneHeader node={nodeMock} onClick={mockOnClick} show={false} />);
    const warningIcon = screen.getByTestId('warning-icon');
    expect(warningIcon).toBeInTheDocument();
    expect(warningIcon).toHaveStyle('color: #F78A31');
  });

  test('calls onClick when arrow icon is clicked', () => {
    const nodeWithChildren = { ...nodeMock, child: [{}] };
    render(
      <PaneHeader node={nodeWithChildren} onClick={mockOnClick} show={false} />
    );
    const arrowIcon = screen.getByRole('pane').querySelector('i');
    fireEvent.click(arrowIcon!);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});

describe('TreeRow Component', () => {
  const nodeMock = {
    child: [],
    label: 'Test Node',
    type: 'Creation',
    isRoot: true,
  };

  test('renders TreeRow and expands when clicked', () => {
    render(<TreeRow node={nodeMock} p={10} />);
    const paneHeader = screen.getByText('Test Node');
    fireEvent.click(paneHeader);
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });
});

describe('TreeView Component', () => {
  const treeMock = [{ child: [], label: 'Node 1', type: 'Creation' }];

  test('renders TreeView correctly', () => {
    render(<TreeView tree={treeMock} p={10} />);
    expect(screen.getByText('Node 1')).toBeInTheDocument();
  });
});