import { TextEditor, window } from 'vscode';
import { openVulFile } from './vulnerabilityDecorator';
import {
  getAssessVulnerabilitybyFile,
  getVulnerabilitybyFile,
} from '../api/services/apiService';
import { featureController, getFilePathuri, isNotNull } from './helper';
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
  // const activeTexEditor = await window.showTextDocument(e.document);
  const activeTexEditor = e;
  if (activeTexEditor === undefined || activeTexEditor === null) {
    return;
  }

  const activeFeatureController = featureController.getSlot();

  let fileName = await getFilePathuri(activeTexEditor.document.fileName);
  if (fileName === undefined || fileName === null) {
    closeStatusBarItem();
    return;
  }
  switch (activeFeatureController) {
    case 'scan':
      {
        const vulnerabilities = await getFileFromCache(fileName);
        if (isNotNull(vulnerabilities)) {
          await openVulFile(vulnerabilities as CustomFileVulnerability, 'scan');
        } else {
          closeStatusBarItem();
          window.showWarningMessage(
            `${localeI18ln.getTranslation('persistResponse.vulnerabilityNotFound')}`
          );
        }
      }
      break;
    case 'assess':
      {
        fileName = fileName.substring(fileName.lastIndexOf('/') + 1);
        const vulnerabilities = await getAssessVulnerabilitybyFile(fileName);
        if (
          isNotNull(vulnerabilities) &&
          isNotNull(vulnerabilities?.responseData) &&
          vulnerabilities.code === 200
        ) {
          await openVulFile(
            vulnerabilities.responseData as CustomFileVulnerability,
            'assess'
          );
        } else {
          closeStatusBarItem();
          window.showWarningMessage(
            `${localeI18ln.getTranslation('persistResponse.vulnerabilityNotFound')}`
          );
        }
      }
      break;
  }
  // }
};

export { listofAllVulnerabilities };
