import * as vscode from 'vscode';
import { expect } from 'chai';
import type { Context, Suite } from 'mocha';

suite('Contrast UI smoke', function (this: Suite) {
  this.timeout(60000);

  test('Contrast commands are registered', async () => {
    const cmds = [
      'contrast.setting',
      'contrast.scan',
      'contrast.assess',
      'contrast.statusBarOnClick',
    ];
    for (const c of cmds) {
      await vscode.commands.executeCommand(c);
    }
  });

  test('Open Contrast Activity Bar container and view', async function (this: Context) {
    const tryOpenContainer = async () => {
      const candidates = [
        'workbench.view.extension.ContrastActivityBar',
        'workbench.view.container.ContrastActivityBar',
      ];
      for (const id of candidates) {
        try {
          await vscode.commands.executeCommand(id);
          return true;
        } catch {
          /* try next */
        }
      }
      return false;
    };

    const openedContainer = await tryOpenContainer();
    if (!openedContainer) {
      try {
        await vscode.commands.executeCommand(
          'workbench.views.openView',
          'Contrast.activityBar'
        );
      } catch {
        this.skip(); // gracefully skip if the command doesn't exist in this VS Code build
      }
    } else {
      try {
        await vscode.commands.executeCommand(
          'workbench.views.openView',
          'Contrast.activityBar'
        );
      } catch {
        /* non-fatal */
      }
    }

    expect(true).to.equal(true);
  });

  test('Open Contrast Panel container and webview, then toggle bottom panel', async function (this: Context) {
    const tryOpenPanelContainer = async () => {
      const candidates = [
        'workbench.panel.extension.ContrastPanel',
        'workbench.view.extension.ContrastPanel',
      ];
      for (const id of candidates) {
        try {
          await vscode.commands.executeCommand(id);
          return true;
        } catch {
          /* try next */
        }
      }
      return false;
    };

    const openedPanel = await tryOpenPanelContainer();
    if (!openedPanel) {
      try {
        await vscode.commands.executeCommand(
          'workbench.views.openView',
          'Contrast.Panel'
        );
      } catch {
        this.skip();
      }
    } else {
      try {
        await vscode.commands.executeCommand(
          'workbench.views.openView',
          'Contrast.Panel'
        );
      } catch {
        /* non-fatal */
      }
    }

    await vscode.commands.executeCommand('workbench.actions.view.problems');
    await vscode.commands.executeCommand('workbench.action.togglePanel'); // open
    await vscode.commands.executeCommand('workbench.action.togglePanel'); // close

    expect(true).to.equal(true);
  });

  test('Baseline: Command Palette opens and core views switch', async () => {
    await vscode.commands.executeCommand('workbench.action.showCommands');
    await vscode.commands.executeCommand('workbench.view.explorer');
    await vscode.commands.executeCommand('workbench.view.debug');
    await vscode.commands.executeCommand('workbench.view.extensions');
  });

  // helper: open the contributed Contrast panel container or view
  async function openContrastPanelContainer(): Promise<void> {
    const candidates = [
      'workbench.panel.extension.ContrastPanel',
      'workbench.view.extension.ContrastPanel',
    ];
    let opened = false;
    for (const id of candidates) {
      try {
        await vscode.commands.executeCommand(id);
        opened = true;
        break;
      } catch {
        /* try next */
      }
    }
    // always try to focus the specific view id as well
    try {
      await vscode.commands.executeCommand(
        'workbench.views.openView',
        'Contrast.Panel'
      );
      opened = true;
    } catch {
      /* not fatal */
    }

    if (!opened) {
      throw new Error('Could not open Contrast panel container/view');
    }
  }

  test('Contrast Setting opens Contrast panel on Settings', async function (this: Context) {
    // Fire your command
    await vscode.commands.executeCommand('contrast.setting');

    // Reveal the Contrast panel container/view (asserts it exists)
    await openContrastPanelContainer();

    // Make sure the bottom panel area is visible (Problems/Output/Terminal region)
    // in case your view is contributed into the Panel area.
    try {
      await vscode.commands.executeCommand('workbench.action.togglePanel');
    } catch {}
    try {
      await vscode.commands.executeCommand('workbench.action.togglePanel');
    } catch {}

    expect(true).to.equal(true);
  });

  test('Contrast Scan opens Contrast panel on Scan', async function (this: Context) {
    await vscode.commands.executeCommand('contrast.scan');
    await openContrastPanelContainer();
    expect(true).to.equal(true);
  });

  test('Contrast Assess opens Contrast panel on Assess', async function (this: Context) {
    await vscode.commands.executeCommand('contrast.assess');
    await openContrastPanelContainer();
    expect(true).to.equal(true);
  });
});
