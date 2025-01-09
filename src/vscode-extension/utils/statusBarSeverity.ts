import { StatusBarItem, window, StatusBarAlignment, commands } from 'vscode';
import { ContrastPanelInstance } from '../commands/ui-commands/webviewHandler';
import { CONSTRAST_SCAN, CONTRAST_STATUSBAR_CLICK } from './constants/commands';

// --------------- Global variables -----------------------
let statusBarItem: StatusBarItem;

// Status Methods ------------------------------

// Initialize StatusBarItem
function initializeStatusBarItem() {
  if (statusBarItem === undefined || statusBarItem === null) {
    statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right);
    statusBarItem.text = 'Critical: 0   High: 0   Medium: 0   Low: 0'; // Default values
    statusBarItem.show();
    statusBarItem.command = CONTRAST_STATUSBAR_CLICK;
    statusBarItem.command;
  }
}

// Function to update StatusBarItem with severity counts
function updateStatusBarItem(
  critical: number,
  high: number,
  medium: number,
  low: number
) {
  statusBarItem.text = `Critical: ${critical}   High: ${high}   Medium: ${medium}   Low: ${low}`;
  statusBarItem.show(); // Ensure it's visible
}

function closeStatusBarItem() {
  if (statusBarItem !== undefined && statusBarItem !== null) {
    statusBarItem.hide();
  }
}

const registerStatusBarCommend = commands.registerCommand(
  CONTRAST_STATUSBAR_CLICK,
  () => {
    if (ContrastPanelInstance?.resolveWebviewView !== null) {
      commands.executeCommand(CONSTRAST_SCAN);
      ContrastPanelInstance.activeCurrentFile();
    }
  }
);

export {
  initializeStatusBarItem,
  updateStatusBarItem,
  closeStatusBarItem,
  registerStatusBarCommend,
};
