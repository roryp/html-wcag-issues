# Azure Foundry RAG Website for AWS S3

This project provides a complete RAG (Retrieval-Augmented Generation) solution using Azure AI Foundry for backend AI capabilities and AWS S3 for static website hosting. It demonstrates a modern approach to building AI-powered knowledge base applications.

## Features

- **Chat Interface**: Interactive chat UI for querying documents using natural language
- **Document Upload**: Support for uploading PDF, DOCX, and TXT files to the knowledge base
- **Semantic Search**: Advanced search capabilities across uploaded documents
- **Citation Support**: Responses include references to source documents
- **Responsive Design**: Mobile-friendly interface that works across devices
- **Secure Authentication**: User management with sign-up and login functionality

## Architecture

The solution combines Azure AI services with AWS infrastructure:

- **Frontend**: HTML5, CSS3, and JavaScript static website hosted on AWS S3
- **Backend**: Serverless AWS Lambda functions with API Gateway
- **AI Engine**: Azure AI Foundry for document processing and RAG capabilities
- **Vector Storage**: Azure AI Search for efficient semantic retrieval
- **Authentication**: AWS Cognito for user management
- **Document Storage**: AWS S3 for document storage
- **Infrastructure as Code**: Terraform and CloudFormation templates for deployment

## Getting Started

### Prerequisites

- AWS Account with permissions for S3, CloudFront, API Gateway, Lambda, DynamoDB, and Cognito
- Azure Subscription with access to Azure AI Foundry and Azure AI Search
- Node.js and npm for local development
- Terraform (optional) for IaC deployment

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/roryp/html-wcag-issues.git
   cd html-wcag-issues
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Open the project in a web browser:
   ```bash
   open index.html
   ```

### Deployment

For deployment instructions, see the [Deployment Guide](docs/deployment-guide.md).

## File Structure

```
/
├── index.html (main chat interface)
├── upload.html (document upload page)
├── search.html (knowledge base search)
├── css/
│   ├── main.css
│   └── components.css
├── js/
│   ├── app.js
│   ├── chat.js
│   ├── upload.js
│   └── search.js
├── api/
│   ├── lambda-functions/
│   └── api-spec.yaml
├── infrastructure/
│   ├── terraform/
│   └── cloudformation/
└── docs/
    ├── README.md
    └── deployment-guide.md
```

## Accessibility

This project follows WCAG 2.1 AA guidelines to ensure accessibility:

- Semantic HTML structure with appropriate landmarks
- ARIA attributes for interactive elements
- Keyboard navigation support
- Sufficient color contrast
- Screen reader compatibility
- Focus management for modals and dynamic content

## Development Container

This project includes a development container configuration to provide a consistent development environment. The `devcontainer.json` file sets up a container with Node.js and installs necessary VS Code extensions.

To use the development container:
1. Ensure you have Docker installed.
2. Open the project in Visual Studio Code.
3. When prompted, reopen the project in the container.

## CI/CD and GitHub Actions

This repository includes GitHub Actions workflows for automated deployment:

- The `azure.yml` workflow can be adapted for deploying to AWS S3 instead of Azure Blob Storage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Useful Resources

- [Azure AI Foundry Documentation](https://learn.microsoft.com/azure/ai-services/openai/)
- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS CloudFormation User Guide](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html)
- [Lambda Function Handler in Node.js](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html)
- [Vector Embeddings for RAG Applications](https://learn.microsoft.com/azure/search/vector-search-overview)
