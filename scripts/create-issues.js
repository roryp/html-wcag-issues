const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

const reportDir = './a11y-reports';
const token = process.env.GITHUB_TOKEN;
const octokit = new Octokit({ auth: token });

async function createIssue(title, body) {
  try {
    await octokit.issues.create({
      owner: 'roryp',
      repo: 'html-wcag-issues',
      title: title,
      body: body,
    });
    console.log(`Issue created: ${title}`);
  } catch (error) {
    console.error(`Error creating issue: ${title}`, error);
  }
}

function parseReport(filePath) {
  const report = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  report.issues.forEach(issue => {
    const title = issue.description;
    const body = `**Description:** ${issue.description}\n**Help URL:** ${issue.helpUrl}\n**Element Path:** ${issue.elementPath}`;
    createIssue(title, body);
  });
}

function processReports() {
  fs.readdir(reportDir, (err, files) => {
    if (err) {
      console.error('Error reading report directory', err);
      return;
    }
    files.forEach(file => {
      const filePath = path.join(reportDir, file);
      parseReport(filePath);
    });
  });
}

processReports();
