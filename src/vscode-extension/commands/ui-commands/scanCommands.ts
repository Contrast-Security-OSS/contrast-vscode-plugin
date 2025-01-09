import * as vscode from 'vscode';
import { ContrastPanelInstance } from './webviewHandler';
import { toggleContrastPanel } from '../../utils/toggleContrastPanel';
import {
  CONSTRAST_SCAN,
  EXTENTION_COMMANDS,
} from '../../utils/constants/commands';
import { aboutWebviewPanelInstance } from './aboutWebviewHandler';

const registerScanCommand = vscode.commands.registerCommand(
  CONSTRAST_SCAN,
  () => {
    toggleContrastPanel();
    ContrastPanelInstance.onChangeScreen(EXTENTION_COMMANDS.SCAN_SCREEN);
    aboutWebviewPanelInstance.dispose();
  }
);

export { registerScanCommand };
