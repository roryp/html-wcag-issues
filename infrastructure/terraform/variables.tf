# variables.tf - Variable definitions for Azure Foundry RAG on AWS

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "website_bucket_name" {
  description = "Name of the S3 bucket for website hosting"
  type        = string
}

variable "document_bucket_name" {
  description = "Name of the S3 bucket for storing documents"
  type        = string
}

variable "logs_bucket_name" {
  description = "Name of the S3 bucket for logs"
  type        = string
}

variable "cloudfront_aliases" {
  description = "Custom domain aliases for CloudFront distribution"
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for CloudFront (optional)"
  type        = string
  default     = null
}

variable "azure_foundry_endpoint" {
  description = "Endpoint URL for Azure AI Foundry"
  type        = string
}

variable "azure_search_endpoint" {
  description = "Endpoint URL for Azure AI Search"
  type        = string
}

variable "azure_search_index" {
  description = "Index name for Azure AI Search"
  type        = string
  default     = "rag-documents"
}