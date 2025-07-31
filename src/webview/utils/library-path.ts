/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from 'vscode';
import { LibLanguages } from '../../common/types';
import {
  resolveFailure,
  resolveSuccess,
} from '../../vscode-extension/utils/errorHandling';
import { memoryCache } from '../../vscode-extension/cache/cacheManager';
import { LibraryNode } from '../../vscode-extension/api/model/api.interface';
import {
  findFolderInWorkspace,
  getFilePathuri,
} from '../../vscode-extension/utils/helper';
import path from 'path';

const dependencyFilesByLanguage: LibLanguages = {
  java: ['pom.xml', 'build.gradle', 'build.gradle.kts', 'build.sbt'],
  '.net': [
    '.csproj',
    '.fsproj',
    '.vbproj',
    'Directory.Packages.props',
    'packages.config',
  ],
  ruby: ['Gemfile', '.gemspec'],
  python: ['requirements.txt', 'pyproject.toml', 'Pipfile', 'setup.py'],
  php: ['composer.json'],
  go: ['go.mod'],
  node: ['package.json'],
};

function getRelativePath(projectName: string, fsPath: string): string {
  const projectFolder = findFolderInWorkspace(projectName);
  if (projectFolder === undefined || fsPath.length === 0) {
    return '';
  }
  return path.join(projectFolder.uri.fsPath, fsPath);
}

function removeVersionFromLibraryName(
  libraryName: string,
  version: string
): string {
  if (version === undefined || version === null || version.length === 0) {
    return libraryName;
  }
  if (libraryName.includes(version)) {
    const removeVersion = libraryName.replace(version, '').trim();
    if (removeVersion.endsWith('-')) {
      return removeVersion.slice(0, -1).trim();
    }
  }
  return libraryName;
}

export async function checkLibraryInLanguage(
  language: string,
  libraryName: string,
  appId: string,
  hashId: string,
  isUnmapped: boolean = false,
  projectName: string,
  version?: string
) {
  const fileTypes = dependencyFilesByLanguage[language.toLowerCase()];
  if (fileTypes === undefined) {
    return resolveFailure(
      'File type not supported for the selected language',
      400
    );
  }

  const matchedFilePaths: { path: string; link: string }[] = [];
  const excludePattern = `{**/node_modules/**,**/vendor/**,**/__pycache__/**,**/venv/**,**/.venv/**,**/env/**,**/.env/**,**/target/**,**/build/**,**/.dart_tool/**,**/.stack-work/**,**/_build/**,**/deps/**,**/bin/**,**/obj/**}`;
  const libFullName = libraryName;

  for (const fileType of fileTypes) {
    const filePattern = getFilePattern(fileType);

    const files = await vscode.workspace.findFiles(filePattern, excludePattern);
    libraryName = removeVersionFromLibraryName(libFullName, version ?? '');
    if (language.toLocaleLowerCase() === 'java') {
      libraryName = libraryName.replace(/-\d+(\.\d+)*(\.[a-zA-Z]+)?\.jar$/, '');
    } else if (language.toLocaleLowerCase() === '.net') {
      libraryName = libraryName.split('-')[0];
    } else if (language.toLocaleLowerCase() === 'node') {
      libraryName = libraryName.replace(/-\d+(\.\d+)*$/, '');
    }

    //Step 1: Check the content of each file for the library name
    if (files.length > 0) {
      for (const file of files) {
        const fileContent = await vscode.workspace.fs.readFile(file);
        const contentStr = Buffer.from(fileContent).toString('utf8');

        if (isLibraryMatch(contentStr, libraryName)) {
          const filePathUri = (await getFilePathuri(file.fsPath ?? '')) ?? '';
          const path = getRelativePath(projectName, filePathUri);
          if (path.length > 0) {
            matchedFilePaths.push({
              link: path,
              path: projectName + '/' + filePathUri,
            });
          }
        }
      }
    }
  }
  // Step 2: Check for any file in the workspace named after the library

  const fileNameMatches = await vscode.workspace.findFiles(
    `**/${libFullName}`,
    excludePattern,
    10
  );

  if (fileNameMatches.length > 0) {
    for (const file of fileNameMatches) {
      const filePathUri = (await getFilePathuri(file.fsPath ?? '')) ?? '';
      const path = getRelativePath(projectName, filePathUri);
      if (path.length > 0) {
        matchedFilePaths.push({
          link: path,
          path: projectName + '/' + filePathUri,
        });
      }
    }
  }

  const cacheData = await memoryCache.get('library-' + appId);

  cacheData.child.forEach((child: LibraryNode) => {
    if (isUnmapped) {
      child?.child?.forEach((childNode: any) => {
        if (childNode?.overview?.hash === hashId) {
          childNode.path = matchedFilePaths;
        }
      });
    } else if (child?.overview?.hash === hashId) {
      child.path = matchedFilePaths;
    }
  });

  await memoryCache.set('library-' + appId, cacheData);
  return resolveSuccess('Library paths updated successfully', 200, cacheData);
}

function getFilePattern(fileType: string): string {
  const isExactFileName = fileType.includes('.') && !fileType.startsWith('.');
  if (isExactFileName) {
    return `**/${fileType}`;
  }
  const normalized = fileType.startsWith('.')
    ? `*${fileType}`
    : `*.${fileType}`;
  return `**/${normalized}`;
}

function isLibraryMatch(content: string, libraryName: string): boolean {
  return content.includes(libraryName);
}
