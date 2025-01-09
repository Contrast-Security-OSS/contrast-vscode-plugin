import * as vscode from 'vscode';
import {
  ContrastNavigationItems,
  ContrastTreeItem,
} from '../../utils/treeItems';
import { CONSTRAST_ACTIVITYBAR } from '../../utils/constants/commands';
import { aboutWebviewPanelInstance } from './aboutWebviewHandler';
import { aboutSlotInstance } from '../../utils/helper';

class ContrastActivityBar implements vscode.TreeDataProvider<ContrastTreeItem> {
  data: ContrastTreeItem[] = ContrastNavigationItems;

  constructor() {}

  getChildren(): vscode.ProviderResult<ContrastTreeItem[]> {
    return this.data;
  }

  getTreeItem(element: ContrastTreeItem): ContrastTreeItem {
    return element;
  }
}

const contrastActivityBarProvider = new ContrastActivityBar();
const registerContrastActivityBar = vscode.window.createTreeView(
  CONSTRAST_ACTIVITYBAR,
  { treeDataProvider: contrastActivityBarProvider }
);

registerContrastActivityBar.onDidChangeVisibility(async (event) => {
  if (event.visible) {
    if (aboutSlotInstance.getSlot() === true) {
      await aboutWebviewPanelInstance.init();
      aboutSlotInstance.setSlot(false);
    }
  } else {
    aboutWebviewPanelInstance.dispose();
  }
});

export { registerContrastActivityBar, ContrastTreeItem };
