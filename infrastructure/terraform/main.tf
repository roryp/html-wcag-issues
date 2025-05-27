# Terraform configuration for Azure Foundry RAG on AWS S3
# main.tf - Main configuration file

# Configure AWS provider
provider "aws" {
  region = var.aws_region
}

# S3 bucket for website hosting
resource "aws_s3_bucket" "website_bucket" {
  bucket = var.website_bucket_name
  tags = {
    Name        = "RAG Website Bucket"
    Environment = var.environment
    Project     = "Azure Foundry RAG"
  }
}

# Configure S3 bucket for website hosting
resource "aws_s3_bucket_website_configuration" "website_configuration" {
  bucket = aws_s3_bucket.website_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

# Set S3 bucket ACL to public-read
resource "aws_s3_bucket_ownership_controls" "website_bucket_ownership" {
  bucket = aws_s3_bucket.website_bucket.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "website_bucket_public_access" {
  bucket = aws_s3_bucket.website_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_acl" "website_bucket_acl" {
  depends_on = [
    aws_s3_bucket_ownership_controls.website_bucket_ownership,
    aws_s3_bucket_public_access_block.website_bucket_public_access,
  ]

  bucket = aws_s3_bucket.website_bucket.id
  acl    = "public-read"
}

# S3 bucket policy to allow public read access
resource "aws_s3_bucket_policy" "website_bucket_policy" {
  bucket = aws_s3_bucket.website_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.website_bucket.arn}/*"
      }
    ]
  })
}

# CloudFront distribution for CDN
resource "aws_cloudfront_distribution" "website_distribution" {
  origin {
    domain_name = aws_s3_bucket.website_bucket.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.website_bucket.bucket}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # Use only North America and Europe

  aliases = var.cloudfront_aliases

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.website_bucket.bucket}"
    viewer_protocol_policy = "redirect-to-https"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.acm_certificate_arn == null ? true : false
    acm_certificate_arn            = var.acm_certificate_arn
    ssl_support_method             = var.acm_certificate_arn == null ? null : "sni-only"
    minimum_protocol_version       = var.acm_certificate_arn == null ? null : "TLSv1.2_2021"
  }

  tags = {
    Name        = "RAG Website CloudFront"
    Environment = var.environment
    Project     = "Azure Foundry RAG"
  }
}

# S3 bucket for document storage
resource "aws_s3_bucket" "document_bucket" {
  bucket = var.document_bucket_name
  tags = {
    Name        = "RAG Document Bucket"
    Environment = var.environment
    Project     = "Azure Foundry RAG"
  }
}

# Configure document bucket for secure access
resource "aws_s3_bucket_public_access_block" "document_bucket_public_access" {
  bucket = aws_s3_bucket.document_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket for application logs
resource "aws_s3_bucket" "logs_bucket" {
  bucket = var.logs_bucket_name
  tags = {
    Name        = "RAG Logs Bucket"
    Environment = var.environment
    Project     = "Azure Foundry RAG"
  }
}

# API Gateway for backend services
resource "aws_api_gateway_rest_api" "api" {
  name        = "rag-api-${var.environment}"
  description = "API Gateway for Azure Foundry RAG application"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "RAG API Gateway"
    Environment = var.environment
    Project     = "Azure Foundry RAG"
  }
}

# API Gateway resource for chat endpoint
resource "aws_api_gateway_resource" "chat_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "chat"
}

# API Gateway method for chat endpoint
resource "aws_api_gateway_method" "chat_post_method" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.chat_resource.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id

  request_parameters = {
    "method.request.header.Content-Type" = true
  }
}

# API Gateway authorizer using Cognito
resource "aws_api_gateway_authorizer" "cognito_authorizer" {
  name          = "cognito-authorizer"
  rest_api_id   = aws_api_gateway_rest_api.api.id
  type          = "COGNITO_USER_POOLS"
  provider_arns = [aws_cognito_user_pool.user_pool.arn]
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "api_deployment" {
  depends_on = [
    aws_api_gateway_method.chat_post_method,
    # Add other methods here as they are created
  ]

  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = var.environment
  
  lifecycle {
    create_before_destroy = true
  }
}

# Lambda function for chat
resource "aws_lambda_function" "chat_lambda" {
  function_name    = "rag-chat-lambda-${var.environment}"
  filename         = "../lambda-package/chat-lambda.zip"
  source_code_hash = filebase64sha256("../lambda-package/chat-lambda.zip")
  handler          = "chat-lambda.handler"
  runtime          = "nodejs16.x"
  timeout          = 30
  memory_size      = 512
  role             = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      AZURE_FOUNDRY_ENDPOINT = var.azure_foundry_endpoint
      AZURE_SEARCH_ENDPOINT  = var.azure_search_endpoint
      AZURE_SEARCH_INDEX     = var.azure_search_index
      DYNAMO_TABLE           = aws_dynamodb_table.conversations_table.name
    }
  }

  tags = {
    Name        = "RAG Chat Lambda"
    Environment = var.environment
    Project     = "Azure Foundry RAG"
  }
}

# Lambda function for document upload
resource "aws_lambda_function" "document_upload_lambda" {
  function_name    = "rag-document-upload-lambda-${var.environment}"
  filename         = "../lambda-package/document-upload-lambda.zip"
  source_code_hash = filebase64sha256("../lambda-package/document-upload-lambda.zip")
  handler          = "document-upload-lambda.handler"
  runtime          = "nodejs16.x"
  timeout          = 60
  memory_size      = 512
  role             = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      S3_BUCKET_NAME = aws_s3_bucket.document_bucket.bucket
      SQS_QUEUE_URL  = aws_sqs_queue.document_processing_queue.url
      DYNAMO_TABLE   = aws_dynamodb_table.documents_table.name
      MAX_FILE_SIZE  = "26214400" # 25MB
    }
  }

  tags = {
    Name        = "RAG Document Upload Lambda"
    Environment = var.environment
    Project     = "Azure Foundry RAG"
  }
}

# IAM role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "rag-lambda-role-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name        = "RAG Lambda Role"
    Environment = var.environment
    Project     = "Azure Foundry RAG"
  }
}

# IAM policy for Lambda functions
resource "aws_iam_policy" "lambda_policy" {
  name        = "rag-lambda-policy-${var.environment}"
  description = "Policy for RAG Lambda functions"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.document_bucket.arn,
          "${aws_s3_bucket.document_bucket.arn}/*"
        ]
      },
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Effect = "Allow"
        Resource = [
          aws_dynamodb_table.conversations_table.arn,
          aws_dynamodb_table.documents_table.arn
        ]
      },
      {
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Effect   = "Allow"
        Resource = aws_sqs_queue.document_processing_queue.arn
      }
    ]
  })
}

# Attach policy to IAM role
resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# DynamoDB table for conversations
resource "aws_dynamodb_table" "conversations_table" {
  name           = "rag-conversations-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"
  range_key      = "conversationId"
  
  attribute {
    name = "userId"
    type = "S"
  }
  
  attribute {
    name = "conversationId"
    type = "S"
  }
  
  tags = {
    Name        = "RAG Conversations Table"
    Environment = var.environment
    Project     = "Azure Foundry RAG"
  }
}

# DynamoDB table for documents
resource "aws_dynamodb_table" "documents_table" {
  name           = "rag-documents-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  
  attribute {
    name = "id"
    type = "S"
  }
  
  attribute {
    name = "userId"
    type = "S"
  }
  
  global_secondary_index {
    name               = "UserIdIndex"
    hash_key           = "userId"
    projection_type    = "ALL"
    read_capacity      = 5
    write_capacity     = 5
  }
  
  tags = {
    Name        = "RAG Documents Table"
    Environment = var.environment
    Project     = "Azure Foundry RAG"
  }
}

# SQS queue for document processing
resource "aws_sqs_queue" "document_processing_queue" {
  name                      = "rag-document-processing-${var.environment}"
  message_retention_seconds = 86400
  visibility_timeout_seconds = 300
  
  tags = {
    Name        = "RAG Document Processing Queue"
    Environment = var.environment
    Project     = "Azure Foundry RAG"
  }
}

# Cognito user pool for authentication
resource "aws_cognito_user_pool" "user_pool" {
  name = "rag-user-pool-${var.environment}"
  
  username_attributes      = ["email"]
  auto_verify_attributes   = ["email"]
  
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_uppercase = true
    require_symbols   = false
  }
  
  schema {
    name                = "email"
    attribute_data_type = "String"
    mutable             = true
    required            = true
  }
  
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
  
  tags = {
    Name        = "RAG User Pool"
    Environment = var.environment
    Project     = "Azure Foundry RAG"
  }
}

# Cognito user pool client
resource "aws_cognito_user_pool_client" "user_pool_client" {
  name         = "rag-client-${var.environment}"
  user_pool_id = aws_cognito_user_pool.user_pool.id
  
  generate_secret                      = false
  refresh_token_validity               = 30
  prevent_user_existence_errors        = "ENABLED"
  explicit_auth_flows                  = ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  allowed_oauth_flows_user_pool_client = false
}

# Output values
output "website_url" {
  description = "URL of the S3 website"
  value       = "http://${aws_s3_bucket.website_bucket.website_endpoint}"
}

output "cloudfront_url" {
  description = "URL of the CloudFront distribution"
  value       = "https://${aws_cloudfront_distribution.website_distribution.domain_name}"
}

output "api_url" {
  description = "URL of the API Gateway"
  value       = "${aws_api_gateway_deployment.api_deployment.invoke_url}"
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito user pool"
  value       = aws_cognito_user_pool.user_pool.id
}

output "cognito_app_client_id" {
  description = "ID of the Cognito user pool client"
  value       = aws_cognito_user_pool_client.user_pool_client.id
}