import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
const today = new Date();
// Define the log file path in the application folder
const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
if (workspaceFolder === undefined) {
  vscode.window.showErrorMessage('No workspace folder found.');
  throw new Error('Workspace folder is not available');
}

const logFilePath = path.join(
  workspaceFolder,
  'application',
  `log_${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}.txt`
);

// Function to log start and end times and number of records
export function logInfo(startTime: Date, endTime: Date, message: string) {
  const logData = `
        Start Time: ${startTime.toISOString()}
        End Time: ${endTime.toISOString()}
        Message: ${message}
    `;
  // Ensure the application folder exists
  const appFolderPath = path.dirname(logFilePath);
  if (!fs.existsSync(appFolderPath)) {
    fs.mkdirSync(appFolderPath, { recursive: true });
  }
  // Write the log data to the file
  fs.appendFileSync(logFilePath, logData + '\n', 'utf8');
}
