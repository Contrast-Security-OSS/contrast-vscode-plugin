// import { TCommand } from "../../../common/types";
import { CommandRequest, ConfiguredProject } from '../../../common/types';
import { getAllProjectList } from '../../api/services/apiService';
import {
  AddProjectToConfig,
  DeleteConfiguredProjectById,
  GetAllConfiguredProjects,
  UpdateConfiguredProjectById,
} from '../../persistence/PersistenceConfigSetting';
import { WEBVIEW_COMMANDS } from '../constants/commands';
import { tabBlocker } from '../helper';

export const SettingCommandHandler = async (props: CommandRequest) => {
  const { command, payload } = props;
  switch (command) {
    case WEBVIEW_COMMANDS.SETTING_ADD_PROJECT_TO_CONFIGURE: {
      return {
        command: WEBVIEW_COMMANDS.SETTING_ADD_PROJECT_TO_CONFIGURE,
        data: await AddProjectToConfig(payload as ConfiguredProject),
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

    case WEBVIEW_COMMANDS.SETTING_UPDATE_CONFIGURE_PROJECT: {
      if (payload !== null && typeof payload === 'object' && 'id' in payload) {
        return {
          command: WEBVIEW_COMMANDS.SETTING_UPDATE_CONFIGURE_PROJECT,
          data: await UpdateConfiguredProjectById(
            payload.id as string,
            payload as ConfiguredProject
          ),
        };
      }
    }

    case WEBVIEW_COMMANDS.SETTING_DELETE_CONFIGURE_PROJECT: {
      if (payload !== null && typeof payload === 'object' && 'id' in payload) {
        return {
          command: WEBVIEW_COMMANDS.SETTING_DELETE_CONFIGURE_PROJECT,
          data: await DeleteConfiguredProjectById(payload.id as string),
        };
      }
    }
  }
};
