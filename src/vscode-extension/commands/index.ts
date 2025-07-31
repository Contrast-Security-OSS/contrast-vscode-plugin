import * as vscode from 'vscode';
import { registerContrastActivityBar } from './ui-commands/openActivityBar';
import { registerContrastPanel } from './ui-commands/webviewHandler';
import { registerSettingsCommand } from './ui-commands/settingsCommand';
import { registerScanCommand } from './ui-commands/scanCommands';
import { PersistenceInstance } from '../utils/persistanceState';
import { initializeLogger } from '../logging/logger';
import { registerRetrieveVulCommand } from './ui-commands/retrieveVulnerabilityCommand';
import {
  featureController,
  libraryPathNavigator,
  slotInstance,
  tabBlocker,
} from '../utils/helper';
import { listofAllVulnerabilities } from '../utils/listofAllVulnerabilities';
import { registerStatusBarCommend } from '../utils/statusBarSeverity';
import { registerAboutWebviewPanel } from './ui-commands/aboutWebviewHandler';
import { SCAN_KEYS, TOKEN } from '../utils/constants/commands';
import { FilterData } from '../../webview/utils/constant';
import { PersistedDTO } from '../../common/types';
import { registerAssessCommand } from './ui-commands/assessCommand';
import { globalConfigChangeListener } from '../utils/multiInstanceConfigSync';
import { LocaleMemoryCacheInstance } from '../utils/localeMemoryCache';

let globalExtentionUri: vscode.ExtensionContext;

const registeredCommands = [
  registerSettingsCommand,
  registerScanCommand,
  registerContrastActivityBar,
  registerContrastPanel,
  registerRetrieveVulCommand,
  registerStatusBarCommend,
  registerAboutWebviewPanel,
  registerAssessCommand,
  globalConfigChangeListener,
];

export async function registerCommands(
  context: vscode.ExtensionContext
): Promise<void> {
  globalExtentionUri = context;
  PersistenceInstance.registerContext(context.globalState);

  tabBlocker();

  vscode.window.onDidChangeActiveTextEditor(async (e) => {
    if (
      e &&
      slotInstance.getSlot() === true &&
      featureController.getSlot() !== 'none' &&
      libraryPathNavigator.getSlot() === true
    ) {
      await listofAllVulnerabilities(e);
    }
  });

  initializeLogger(context);
  context.subscriptions.push(...registeredCommands);

  await LocaleMemoryCacheInstance.setItem(
    TOKEN.SCAN,
    SCAN_KEYS.FILTERS as keyof PersistedDTO,
    FilterData
  );
  await LocaleMemoryCacheInstance.clearStore(TOKEN.ASSESS);
}

export const disposeCommads = () => {
  registeredCommands.map((item) => {
    if (<keyof typeof item>'dispose' in item) {
      item.dispose();
    }
  });
};
export { globalExtentionUri };
