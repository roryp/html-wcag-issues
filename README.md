# HTML WCAG Issues

This project contains a simple HTML file (`index.html`) that intentionally demonstrates common accessibility issues as outlined by the Web Content Accessibility Guidelines (WCAG). The purpose of this project is to provide a clear example of various accessibility problems that can occur in web development.

## WCAG Issues Demonstrated

1. **Low Contrast Text**: The text color does not provide sufficient contrast against the background, making it difficult for users with visual impairments to read.
2. **Missing Alt Text for Images**: Images in the HTML file do not have alternative text attributes, which are essential for screen readers to convey the content of the images to visually impaired users.
3. **Missing Landmarks**: The HTML structure lacks proper landmarks (such as `<header>`, `<nav>`, `<main>`, and `<footer>`), which help users navigate the page more easily.
4. **Improper Use of Headings**: The headings in the document are not used in a hierarchical manner, which can confuse users relying on screen readers to understand the structure of the content.
5. **Missing ARIA Attributes**: The file does not include necessary ARIA (Accessible Rich Internet Applications) attributes that could enhance accessibility for users with disabilities.

This project serves as a resource for developers to understand and identify common accessibility pitfalls in their web applications.

## GitHub Action for Logging Accessibility Issues

We have implemented a GitHub Action that runs accessibility tests using `microsoft/accessibility-insights-action@v2` and logs any identified accessibility issues as GitHub issues. This automated process helps in tracking and addressing accessibility problems efficiently.

The action performs the following steps:
1. Runs the accessibility test on `index.html`.
2. Generates a report and saves it in the `./a11y-reports` directory.
3. Parses the report and creates GitHub issues for each identified accessibility problem.

By using this action, we ensure that accessibility issues are promptly logged and can be addressed in a timely manner.

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
