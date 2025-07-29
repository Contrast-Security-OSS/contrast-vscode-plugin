import { CommandRequest, ConfiguredProject } from '../../../common/types';
import {
  getAllApplicationsByOrgId,
  getAllProjectList,
} from '../../api/services/apiService';
import {
  AddProjectToConfig,
  DeleteConfiguredProjectById,
  GetAllConfiguredProjects,
  UpdateConfiguredProjectById,
} from '../../persistence/PersistenceConfigSetting';
import { WEBVIEW_COMMANDS, WEBVIEW_SCREENS } from '../constants/commands';
import { closeActiveFileHightlighting, tabBlocker } from '../helper';
import {
  assessBackgroundVulBehaviour,
  scanRetrievelBlocker,
  settingActionsBehaviour,
  updateGlobalWebviewConfig,
} from '../multiInstanceConfigSync';

export const SettingCommandHandler = async (props: CommandRequest) => {
  const { command, payload } = props;
  switch (command) {
    case WEBVIEW_COMMANDS.SETTING_ADD_PROJECT_TO_CONFIGURE: {
      await scanRetrievelBlocker.disable();
      await settingActionsBehaviour.disable();
      const response = await AddProjectToConfig(payload as ConfiguredProject);
      await scanRetrievelBlocker.enable();
      await updateGlobalWebviewConfig(
        WEBVIEW_SCREENS.SETTING,
        WEBVIEW_COMMANDS.SETTING_ADD_PROJECT_TO_CONFIGURE
      );
      await settingActionsBehaviour.enable();
      return {
        command: WEBVIEW_COMMANDS.SETTING_ADD_PROJECT_TO_CONFIGURE,
        data: response,
      };
    }
    case WEBVIEW_COMMANDS.SETTING_GET_CONFIGURE_PROJECTS: {
      return {
        command: WEBVIEW_COMMANDS.SETTING_GET_CONFIGURE_PROJECTS,
        data: await GetAllConfiguredProjects(),
      };
    }

    case WEBVIEW_COMMANDS.SETTING_GET_ALL_PROJECTS: {
      tabBlocker(false);
      const listOfProjects = await getAllProjectList(
        payload as ConfiguredProject
      );
      tabBlocker(true);
      return {
        command: WEBVIEW_COMMANDS.SETTING_GET_ALL_PROJECTS,
        data: listOfProjects,
      };
    }

    // New
    case WEBVIEW_COMMANDS.SETTING_GET_ALL_APPLICATIONS: {
      tabBlocker(false);
      const listOfProjects = await getAllApplicationsByOrgId(
        payload as ConfiguredProject
      );
      tabBlocker(true);
      return {
        command: WEBVIEW_COMMANDS.SETTING_GET_ALL_APPLICATIONS,
        data: listOfProjects,
      };
    }

    case WEBVIEW_COMMANDS.SETTING_UPDATE_CONFIGURE_PROJECT: {
      if (payload !== null && typeof payload === 'object' && 'id' in payload) {
        tabBlocker(false);
        await scanRetrievelBlocker.disable();
        await settingActionsBehaviour.disable();
        await assessBackgroundVulBehaviour.disable();
        await closeActiveFileHightlighting();

        const update = await UpdateConfiguredProjectById(
          payload.id as string,
          payload as ConfiguredProject
        );
        await scanRetrievelBlocker.enable();
        await assessBackgroundVulBehaviour.enable();
        await settingActionsBehaviour.enable();
        tabBlocker(true);
        return {
          command: WEBVIEW_COMMANDS.SETTING_UPDATE_CONFIGURE_PROJECT,
          data: update,
        };
      }
    }

    case WEBVIEW_COMMANDS.SETTING_DELETE_CONFIGURE_PROJECT: {
      if (payload !== null && typeof payload === 'object' && 'id' in payload) {
        await settingActionsBehaviour.disable();
        await scanRetrievelBlocker.disable();
        if (payload.source === 'assess') {
          await assessBackgroundVulBehaviour.disable();
        }
        const data = await DeleteConfiguredProjectById(
          payload.id as string,
          payload
        );
        await scanRetrievelBlocker.enable();
        await settingActionsBehaviour.enable();
        await updateGlobalWebviewConfig(
          WEBVIEW_SCREENS.SETTING,
          WEBVIEW_COMMANDS.SETTING_DELETE_CONFIGURE_PROJECT,
          'assessApplicationReload'
        );
        await assessBackgroundVulBehaviour.enable();

        return {
          command: WEBVIEW_COMMANDS.SETTING_DELETE_CONFIGURE_PROJECT,
          data: data,
        };
      }
    }
  }
};
