import * as vscode from 'vscode';

let isOpened: boolean = false;
const toggleContrastPanel = (): void => {
  if (!isOpened) {
    vscode.commands.executeCommand('workbench.action.togglePanel');
  }
  vscode.commands.executeCommand('workbench.view.extension.ContrastPanel');
  isOpened = true;
};

export { toggleContrastPanel };
