import { window, ViewColumn, WebviewPanel, commands, Uri } from 'vscode';
import { CONSTRAST_ABOUT } from '../../utils/constants/commands';
import { globalExtentionUri } from '..';
import { PathResolver } from '../../utils/pathResolver';
import { getPackageInformation } from '../../api/services/apiService';
import { PackageInfo } from '../../../common/types';

let webviewPanel: WebviewPanel | undefined;
let instanceCount: number = 0;

class AboutWebviewPanel {
  constructor() {}

  async init() {
    if (webviewPanel && instanceCount > 0) {
      webviewPanel.reveal(ViewColumn.One);
      return;
    }

    instanceCount += 1;

    webviewPanel = window.createWebviewPanel(
      CONSTRAST_ABOUT,
      'About',
      ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [globalExtentionUri.extensionUri],
      }
    );

    webviewPanel.onDidDispose(() => {
      instanceCount--;
      webviewPanel = undefined;
    });

    this.setWebviewIcon();
    await this.render();
  }

  private setWebviewIcon(): void {
    webviewPanel !== null && webviewPanel !== undefined
      ? (webviewPanel.iconPath = Uri.joinPath(
          globalExtentionUri.extensionUri,
          'assets',
          'CS_logo_white_bg.jpg'
        ))
      : null;
  }

  private async tabular(): Promise<string | null> {
    const packageInformation = await getPackageInformation();

    if (packageInformation !== null && packageInformation !== undefined) {
      const { code, responseData } = packageInformation;
      const {
        IDEVersion,
        aboutPage,
        displayName,
        osWithVersion,
        platform,
        version,
      } = responseData as PackageInfo;

      if (code === 200 && responseData !== null && responseData !== undefined) {
        return `
                    <h3 class="about-header">
                        Contrast Plugin
                    </h3>
                    <div class="indent">
                        <table>
                            <tr>
                                <td>Plugin Name</td>
                                <td>${displayName}</td>
                            </tr>

                            <tr>
                                <td>Plugin Release Version</td>
                                <td>${version}</td>
                            </tr>

                            <tr>
                                <td>IDE Version</td>
                                <td>${IDEVersion}</td>
                            </tr>
                            <tr>
                                <td>OS Version</td>
                                <td>${osWithVersion}</td>
                            </tr>
                  
                            <tr>
                                <td>Platform</td>
                                <td>${platform}</td>
                            </tr>
                        </table>
                    </div>
                    <hr>
                    <h3 class="about-header">
                        ${aboutPage.title}
                    </h3>
                    <div class="indent">
                        ${aboutPage.content}
                    </div>
                `;
      }
    }
    return null;
  }

  private async template(): Promise<string> {
    let stylePath: Uri | undefined;

    if (webviewPanel) {
      const pathResolver = new PathResolver(webviewPanel.webview);
      stylePath = pathResolver.resolve(['src', 'styles', 'about.css']);
    }

    return `
            <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
                    ${stylePath ? `<link rel="stylesheet" href="${stylePath}" />` : ''}
                </head>
                <body>
                    ${await this.tabular()}
                </body>
            </html>
        `;
  }

  private async render(): Promise<void> {
    if (webviewPanel) {
      webviewPanel.webview.html = await this.template();
    }
  }

  public dispose() {
    if (webviewPanel) {
      webviewPanel.dispose();
    }
  }
}

const aboutWebviewPanelInstance = new AboutWebviewPanel();
export const registerAboutWebviewPanel = commands.registerCommand(
  CONSTRAST_ABOUT,
  async () => {
    await aboutWebviewPanelInstance.init();
  }
);

export { aboutWebviewPanelInstance };
