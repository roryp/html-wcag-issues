/**
 * Main application JavaScript
 * Handles common functionality across all pages
 */

// Configuration 
const config = {
  apiEndpoint: 'https://api-example.azurewebsites.net',
  authEnabled: true
};

// DOM elements
const authLink = document.getElementById('auth-link');
const authModal = document.getElementById('auth-modal');
const closeModal = document.querySelector('.close-modal');
const authForm = document.getElementById('auth-form');
const createAccountLink = document.getElementById('create-account');

/**
 * Initialize the application
 */
function initApp() {
  // Check authentication status
  checkAuthStatus();
  
  // Set up event listeners
  setupEventListeners();
  
  // Announce for screen readers when page is fully loaded
  document.addEventListener('DOMContentLoaded', () => {
    announceForScreenReaders('Page loaded');
  });
}

/**
 * Check user authentication status
 */
function checkAuthStatus() {
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    authLink.textContent = 'Account';
    authLink.setAttribute('aria-label', 'Manage your account');
  } else {
    authLink.textContent = 'Sign In';
    authLink.setAttribute('aria-label', 'Sign in or create an account');
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Auth link click
  if (authLink) {
    authLink.addEventListener('click', (e) => {
      e.preventDefault();
      toggleAuthModal();
    });
  }
  
  // Close modal
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      toggleAuthModal(false);
    });
  }
  
  // Handle authentication form submission
  if (authForm) {
    authForm.addEventListener('submit', handleAuth);
  }
  
  // Handle create account link
  if (createAccountLink) {
    createAccountLink.addEventListener('click', (e) => {
      e.preventDefault();
      toggleAuthMode();
    });
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (authModal && e.target === authModal) {
      toggleAuthModal(false);
    }
  });
  
  // Handle keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && authModal && !authModal.hidden) {
      toggleAuthModal(false);
    }
  });
}

/**
 * Toggle authentication modal
 * @param {boolean} show - Whether to show or hide the modal
 */
function toggleAuthModal(show = true) {
  if (!authModal) return;
  
  if (show) {
    authModal.removeAttribute('hidden');
    document.querySelector('#auth-modal input').focus();
    trapFocus(authModal);
  } else {
    authModal.setAttribute('hidden', '');
    authLink.focus();
  }
}

/**
 * Toggle between sign in and create account modes
 */
function toggleAuthMode() {
  const title = document.getElementById('auth-modal-title');
  const submitButton = authForm.querySelector('button[type="submit"]');
  const modeToggle = document.getElementById('create-account');
  
  if (title.textContent === 'Sign In') {
    title.textContent = 'Create Account';
    submitButton.textContent = 'Create Account';
    modeToggle.textContent = 'Sign In';
    modeToggle.setAttribute('aria-label', 'Switch to sign in');
  } else {
    title.textContent = 'Sign In';
    submitButton.textContent = 'Sign In';
    modeToggle.textContent = 'Create Account';
    modeToggle.setAttribute('aria-label', 'Switch to create account');
  }
}

/**
 * Handle authentication form submission
 * @param {Event} e - Form submit event
 */
function handleAuth(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const isSignIn = document.getElementById('auth-modal-title').textContent === 'Sign In';
  
  // Show loading state
  const submitButton = authForm.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner"></span>';
  
  // Mock authentication - replace with actual API calls
  setTimeout(() => {
    const success = true; // Mock success for demo
    
    if (success) {
      // Store token
      localStorage.setItem('auth_token', 'mock_token_123');
      
      // Update UI
      authLink.textContent = 'Account';
      toggleAuthModal(false);
      
      // Announce success
      announceForScreenReaders(isSignIn ? 'Signed in successfully' : 'Account created successfully');
    } else {
      // Show error - would come from API in real implementation
      alert(isSignIn ? 'Sign in failed. Please check your credentials.' : 'Account creation failed. Please try again.');
    }
    
    // Reset button
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }, 1500);
}

/**
 * Make announcement for screen readers
 * @param {string} message - Message to announce
 */
function announceForScreenReaders(message) {
  let announcer = document.getElementById('sr-announcer');
  
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'sr-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.classList.add('visually-hidden');
    document.body.appendChild(announcer);
  }
  
  announcer.textContent = message;
}

/**
 * Trap focus within a modal
 * @param {HTMLElement} modal - The modal element
 */
function trapFocus(modal) {
  const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  modal.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  });
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
}

/**
 * Handle API errors
 * @param {Error} error - Error object
 */
function handleApiError(error) {
  console.error('API Error:', error);
  announceForScreenReaders('An error occurred. Please try again later.');
}

// Initialize app when scripts are loaded
initApp();