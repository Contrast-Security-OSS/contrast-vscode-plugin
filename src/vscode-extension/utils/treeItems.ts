import path from 'path';
import {
  CONSTRAST_ABOUT,
  CONSTRAST_ASSESS,
  CONSTRAST_SCAN,
  CONSTRAST_SETTING,
} from './constants/commands';
import { TreeItem, Uri } from 'vscode';
import { localeI18ln } from '../../l10n';

class ContrastTreeItem extends TreeItem {
  constructor(label: string, command: string = '', icon: string | null = null) {
    super(label);
    if (command !== null) {
      this.command = {
        title: label,
        command: command,
      };
    }
    if (icon !== null && icon !== undefined) {
      const projectRoot = path.resolve(__dirname, '..');
      const iconPath = Uri.file(path.join(projectRoot, 'assets', icon));
      this.iconPath = {
        dark: iconPath,
        light: iconPath,
      };
    }
  }
}

const ContrastNavigationItems: ContrastTreeItem[] = [
  new ContrastTreeItem(
    localeI18ln.getTranslation('contrastItems.about') as string,
    CONSTRAST_ABOUT,
    'information.png'
  ),
  new ContrastTreeItem(
    localeI18ln.getTranslation('contrastItems.settings') as string,
    CONSTRAST_SETTING,
    'settings.png'
  ),
  new ContrastTreeItem(
    localeI18ln.getTranslation('contrastItems.scan') as string,
    CONSTRAST_SCAN,
    'contrast-scan.png'
  ),
  new ContrastTreeItem(
    localeI18ln.getTranslation('contrastItems.assess') as string,
    CONSTRAST_ASSESS,
    'contrast-assess.png'
  ),
];

export { ContrastNavigationItems, ContrastTreeItem };
