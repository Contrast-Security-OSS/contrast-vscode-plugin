import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { LogLevel } from '../../common/types';
import { extractLastNumber } from '../utils/commonUtil';

const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_LOG_FILES = 10; // Maximum 10 files to keep

export class Logger {
  private logDir!: string;
  private logFileName!: string;
  private logFilePath!: string;

  constructor(private context: vscode.ExtensionContext) {
    const listOfWorkspaceFolder = vscode.workspace;
    if (
      !listOfWorkspaceFolder?.workspaceFolders ||
      listOfWorkspaceFolder.workspaceFolders.length === 0
    ) {
      console.error('Workspace folder not found. Logs cannot be saved.');
      return;
    }
    const workspaceFolder = listOfWorkspaceFolder.workspaceFolders?.[0];

    this.logDir = path.join(
      workspaceFolder.uri.fsPath,
      '.vscode',
      'logs',
      'contrast_scan_vulplugin'
    );
    this.ensureLogDirExists();
    this.logFileName = `contrast_scan_vulplugin-${this.getFormattedDate()}.log`;
    this.logFilePath = path.join(this.logDir, this.logFileName);
    void this.rotateLogs();
  }

  private ensureLogDirExists() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true }); // Create the directory if it doesn't exist
    }
  }

  private getFormattedDate(): string {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
  }

  private async log(
    level: LogLevel,
    message: string,
    metadata?: { size?: string; records?: number; responseTime?: string }
  ): Promise<void> {
    let logEntry = `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] [${level}] - ${message}`;

    if (metadata) {
      const { size, records, responseTime } = metadata;
      const metadataEntries = [];
      if (size !== null && size !== undefined) {
        metadataEntries.push(`Size: ${size}`);
      }
      if (records !== null && records !== undefined) {
        metadataEntries.push(`Records: ${records}`);
      }
      if (responseTime !== null && records !== undefined) {
        metadataEntries.push(`Response Time: ${responseTime}`);
      }

      if (metadataEntries.length > 0) {
        logEntry += ` | ${metadataEntries.join(' | ')}`;
      }
    }

    logEntry += '\n';
    await this.checkLogRotation();
    await fs.promises.appendFile(this.logFilePath, logEntry);
  }

  public async logMessage(
    level: LogLevel,
    message: string,
    metadata?: { size?: string; records?: number; responseTime?: string }
  ): Promise<void> {
    await this.log(level, message, metadata);
  }

  private async checkLogRotation(): Promise<void> {
    try {
      const stats = await fs.promises.stat(this.logFilePath);
      if (stats.size > MAX_LOG_SIZE) {
        await this.rotateLogs();
      }
    } catch {
      console.error('Error checking log file size:');
    }
  }

  private async rotateLogs(): Promise<void> {
    const logFiles = await fs.promises.readdir(this.logDir);
    const currentLogFile = path.join(this.logDir, this.logFileName);
    const logFileRegex = new RegExp(
      `^${this.logFileName.replace(/\.log$/, '')}(_\d+)?\.log$`
    );

    const sortedLogFiles = logFiles
      .filter((file) => logFileRegex.test(file))
      .sort((a, b) => {
        const aNum = extractLastNumber(a);
        const bNum = extractLastNumber(b);
        return aNum - bNum;
      });

    if (fs.existsSync(currentLogFile)) {
      const rotatedLog = path.join(
        this.logDir,
        `${this.logFileName.replace(/\.log$/, '')}_1.log`
      );
      await fs.promises.rename(currentLogFile, rotatedLog);
    }

    for (let i = MAX_LOG_FILES - 1; i > 0; i--) {
      const prevLog = path.join(
        this.logDir,
        `${this.logFileName.replace(/\.log$/, '')}_${i}.log`
      );
      const nextLog = path.join(
        this.logDir,
        `${this.logFileName.replace(/\.log$/, '')}_${i + 1}.log`
      );
      if (fs.existsSync(prevLog)) {
        await fs.promises.rename(prevLog, nextLog);
      }
    }

    if (sortedLogFiles.length > MAX_LOG_FILES) {
      const filesToDelete = sortedLogFiles.slice(MAX_LOG_FILES);
      await Promise.all(
        filesToDelete.map((file) =>
          fs.promises.unlink(path.join(this.logDir, file))
        )
      );
    }
  }
}

// Export the logger instance
let loggerInstance: Logger;

export const initializeLogger = (context: vscode.ExtensionContext) => {
  loggerInstance = new Logger(context);
};

export { loggerInstance };
