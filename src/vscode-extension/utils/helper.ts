import { commands } from 'vscode';
import { getOpenedFolderName } from './commonUtil';
import { SETTING_KEYS, TAB_BLOCKER, TOKEN } from './constants/commands';
import { PersistenceInstance } from './persistanceState';
import { ConfiguredProject, PersistedDTO } from '../../common/types';
import path from 'path';

function createSlots(): {
  getSlot: () => boolean;
  setSlot: (slot: boolean) => void;
} {
  let slot: boolean = true;

  return {
    getSlot: () => slot,
    setSlot: (newSlot) => {
      slot = newSlot;
    },
  };
}

const slotInstance = createSlots();
const aboutSlotInstance = createSlots();
const loopBreaker = createSlots();

function getFilePathuri(fileName: string) {
  const pathParts = fileName.split(path.sep);
  const startIndex = pathParts.indexOf(getOpenedFolderName() as string);
  if (startIndex > 0) {
    fileName = pathParts.slice(startIndex + 1).join(path.sep);
    return fileName;
  }
  return undefined;
}

const getProjectIdByName = (projectName: string) => {
  const persistedData = PersistenceInstance.getByKey(
    TOKEN.SETTING,
    SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
  ) as ConfiguredProject[];

  const project = persistedData.find(
    (project: ConfiguredProject) => project.projectName === projectName
  );

  return project;
};

const tabBlocker = (enable: boolean = true) => {
  commands.executeCommand('setContext', TAB_BLOCKER, enable);
};
export {
  slotInstance,
  getFilePathuri,
  getProjectIdByName,
  aboutSlotInstance,
  tabBlocker,
  loopBreaker,
};
