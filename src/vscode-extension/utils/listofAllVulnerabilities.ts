import { TextEditor, window } from 'vscode';
import { openVulFile } from './vulnerabilityDecorator';
import { getVulnerabilitybyFile } from '../api/services/apiService';
import { getFilePathuri } from './helper';
import { localeI18ln } from '../../l10n';
import { closeStatusBarItem } from './statusBarSeverity';
import { CustomFileVulnerability } from '../../common/types';

async function getFileFromCache(
  filePath: string
): Promise<null | CustomFileVulnerability> {
  const res = await getVulnerabilitybyFile(filePath);

  if (res.code === 200) {
    return res.responseData as CustomFileVulnerability;
  }
  return null;
}

const listofAllVulnerabilities = async (e: TextEditor) => {
  if (e === undefined || e === null) {
    return;
  }
  const activeTexEditor = await window.showTextDocument(e.document);
  if (activeTexEditor === undefined || activeTexEditor === null) {
    return;
  }

  const fileName = getFilePathuri(activeTexEditor.document.fileName);
  if (fileName !== null && fileName !== undefined) {
    const vulnerabilities = await getFileFromCache(fileName);
    if (vulnerabilities !== null && vulnerabilities !== undefined) {
      await openVulFile(vulnerabilities as CustomFileVulnerability);
    } else {
      closeStatusBarItem();
      window.showWarningMessage(
        `${localeI18ln.getTranslation('persistResponse.vulnerabilityNotFound')}`
      );
    }
  } else {
    closeStatusBarItem();
  }
  // }
};

export { listofAllVulnerabilities };
