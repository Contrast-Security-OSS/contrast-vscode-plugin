import { StatusBarItem, window, StatusBarAlignment, commands } from 'vscode';
import { ContrastPanelInstance } from '../commands/ui-commands/webviewHandler';
import {
  CONSTRAST_ASSESS,
  CONSTRAST_SCAN,
  CONTRAST_STATUSBAR_CLICK,
} from './constants/commands';
import { featureController } from './helper';

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
  low: number,
  note: number
) {
  statusBarItem.text = `Critical: ${critical}   High: ${high}   Medium: ${medium}   Low: ${low}   Note: ${note}`;
  statusBarItem.show(); // Ensure it's visible
}

function closeStatusBarItem() {
  if (statusBarItem !== undefined && statusBarItem !== null) {
    statusBarItem.hide();
  }
}

const registerStatusBarCommend = commands.registerCommand(
  CONTRAST_STATUSBAR_CLICK,
  async () => {
    if (ContrastPanelInstance?.resolveWebviewView !== null) {
      if (featureController.getSlot() !== 'none') {
        switch (featureController.getSlot()) {
          case 'scan':
            {
              commands.executeCommand(CONSTRAST_SCAN);
              await new Promise((resolve) => setTimeout(resolve, 300));
              ContrastPanelInstance.activeCurrentFile();
            }
            break;
          case 'assess':
            {
              commands.executeCommand(CONSTRAST_ASSESS);
              await new Promise((resolve) => setTimeout(resolve, 300));
              ContrastPanelInstance.assessActiveCurrentFile();
            }
            break;
        }
      }
    }
  }
);

export {
  initializeStatusBarItem,
  updateStatusBarItem,
  closeStatusBarItem,
  registerStatusBarCommend,
};
