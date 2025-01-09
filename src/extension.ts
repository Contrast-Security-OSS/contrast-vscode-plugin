import * as vscode from 'vscode';
import { disposeCommads, registerCommands } from './vscode-extension/commands';
import * as dotenv from 'dotenv';
import { disposeCache } from './vscode-extension/cache/cacheManager';

export function activate(context: vscode.ExtensionContext) {
  dotenv.config();
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  registerCommands(context);
}

export async function deactivate() {
  disposeCommads();
  await disposeCache();
}
