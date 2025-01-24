import { CommandRequest } from '../../../common/types';
import { WEBVIEW_SCREENS } from '../constants/commands';
import { ScanCommandHandler } from './scan.handler';
import { SettingCommandHandler } from './setting.handler';

export const commandHandler = async (data: CommandRequest) => {
  const { screen } = data;
  switch (screen) {
    case WEBVIEW_SCREENS.SETTING: {
      return SettingCommandHandler(data);
    }
    case WEBVIEW_SCREENS.SCAN: {
      return ScanCommandHandler(data);
    }
  }
  return null;
};
