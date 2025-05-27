/**
 * Chat interface JavaScript
 * Handles the RAG chat functionality
 */

// DOM elements
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');
const recentDocs = document.getElementById('recent-docs');
const sourcesPanel = document.getElementById('sources-panel');

// Chat state
let conversationHistory = [];
let isGenerating = false;

/**
 * Initialize chat functionality
 */
function initChat() {
  // Set up event listeners
  setupChatEventListeners();
  
  // Load recent documents
  loadRecentDocuments();
}

/**
 * Set up chat-specific event listeners
 */
function setupChatEventListeners() {
  // Chat form submission
  if (chatForm) {
    chatForm.addEventListener('submit', handleChatSubmit);
  }
  
  // Textarea input handling (for growing textarea and Enter key submission)
  if (userInput) {
    userInput.addEventListener('input', () => {
      userInput.style.height = 'auto';
      userInput.style.height = userInput.scrollHeight + 'px';
    });
    
    userInput.addEventListener('keydown', (e) => {
      // Submit on Enter (without shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (userInput.value.trim()) {
          chatForm.dispatchEvent(new Event('submit'));
        }
      }
    });
  }
}

/**
 * Handle chat form submission
 * @param {Event} e - Form submission event
 */
function handleChatSubmit(e) {
  e.preventDefault();
  
  const message = userInput.value.trim();
  if (!message || isGenerating) return;
  
  // Add user message to chat
  addMessageToChat('user', message);
  
  // Clear input
  userInput.value = '';
  userInput.style.height = 'auto';
  
  // Add to conversation history
  conversationHistory.push({ role: 'user', content: message });
  
  // Generate response
  generateResponse(message);
}

/**
 * Add a message to the chat interface
 * @param {string} sender - Message sender ('user', 'assistant', or 'system')
 * @param {string} content - Message content
 * @param {boolean} isStreaming - Whether this is a streaming message
 * @returns {HTMLElement} The message element
 */
function addMessageToChat(sender, content, isStreaming = false) {
  // Create message elements
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  // Add appropriate aria roles for accessibility
  if (sender === 'user') {
    messageDiv.setAttribute('aria-label', 'Your message');
  } else if (sender === 'assistant') {
    messageDiv.setAttribute('aria-label', 'Assistant response');
  } else {
    messageDiv.setAttribute('aria-label', 'System message');
  }
  
  // For streaming messages, add an ID for updating later
  if (isStreaming) {
    contentDiv.id = 'streaming-message';
  }
  
  // Parse markdown-like formatting in the content
  contentDiv.innerHTML = parseMessageContent(content);
  
  // Assemble and add to chat
  messageDiv.appendChild(contentDiv);
  chatMessages.appendChild(messageDiv);
  
  // Scroll to the bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  return messageDiv;
}

/**
 * Generate a response using Azure Foundry RAG
 * @param {string} userMessage - The user's message
 */
function generateResponse(userMessage) {
  // Start generating
  isGenerating = true;
  
  // Show thinking indicator
  const systemMessage = addMessageToChat('system', 'Searching knowledge base...', true);
  
  // Mock response generation - replace with actual API call
  setTimeout(() => {
    // Remove thinking indicator
    chatMessages.removeChild(systemMessage);
    
    // Start streaming response
    const assistantMessageElement = addMessageToChat('assistant', 'Based on the documents in the knowledge base...', true);
    const contentDiv = assistantMessageElement.querySelector('.message-content');
    
    // Simulate streaming
    let fullResponse = getSimulatedResponse(userMessage);
    let currentLength = 0;
    const totalLength = fullResponse.length;
    let interval = setInterval(() => {
      // Add a few characters each time
      currentLength += Math.floor(Math.random() * 5) + 3;
      if (currentLength >= totalLength) {
        currentLength = totalLength;
        clearInterval(interval);
        
        // Once completed, show sources and update state
        displaySources(getSimulatedSources());
        isGenerating = false;
        
        // Add to conversation history
        conversationHistory.push({ role: 'assistant', content: fullResponse });
        
        // Announce completion for screen readers
        announceForScreenReaders('Response completed');
      }
      
      // Update content
      contentDiv.innerHTML = parseMessageContent(fullResponse.substring(0, currentLength));
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 50);
  }, 1500);
}

/**
 * Parse message content for basic markdown-like formatting
 * @param {string} content - Raw message content
 * @returns {string} HTML-formatted content
 */
function parseMessageContent(content) {
  // This is a simplified version - in a real app you'd want to use a proper markdown parser
  let formattedContent = content
    // Convert URLs to links
    .replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Convert line breaks to <br>
  formattedContent = formattedContent
    .split('\n')
    .map(line => line.trim() ? line : '<br>')
    .join('<br>');
  
  return formattedContent;
}

/**
 * Load recent documents
 */
function loadRecentDocuments() {
  if (!recentDocs) return;
  
  // Mock data - replace with actual API call
  const documents = [
    { id: 1, name: 'quarterly_report.pdf', uploaded: '2024-05-15T10:30:00Z' },
    { id: 2, name: 'product_specifications.docx', uploaded: '2024-05-14T14:15:00Z' },
    { id: 3, name: 'meeting_notes.txt', uploaded: '2024-05-10T09:45:00Z' }
  ];
  
  if (documents.length > 0) {
    // Clear loading state
    recentDocs.innerHTML = '';
    
    // Add documents to the list
    documents.forEach(doc => {
      const li = document.createElement('li');
      const nameSpan = document.createElement('span');
      nameSpan.textContent = doc.name;
      
      const dateSpan = document.createElement('span');
      dateSpan.className = 'small';
      dateSpan.textContent = formatDate(doc.uploaded);
      
      li.appendChild(nameSpan);
      li.appendChild(document.createElement('br'));
      li.appendChild(dateSpan);
      
      recentDocs.appendChild(li);
    });
  }
}

/**
 * Display sources for the current response
 * @param {Array} sources - List of source references
 */
function displaySources(sources) {
  if (!sourcesPanel) return;
  
  if (sources.length > 0) {
    sourcesPanel.innerHTML = '';
    
    // Add each source
    sources.forEach(source => {
      const sourceDiv = document.createElement('div');
      sourceDiv.className = 'source-item';
      
      const titleDiv = document.createElement('div');
      titleDiv.className = 'source-title';
      titleDiv.textContent = source.title;
      
      const locationDiv = document.createElement('div');
      locationDiv.className = 'source-location';
      locationDiv.textContent = `${source.document} - Page ${source.page}`;
      
      sourceDiv.appendChild(titleDiv);
      sourceDiv.appendChild(locationDiv);
      sourcesPanel.appendChild(sourceDiv);
    });
  } else {
    sourcesPanel.innerHTML = '<p class="empty-state">No specific sources found for this response</p>';
  }
}

/**
 * Get a simulated response for demo purposes
 * @param {string} query - User query
 * @returns {string} Simulated response
 */
function getSimulatedResponse(query) {
  // This is just for demonstration purposes
  const responses = [
    `Based on the documents in the knowledge base, the quarterly financial results showed a 12% increase in revenue compared to the previous quarter. The main growth drivers were the new product line introduced in March and expanded market presence in the APAC region.\n\nThe report highlights the following key metrics:\n\n- Revenue: $24.3M (up 12%)\n- Operating margin: 18.5% (up 2.3%)\n- Customer acquisition cost: $45 (down 5%)\n\nThe strategic investment in cloud infrastructure has resulted in 30% faster processing times for customer transactions.`,
    
    `According to the product specifications document, the Model X7 supports the following protocols:\n\n1. **HTTP/HTTPS**\n2. **WebSocket**\n3. **MQTT** for IoT connectivity\n4. **REST API** with OAuth 2.0 authentication\n\nThe document also mentions that the system has been tested with up to 10,000 concurrent connections with a response time under 200ms. The recommended deployment configuration is detailed on page 23 of the specifications.`,
    
    `The meeting notes from May 10th indicate that the team has decided to prioritize the following features for the next release:\n\n- Enhanced search functionality with semantic understanding\n- Document chunking optimization for better RAG results\n- Integration with Microsoft Teams for collaborative analysis\n\nThe timeline suggests that these features will be deployed in phases starting next month. There was also discussion about potential Azure OpenAI Service pricing changes that might impact the operating costs.`
  ];
  
  // Choose a response based on the query content
  if (query.toLowerCase().includes('financial') || query.toLowerCase().includes('report') || query.toLowerCase().includes('quarter')) {
    return responses[0];
  } else if (query.toLowerCase().includes('product') || query.toLowerCase().includes('specification') || query.toLowerCase().includes('protocol')) {
    return responses[1];
  } else {
    return responses[2];
  }
}

/**
 * Get simulated sources for demo purposes
 * @returns {Array} List of sources
 */
function getSimulatedSources() {
  return [
    { title: 'Financial Performance Analysis', document: 'quarterly_report.pdf', page: 4 },
    { title: 'Market Expansion Strategy', document: 'quarterly_report.pdf', page: 12 },
    { title: 'Product Development Roadmap', document: 'meeting_notes.txt', page: 1 }
  ];
}

// Initialize chat when this script loads
initChat();