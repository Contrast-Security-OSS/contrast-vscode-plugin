import { CommandRequest } from '../../common/types';

declare const acquireVsCodeApi: () => {
  postMessage: (request: CommandRequest) => void;
};

const vscodeApi = acquireVsCodeApi();

const webviewPostMessage = (request: CommandRequest) => {
  if (vscodeApi !== null && vscodeApi !== undefined) {
    vscodeApi.postMessage(request);
  }
};

export { webviewPostMessage };
