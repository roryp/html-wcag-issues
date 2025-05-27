/**
 * AWS Lambda function for document upload and processing
 * Handles file upload to S3 and triggers document processing pipeline
 */

// Import AWS SDK
const AWS = require('aws-sdk');

// Import multipart parser
const parser = require('lambda-multipart-parser');

// Configuration
const config = {
  bucketName: process.env.S3_BUCKET_NAME || 'ragapp-documents',
  processingQueue: process.env.SQS_QUEUE_URL,
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 25 * 1024 * 1024, // 25MB
  dynamoTable: process.env.DYNAMO_TABLE || 'ragapp-documents',
  allowedTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
};

// Initialize AWS services
const s3 = new AWS.S3();
const sqs = new AWS.SQS();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

/**
 * Main Lambda handler
 * @param {object} event - API Gateway event
 * @param {object} context - Lambda context
 * @returns {object} Lambda response
 */
exports.handler = async (event, context) => {
  try {
    // Parse multipart form data
    const formData = await parser.parse(event);
    
    // Validate user authentication
    const claims = event.requestContext?.authorizer?.claims;
    const userId = claims?.sub;
    
    if (!userId) {
      return createResponse(401, { error: 'Unauthorized' });
    }
    
    // Validate file
    if (!formData.files || formData.files.length === 0) {
      return createResponse(400, { error: 'No file uploaded' });
    }
    
    const file = formData.files[0];
    
    // Validate file size
    if (file.content.length > config.maxFileSize) {
      return createResponse(413, { error: 'File too large, maximum size is 25MB' });
    }
    
    // Validate file type
    if (!isValidFileType(file)) {
      return createResponse(400, { error: 'Invalid file type, supported formats: PDF, DOCX, TXT' });
    }
    
    // Parse metadata
    const metadata = {};
    if (formData.metadata) {
      try {
        const parsedMetadata = JSON.parse(formData.metadata);
        Object.assign(metadata, parsedMetadata);
      } catch (e) {
        console.warn('Invalid metadata format, ignoring');
      }
    }
    
    // Process the file
    const result = await processFile(userId, file, metadata);
    
    // Return success response
    return createResponse(201, result);
  } catch (error) {
    console.error('Error processing request:', error);
    return createResponse(500, { error: 'Internal server error', details: error.message });
  }
};

/**
 * Process uploaded file
 * @param {string} userId - User ID
 * @param {object} file - Uploaded file
 * @param {object} metadata - File metadata
 * @returns {object} Processing result
 */
async function processFile(userId, file, metadata = {}) {
  // Generate document ID
  const documentId = generateDocumentId();
  
  // Determine file type
  const fileType = getFileType(file);
  
  // Generate S3 key
  const s3Key = `${userId}/${documentId}/${file.filename}`;
  
  // Upload to S3
  await s3.upload({
    Bucket: config.bucketName,
    Key: s3Key,
    Body: file.content,
    ContentType: file.contentType,
    Metadata: {
      userId,
      documentId,
      originalName: file.filename,
      ...Object.fromEntries(Object.entries(metadata).map(([k, v]) => {
        // S3 metadata values must be strings
        return [k, typeof v === 'string' ? v : JSON.stringify(v)];
      }))
    }
  }).promise();
  
  // Create document record
  const document = {
    id: documentId,
    userId,
    filename: file.filename,
    type: fileType,
    size: file.content.length,
    title: metadata.title || file.filename,
    uploaded: new Date().toISOString(),
    status: 'processing',
    s3Key,
    metadata
  };
  
  // Save to DynamoDB
  await dynamoDB.put({
    TableName: config.dynamoTable,
    Item: document
  }).promise();
  
  // Queue for processing
  await sqs.sendMessage({
    QueueUrl: config.processingQueue,
    MessageBody: JSON.stringify({
      documentId,
      userId,
      s3Key,
      fileType,
      timestamp: new Date().toISOString()
    })
  }).promise();
  
  // Return document info to client
  return {
    id: document.id,
    filename: document.filename,
    type: document.type,
    size: document.size,
    title: document.title,
    uploaded: document.uploaded,
    status: document.status
  };
}

/**
 * Check if the file type is valid
 * @param {object} file - File object
 * @returns {boolean} Whether the file type is valid
 */
function isValidFileType(file) {
  // Check MIME type
  if (config.allowedTypes.includes(file.contentType)) {
    return true;
  }
  
  // Check file extension
  const extension = file.filename.split('.').pop().toLowerCase();
  return ['pdf', 'docx', 'txt'].includes(extension);
}

/**
 * Get normalized file type
 * @param {object} file - File object
 * @returns {string} File type (pdf, docx, txt)
 */
function getFileType(file) {
  const extension = file.filename.split('.').pop().toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'docx':
    case 'doc':
      return 'docx';
    case 'txt':
    default:
      return 'txt';
  }
}

/**
 * Generate a unique document ID
 * @returns {string} Document ID
 */
function generateDocumentId() {
  return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Create API Gateway response
 * @param {number} statusCode - HTTP status code
 * @param {object} body - Response body
 * @returns {object} Formatted response
 */
function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
    },
    body: JSON.stringify(body)
  };
}