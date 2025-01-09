import { Uri, Webview } from 'vscode';
import { globalExtentionUri } from '../commands';

class PathResolver {
  rootPath!: Webview;

  constructor(resource: Webview) {
    this.rootPath = resource;
  }

  public resolve(segments: string[]) {
    return this.rootPath.asWebviewUri(
      Uri.joinPath(globalExtentionUri.extensionUri, ...segments)
    );
  }
}

export { PathResolver };
