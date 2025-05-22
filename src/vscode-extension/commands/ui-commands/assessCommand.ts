import * as vscode from 'vscode';
import { ContrastPanelInstance } from './webviewHandler';
import { toggleContrastPanel } from '../../utils/toggleContrastPanel';
import {
  CONSTRAST_ASSESS,
  EXTENTION_COMMANDS,
} from '../../utils/constants/commands';
import { aboutWebviewPanelInstance } from './aboutWebviewHandler';

const registerAssessCommand = vscode.commands.registerCommand(
  CONSTRAST_ASSESS,
  () => {
    toggleContrastPanel();
    ContrastPanelInstance.onChangeScreen(EXTENTION_COMMANDS.ASSESS_SCREEN);
    aboutWebviewPanelInstance.dispose();
  }
);

export { registerAssessCommand };
