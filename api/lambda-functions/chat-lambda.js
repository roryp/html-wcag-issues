/**
 * AWS Lambda function for RAG chat functionality
 * Integrates with Azure AI Foundry for document retrieval and generation
 */

// Import AWS SDK
const AWS = require('aws-sdk');

// Import axios for making HTTP requests
const axios = require('axios');

// Configuration
const config = {
  azureFoundryEndpoint: process.env.AZURE_FOUNDRY_ENDPOINT,
  azureFoundryKey: process.env.AZURE_FOUNDRY_KEY,
  azureSearchEndpoint: process.env.AZURE_SEARCH_ENDPOINT,
  azureSearchKey: process.env.AZURE_SEARCH_KEY,
  azureSearchIndex: process.env.AZURE_SEARCH_INDEX,
  azureOpenAIModel: process.env.AZURE_OPENAI_MODEL || 'gpt-4',
  dynamoTable: process.env.DYNAMO_TABLE || 'ragapp-conversations'
};

// Initialize DynamoDB client
const dynamoDB = new AWS.DynamoDB.DocumentClient();

/**
 * Main Lambda handler
 * @param {object} event - API Gateway event
 * @param {object} context - Lambda context
 * @returns {object} Lambda response
 */
exports.handler = async (event, context) => {
  try {
    // Parse request body
    const body = JSON.parse(event.body);
    const { message, conversationId, history = [] } = body;
    
    // Validate input
    if (!message) {
      return createResponse(400, { error: 'Message is required' });
    }
    
    // Get user info from claims
    const claims = event.requestContext?.authorizer?.claims;
    const userId = claims?.sub;
    
    if (!userId) {
      return createResponse(401, { error: 'Unauthorized' });
    }
    
    // Process the conversation
    const result = await processConversation(userId, message, conversationId, history);
    
    // Return the response
    return createResponse(200, result);
  } catch (error) {
    console.error('Error processing request:', error);
    return createResponse(500, { error: 'Internal server error', details: error.message });
  }
};

/**
 * Process the conversation with RAG
 * @param {string} userId - User ID
 * @param {string} message - User message
 * @param {string} conversationId - Conversation ID (optional)
 * @param {Array} history - Conversation history (optional)
 * @returns {object} Response with message, sources, and conversation ID
 */
async function processConversation(userId, message, conversationId, history) {
  // Generate new conversation ID if not provided
  const newConversationId = conversationId || generateConversationId();
  
  // Prepare conversation history
  const conversationHistory = history.length > 0 ? history : [];
  
  // Add user message to history
  conversationHistory.push({
    role: 'user',
    content: message
  });
  
  // Retrieve relevant document chunks from Azure AI Search
  const relevantDocs = await searchRelevantDocuments(message);
  
  // Generate response with Azure OpenAI
  const response = await generateResponse(message, conversationHistory, relevantDocs);
  
  // Add assistant response to history
  conversationHistory.push({
    role: 'assistant',
    content: response.message
  });
  
  // Save conversation to DynamoDB
  await saveConversation(userId, newConversationId, conversationHistory);
  
  // Return the response
  return {
    message: response.message,
    conversationId: newConversationId,
    sources: response.sources
  };
}

/**
 * Search for relevant documents in Azure AI Search
 * @param {string} query - User query
 * @returns {Array} Relevant document chunks
 */
async function searchRelevantDocuments(query) {
  try {
    const response = await axios({
      method: 'post',
      url: `${config.azureSearchEndpoint}/indexes/${config.azureSearchIndex}/docs/search`,
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.azureSearchKey
      },
      data: {
        search: query,
        queryType: 'semantic',
        semanticConfiguration: 'default',
        top: 5,
        vectorQueries: [
          {
            kind: 'text',
            text: query,
            fields: ['embedding'],
            k: 5
          }
        ]
      }
    });
    
    return response.data.value.map(doc => ({
      id: doc.id,
      content: doc.content,
      title: doc.title,
      source: doc.source,
      metadata: {
        pageNumber: doc.pageNumber
      }
    }));
  } catch (error) {
    console.error('Error searching documents:', error);
    return []; // Return empty array on error
  }
}

/**
 * Generate response using Azure OpenAI
 * @param {string} query - User query
 * @param {Array} history - Conversation history
 * @param {Array} documents - Relevant document chunks
 * @returns {object} Generated response with sources
 */
async function generateResponse(query, history, documents) {
  try {
    // Prepare context from relevant documents
    let context = '';
    const sources = [];
    
    if (documents.length > 0) {
      context = 'Information from knowledge base:\n\n';
      
      documents.forEach((doc, i) => {
        context += `[Document ${i + 1}] ${doc.title}\n${doc.content}\n\n`;
        
        // Add to sources
        sources.push({
          documentId: doc.id,
          title: doc.title,
          location: doc.metadata.pageNumber ? `Page ${doc.metadata.pageNumber}` : '',
          excerpt: doc.content.substring(0, 200) + '...'
        });
      });
    }
    
    // Prepare system message with RAG context
    const systemMessage = {
      role: 'system',
      content: `You are an AI assistant that helps users find information in their documents. 
      Answer the user's questions based on the provided document context. 
      If you don't find the answer in the documents, say you don't have that information.
      Always cite your sources by referring to the document titles.
      
      ${context}`
    };
    
    // Prepare messages for OpenAI
    const messages = [systemMessage, ...history];
    
    // Call Azure OpenAI
    const response = await axios({
      method: 'post',
      url: `${config.azureFoundryEndpoint}/openai/deployments/${config.azureOpenAIModel}/chat/completions?api-version=2023-05-15`,
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.azureFoundryKey
      },
      data: {
        messages: messages,
        temperature: 0.7,
        max_tokens: 800
      }
    });
    
    // Extract the assistant's response
    const assistantMessage = response.data.choices[0].message.content;
    
    return {
      message: assistantMessage,
      sources: sources
    };
  } catch (error) {
    console.error('Error generating response:', error);
    return {
      message: 'I apologize, but I encountered an error generating a response. Please try again later.',
      sources: []
    };
  }
}

/**
 * Save conversation to DynamoDB
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation ID
 * @param {Array} history - Conversation history
 */
async function saveConversation(userId, conversationId, history) {
  try {
    await dynamoDB.put({
      TableName: config.dynamoTable,
      Item: {
        userId,
        conversationId,
        history,
        timestamp: new Date().toISOString()
      }
    }).promise();
  } catch (error) {
    console.error('Error saving conversation:', error);
    // Don't fail the request if saving fails
  }
}

/**
 * Generate a unique conversation ID
 * @returns {string} Conversation ID
 */
function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
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