# Azure Foundry RAG Website Deployment Guide

This guide provides instructions for deploying the Azure Foundry RAG website to AWS S3 and setting up the necessary backend services.

## Prerequisites

Before you begin, ensure you have the following:

1. **AWS Account** with permissions to create:
   - S3 buckets
   - CloudFront distributions
   - Lambda functions
   - API Gateway
   - DynamoDB tables
   - Cognito User Pools
   - IAM roles and policies

2. **Azure Subscription** with access to:
   - Azure AI Foundry
   - Azure OpenAI Service
   - Azure AI Search

3. **Development Tools**:
   - AWS CLI (configured with your credentials)
   - Terraform (for Terraform deployment option)
   - Node.js and npm (for local development)

## Deployment Options

You can deploy this solution using either Terraform or AWS CloudFormation.

### Option 1: Terraform Deployment

1. **Navigate to the Terraform directory**:
   ```bash
   cd infrastructure/terraform
   ```

2. **Create a terraform.tfvars file**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

3. **Edit the variables** in `terraform.tfvars` to match your environment:
   - Set unique S3 bucket names
   - Configure your AWS region
   - Add your Azure Foundry endpoint URLs

4. **Initialize Terraform**:
   ```bash
   terraform init
   ```

5. **Plan the deployment**:
   ```bash
   terraform plan
   ```

6. **Apply the configuration**:
   ```bash
   terraform apply
   ```

7. **Note the outputs** for future reference:
   - Website URL
   - CloudFront URL
   - API URL
   - Cognito User Pool ID
   - Cognito App Client ID

### Option 2: CloudFormation Deployment

1. **Package the Lambda functions**:
   ```bash
   mkdir -p /tmp/lambda-package
   cd api/lambda-functions
   npm install
   zip -r /tmp/lambda-package/chat-lambda.zip chat-lambda.js node_modules
   zip -r /tmp/lambda-package/document-upload-lambda.zip document-upload-lambda.js node_modules
   ```

2. **Create an S3 bucket for CloudFormation resources** (if you don't already have one):
   ```bash
   aws s3 mb s3://my-cloudformation-resources
   ```

3. **Upload Lambda packages to S3**:
   ```bash
   aws s3 cp /tmp/lambda-package/chat-lambda.zip s3://my-cloudformation-resources/lambda-package/
   aws s3 cp /tmp/lambda-package/document-upload-lambda.zip s3://my-cloudformation-resources/lambda-package/
   ```

4. **Deploy with CloudFormation**:
   ```bash
   aws cloudformation create-stack \
     --stack-name azure-foundry-rag \
     --template-body file://infrastructure/cloudformation/template.yaml \
     --parameters \
       ParameterKey=Environment,ParameterValue=dev \
       ParameterKey=WebsiteBucketName,ParameterValue=my-rag-website \
       ParameterKey=DocumentBucketName,ParameterValue=my-rag-documents \
       ParameterKey=AzureFoundryEndpoint,ParameterValue=https://my-azure-foundry.openai.azure.com \
       ParameterKey=AzureSearchEndpoint,ParameterValue=https://my-azure-search.search.windows.net \
       ParameterKey=AzureSearchIndex,ParameterValue=rag-documents \
     --capabilities CAPABILITY_NAMED_IAM
   ```

5. **Monitor the deployment**:
   ```bash
   aws cloudformation describe-stacks --stack-name azure-foundry-rag
   ```

## Azure AI Configuration

### Set up Azure AI Search

1. Create an Azure AI Search instance in your Azure portal
2. Create a search index for your documents
3. Configure the vectorization settings for the search index

### Set up Azure AI Foundry

1. Create an Azure AI Foundry instance
2. Deploy the OpenAI model you want to use (e.g., GPT-4)
3. Create API keys for your application

## Website Deployment

After configuring the infrastructure, deploy the website files to your S3 bucket:

```bash
# Build the website (minify files if needed)
# In a real project, you might have a build step here

# Upload the files to S3
aws s3 sync . s3://my-rag-website \
  --exclude "infrastructure/*" \
  --exclude "api/*" \
  --exclude "docs/*" \
  --exclude ".git/*" \
  --exclude ".github/*" \
  --exclude "node_modules/*" \
  --exclude ".gitignore" \
  --exclude "README.md"
```

## Environment Configuration

Update the application configuration to use your deployed services:

1. **For local development**, create a `.env` file:
   ```
   AZURE_FOUNDRY_ENDPOINT=https://your-azure-foundry.openai.azure.com
   AZURE_SEARCH_ENDPOINT=https://your-azure-search.search.windows.net
   AZURE_SEARCH_INDEX=rag-documents
   ```

2. **For production**, update the environment variables in your deployed Lambda functions using the AWS Console or CLI.

## Testing

1. Open the CloudFront URL in your browser
2. Create a user account using the Sign Up form
3. Upload a test document
4. Ask questions about the document to verify RAG functionality

## Monitoring and Maintenance

- Monitor your AWS services using CloudWatch
- Set up alerts for high usage or errors
- Regularly update your Azure OpenAI models as new versions become available

## Security Considerations

- Ensure your S3 bucket policies are correctly configured
- Review and update IAM permissions regularly
- Implement proper CORS settings for your API Gateway
- Use environment variables for all sensitive configuration
- Consider implementing Web Application Firewall (WAF) for additional protection

## Troubleshooting

If you encounter issues during deployment:

- Check CloudWatch Logs for Lambda function errors
- Verify that your Azure AI services are correctly configured and accessible
- Ensure that CORS is properly configured for API Gateway
- Validate that S3 bucket permissions allow public read access for website content
- Check that your Cognito User Pool is correctly integrated with your frontend

## Support

For additional support:
- Review the AWS and Azure documentation
- Check Stack Overflow for common issues
- Contact Azure support for AI Foundry specific questions

---

For more detailed information on the architecture and components, please refer to the main [README.md](../README.md) file.