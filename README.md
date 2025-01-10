By integrating the Contrast Security Visual Studio Code extension into your IDE you are able to quickly map vulnerabilities to your source code directly at the file and line number by importing your last vulnerability scan data, with actionable information on each of the vulnerabilities found

The IDE plugin provides these **features**:

- **Comprehensive vulnerability analysis:** The extension allows you to connect your IDE to the Contrast Platform and analyze scanned repositories directly within the IDE. View vulnerability summaries at the file and line level, highlighting risks and providing short remediation guidance. Follow links to the Contrast Platform for detailed how-to-fix information, including insights from Secure Code Warrior.

- **Broad language and framework support:** Contrast Security covers commonly supported languages.

### Steps to build and package the Contrast VSCode Plugin:

- Clone the VS Code plugin repository
- Open the cloned project directory in VSCode
- Install dependencies using npm in the terminal by running **npm install**
- Build the Project by running **npm run build** in the terminal
- Package the plugin using vsce (Visual Studio Code Extension Manager). If not installed, first install vsce by running the command **npm install -g @vscode/vsce**
- Run the build command **vsce package** to generate the .vsix file

### Steps to install plugin via VSCode Marketplace:

- Open VS Code.
- Go to the Extensions view (Ctrl+Shift+X).
- Search for Contrast and Click on it to view more details.
- Now Click on the install button on the extension’s page.
- Restart the VSCode if required after installing the Contrast extension. (Optional)

### Steps to manually Install the VS Code Plugin:

- Launch Visual Studio Code on your system.
- Go to the Extensions view (Ctrl+Shift+X).
- Click the ellipsis (⋮) in the top-right corner and select Install from VSIX…
- Navigate to the location of the .vsix file and select it.
