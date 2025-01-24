import { Webview, WebviewView, WebviewViewProvider, window } from 'vscode';
import { PathResolver } from '../../utils/pathResolver';
import { globalExtentionUri } from '..';
import {
  CONSTRAST_PANEL,
  CONTRAST_THEME,
  EXTENTION_COMMANDS,
  WEBVIEW_COMMANDS,
  WEBVIEW_SCREENS,
} from '../../utils/constants/commands';
import { commandHandler } from '../../utils/commandHandler/commandHandlers';
import { localeI18ln } from '../../../l10n';
import { messageHandler } from './messageHandler';
import { CommandResponse, ScreenId } from '../../../common/types';
import { ScanCommandHandler } from '../../utils/commandHandler/scan.handler';

const crypto = require('crypto');

class ContrastPanel implements WebviewViewProvider {
  localWebview!: Webview;
  activeCommand: ScreenId = EXTENTION_COMMANDS.SETTING_SCREEN;

  resolveWebviewView(webviewView: WebviewView): Thenable<void> | void {
    this.localWebview = webviewView.webview;
    webviewView.webview.html = this.templateBundler(webviewView.webview);
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [globalExtentionUri.extensionUri],
    };
    this.init();
    this.onReceiveMessage();

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.init();
      }
    });

    window.onDidChangeActiveTextEditor(async () => {
      const res = await ScanCommandHandler({
        command: WEBVIEW_COMMANDS.SCAN_GET_CURRENTFILE_VUL,
        payload: null,
        screen: WEBVIEW_SCREENS.SCAN,
      });
      this.postMessage(res as CommandResponse);
    });

    window.onDidChangeActiveColorTheme((e) => {
      this.postMessage({
        command: CONTRAST_THEME,
        data: this.contrastTheme(e.kind),
      });
    });
  }

  init() {
    this.postMessage({
      command: CONTRAST_THEME,
      data: this.contrastTheme(window.activeColorTheme.kind),
    });
    this.postMessage({ command: this.activeCommand, data: null });
    this.postMessage({
      command: EXTENTION_COMMANDS.L10N,
      data: localeI18ln.getLocalization(this.activeCommand),
    });
  }

  public onChangeScreen(screenId: ScreenId) {
    this.activeCommand = screenId;
    this.postMessage({ command: EXTENTION_COMMANDS.L10N, data: null });
    this.postMessage({ command: screenId, data: null });
    this.postMessage({
      command: EXTENTION_COMMANDS.L10N,
      data: localeI18ln.getLocalization(screenId),
    });
  }

  public activeCurrentFile() {
    this.postMessage({
      command: EXTENTION_COMMANDS.CURRENT_FILE,
      data: crypto.randomInt(0, 100),
    });
  }

  public activeRetrieveVulnerability() {
    this.postMessage({
      command: EXTENTION_COMMANDS.VULNERABILITY_REPORT,
      data: crypto.randomInt(0, 100),
    });
  }

  postMessage(data: CommandResponse) {
    if (this.localWebview !== null && this.localWebview !== undefined) {
      this.localWebview.postMessage(data);
    } else {
      console.warn('webview not intialized');
    }
  }

  onReceiveMessage() {
    this.localWebview.onDidReceiveMessage(async (event) => {
      const res: CommandResponse | null | undefined =
        await commandHandler(event);
      if (res !== null && res !== undefined) {
        const isHandled = messageHandler(res);
        if (isHandled) {
          this.postMessage(res);
        }
      }
    });
  }

  contrastTheme(theme: number) {
    switch (true) {
      case theme === 1 || theme === 4:
        return 1;
        break;
      case theme === 2 || theme === 3:
        return 2;
      default:
        return 1;
        break;
    }
  }

  templateBundler(webview: Webview) {
    const pathResolver = new PathResolver(webview);
    const reactScript = pathResolver.resolve(['out', 'bundle.js']);
    return `
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                 <script>
      </script>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
            </head>
            <body>
                <div id="root"></div>
                <script src="${reactScript}"></script>
            </body>
            </html>    
        `;
  }
}

const ContrastPanelInstance = new ContrastPanel();

const registerContrastPanel = window.registerWebviewViewProvider(
  CONSTRAST_PANEL,
  ContrastPanelInstance
);

export { ContrastPanelInstance, registerContrastPanel };
