import * as vscode from 'vscode';
import { disposeCommads, registerCommands } from './vscode-extension/commands';
import { disposeCache } from './vscode-extension/cache/cacheManager';

export async function activate(context: vscode.ExtensionContext) {
  await registerCommands(context);
}

export async function deactivate() {
  disposeCommads();
  await disposeCache();
}
