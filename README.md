# HTML WCAG Issues

This project contains a simple HTML file (`index.html`) that intentionally demonstrates common accessibility issues as outlined by the Web Content Accessibility Guidelines (WCAG). The purpose of this project is to provide a clear example of various accessibility problems that can occur in web development.

## WCAG Issues Demonstrated

1. **Low Contrast Text**: The text color does not provide sufficient contrast against the background, making it difficult for users with visual impairments to read.
2. **Missing Alt Text for Images**: Images in the HTML file do not have alternative text attributes, which are essential for screen readers to convey the content of the images to visually impaired users.
3. **Missing Language Attribute**: The HTML file does not specify the language of the content, which can affect screen readers' pronunciation and processing of the text.

This project serves as a resource for developers to understand and identify common accessibility pitfalls in their web applications.

## Development Container

This project includes a development container configuration to provide a consistent development environment. The `devcontainer.json` file sets up a container with Node.js 14 and installs necessary VS Code extensions, including GitHub Copilot and Copilot Chat.

To use the development container:
1. Ensure you have Docker installed.
2. Open the project in Visual Studio Code.
3. When prompted, reopen the project in the container.

The container will automatically install dependencies and set up the development environment.

## Linting for Accessibility Issues

To lint for accessibility issues in `index.html`, you can use the Axe Linter GitHub Action configured in `axe.yml`. This action will run Axe accessibility tests and report any issues found.

## Azure Static Website

This project can be deployed as a static website on Azure Blob Storage. The `azure.yml` GitHub Action workflow automates the deployment process. It uploads `index.html` to Azure Blob Storage and purges the CDN endpoint to ensure the latest version is served.

To set up the Azure deployment:
1. Configure the Azure credentials in your repository secrets.
2. Update the `azure.yml` file with your Azure storage account and CDN details.
3. Push changes to the `main` branch to trigger the deployment workflow.

## GitHub Copilot Install

To install GitHub Copilot, follow these steps:
1. Open Visual Studio Code.
2. Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window.
3. Search for "GitHub Copilot" and click Install.
4. Once installed, you will need to sign in to GitHub to start using Copilot.

## Testing with Accessibility Insights for Web

To test your web application with Accessibility Insights for Web:
1. Install the Accessibility Insights for Web extension from the Chrome Web Store or the Microsoft Edge Add-ons store.
2. Open your web application in the browser.
3. Click on the Accessibility Insights for Web icon in the browser toolbar.Choose **FastPass** to run automated checks or **Assessment** to perform manual tests.

## GitHub Copilot Fixing Accessibility Issues

GitHub Copilot can assist in fixing accessibility issues by suggesting code improvements. When you encounter an accessibility issue in your code, Copilot can provide suggestions for fixing it. For example, if an image is missing alt text, Copilot might suggest adding an appropriate alt attribute.

## Using GitHub Workspaces to Fix All Accessibility Issues

GitHub Workspaces can be used to collaboratively fix accessibility issues in your project. By creating a GitHub Workspace, you can invite team members to work on the project together, track issues, and review pull requests. This collaborative approach can help ensure that all accessibility issues are addressed efficiently.

## How to Signup and Use GitHub Workspaces to Solve Issues

To signup and use GitHub Workspaces to solve issues:
1. Visit the GitHub Workspaces project page: [GitHub Workspaces](https://githubnext.com/projects/copilot-workspace).
2. Follow the instructions to sign up for GitHub Workspaces.
3. Once signed up, create a new workspace for your project.
4. Invite team members to join the workspace.
5. Use the workspace to collaboratively work on fixing accessibility issues, track progress, and review pull requests.
