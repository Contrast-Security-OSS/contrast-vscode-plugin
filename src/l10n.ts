import path from 'path';
import * as fs from 'fs';
import { EXTENTION_COMMANDS } from './vscode-extension/utils/constants/commands';
import { LOCAL_LANG, LocalizationJSON, ScreenId } from './common/types';
import { env } from 'vscode';

class l10n {
  private setLocale: LocalizationJSON | null;
  constructor(lang: string) {
    this.setLocale = this.registerLocalization(this.validateLang(lang));
  }

  private readonly validateLang = (lang: string): LOCAL_LANG => {
    switch (lang) {
      case LOCAL_LANG.ENGLISH:
        return LOCAL_LANG.ENGLISH;
      case LOCAL_LANG.JAPAN:
        return LOCAL_LANG.JAPAN;
      default:
        return LOCAL_LANG.ENGLISH;
    }
  };

  private readonly registerLocalization = (
    language: LOCAL_LANG
  ): LocalizationJSON => {
    const filePath = path.join(
      __dirname,
      '..',
      'src',
      'localization',
      `${language}.json`
    );
    if (!fs.existsSync(filePath)) {
      throw new Error(`Localization file not found: ${filePath}`);
    }
    const rawData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(rawData) as LocalizationJSON;
  };

  public changeLang(lang: LOCAL_LANG) {
    this.setLocale = this.registerLocalization(this.validateLang(lang));
  }

  public getLocalization(screenId: ScreenId) {
    switch (screenId) {
      case EXTENTION_COMMANDS.SETTING_SCREEN: {
        return this.setLocale?.['contrastSettings'];
      }
      case EXTENTION_COMMANDS.SCAN_SCREEN: {
        return this.setLocale?.['contrastScan'];
      }
      default:
        return null;
    }
  }

  public getTranslation(keyPath: string): string | undefined {
    const keys = keyPath.split('.');
    /* eslint-disable @typescript-eslint/no-explicit-any */
    let current: any = this.setLocale;
    for (const key of keys) {
      if (current[key] === undefined) {
        return undefined;
      }
      current = current[key];
    }
    return current?.translate;
  }
}

const localeI18ln = new l10n(env.language);
export { l10n, localeI18ln };
