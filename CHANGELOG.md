# Change Log

## [2.0.0] - 2025-05-19

### Added

- Support for Contrast Assess Interactive Application Security Testing (IAST).
- Connect to your Contrast organization and retrieve a list of applications.
- Retrieve vulnerabilities (IAST) and display them in the IDE
- Ability to see which line of code has a vulnerability through clear indicators
- Ability to hover over the affected line of code to see a short description and severity of the vulnerability
- Added indicators on screen of the total number of vulnerabilities, by severity, in the file you have opened
- Filter the list of vulnerabilities retrieved by severity (IAST), Status (IAST) and by session metadata (IAST)
- Set tags (IAST) and change status of a vulnerability (IAST)
- Manually refresh the vulnerabilities of the application.
- Fetch the Vulnerability based on the scheduled duration.
- Contextual Redirection to contrast Teamserver to get additional vulnerability details.
- Restrict retrieval of vulnerabilities for archived projects or applications.

---

## [1.0.0] - 2025-01-06

### Added

- Initial release of **Contrast IDE**, a VS Code extension for scanning the project vulnerabilities.
- Support for code analysis in **Java**, **JavaScript**,**TypeScript**, **C++**, **C#**, **Python**, and **PHP**.
- Compatibility with **Windows** (Windows 11), **Linux** (Ubuntu 22.04.5 LTS) platforms.
- Support for Contrast Scan Static Application Security Testing (SAST) with the following capabilities:
- Connect to your Contrast Organisation and obtain a list of Projects (SAST)
- Retrieve vulnerabilities and display them in the IDE
- To see which line of code has a vulnerability through visual indicators
- To hover over the affected line of code to see a short description and severity of the vulnerability
- On-screen indicators display the total number of vulnerabilities, categorized by severity in the file you have opened
- Filter the list of vulnerabilities retrieved by severity and status
- Ability to connect using multiple set of configurable connection parameters, ensuring flexibility for various endpoints or environments
  - **Contrast URL**
  - **User Name**
  - **Organization ID**
  - **API Key**
  - **Service Key**
- Flexibility for various endpoints in team server environments
- IDE support is currently limited to Visual Studio Code (versions 1.93.0 and above).
