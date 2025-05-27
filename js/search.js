/**
 * Search functionality JavaScript
 * Handles the knowledge base search functionality
 */

// DOM elements
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const clearFiltersButton = document.getElementById('clear-filters');
const paginationContainer = document.getElementById('pagination');
const currentPageElement = document.getElementById('current-page');
const totalPagesElement = document.getElementById('total-pages');
const prevPageButton = document.querySelector('.pagination-prev');
const nextPageButton = document.querySelector('.pagination-next');

// Search state
let currentPage = 1;
let totalPages = 1;
let currentQuery = '';
let currentFilters = {
  type: [],
  date: 'all'
};

/**
 * Initialize search functionality
 */
function initSearch() {
  // Set up event listeners
  setupSearchEventListeners();
  
  // Check URL for search params
  checkUrlParams();
}

/**
 * Set up search-specific event listeners
 */
function setupSearchEventListeners() {
  // Search form submission
  if (searchForm) {
    searchForm.addEventListener('submit', handleSearchSubmit);
  }
  
  // Clear filters button
  if (clearFiltersButton) {
    clearFiltersButton.addEventListener('click', clearFilters);
  }
  
  // Filter change events
  const typeCheckboxes = document.querySelectorAll('input[name="type"]');
  typeCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', applyFilters);
  });
  
  const dateRadios = document.querySelectorAll('input[name="date"]');
  dateRadios.forEach(radio => {
    radio.addEventListener('change', applyFilters);
  });
  
  // Pagination controls
  if (prevPageButton) {
    prevPageButton.addEventListener('click', () => changePage(currentPage - 1));
  }
  
  if (nextPageButton) {
    nextPageButton.addEventListener('click', () => changePage(currentPage + 1));
  }
}

/**
 * Check URL for search parameters
 */
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q');
  
  if (query) {
    // Set search input value
    if (searchInput) searchInput.value = query;
    
    // Get filter params
    const type = urlParams.getAll('type');
    const date = urlParams.get('date') || 'all';
    
    // Set filter values
    type.forEach(t => {
      const checkbox = document.getElementById(`type-${t}`);
      if (checkbox) checkbox.checked = true;
    });
    
    const dateRadio = document.getElementById(`date-${date}`);
    if (dateRadio) dateRadio.checked = true;
    
    // Store current filters
    currentFilters = { type, date };
    
    // Perform search
    performSearch(query, 1);
  }
}

/**
 * Handle search form submission
 * @param {Event} e - Form submission event
 */
function handleSearchSubmit(e) {
  e.preventDefault();
  
  const query = searchInput.value.trim();
  if (!query) return;
  
  // Get selected filters
  updateCurrentFilters();
  
  // Update URL
  updateSearchUrl(query);
  
  // Perform search
  performSearch(query, 1);
}

/**
 * Update current filters from form elements
 */
function updateCurrentFilters() {
  // Get selected document types
  const typeCheckboxes = document.querySelectorAll('input[name="type"]:checked');
  const typeValues = Array.from(typeCheckboxes).map(checkbox => checkbox.value);
  
  // Get selected date range
  const dateRadio = document.querySelector('input[name="date"]:checked');
  const dateValue = dateRadio ? dateRadio.value : 'all';
  
  // Update current filters
  currentFilters = {
    type: typeValues,
    date: dateValue
  };
}

/**
 * Update the URL with current search parameters
 * @param {string} query - Search query
 */
function updateSearchUrl(query) {
  const url = new URL(window.location);
  url.searchParams.set('q', query);
  
  // Clear existing type params
  url.searchParams.delete('type');
  
  // Add type filters
  currentFilters.type.forEach(type => {
    url.searchParams.append('type', type);
  });
  
  // Add date filter
  if (currentFilters.date !== 'all') {
    url.searchParams.set('date', currentFilters.date);
  } else {
    url.searchParams.delete('date');
  }
  
  // Update URL without reloading page
  window.history.pushState({}, '', url);
}

/**
 * Perform search with query and filters
 * @param {string} query - Search query
 * @param {number} page - Page number
 */
function performSearch(query, page = 1) {
  if (!searchResults) return;
  
  // Store current query
  currentQuery = query;
  currentPage = page;
  
  // Show loading state
  searchResults.innerHTML = '<p class="search-status">Searching...</p>';
  
  // Announce for screen readers
  announceForScreenReaders('Searching for ' + query);
  
  // Mock search results - replace with actual API call
  setTimeout(() => {
    const results = getSimulatedResults(query, currentFilters, page);
    displaySearchResults(results, page);
  }, 1000);
}

/**
 * Display search results
 * @param {Object} results - Search results object
 * @param {number} page - Current page number
 */
function displaySearchResults(results, page) {
  if (!searchResults) return;
  
  // Store pagination info
  totalPages = results.totalPages;
  currentPage = page;
  
  // Clear results container
  searchResults.innerHTML = '';
  
  // Handle no results
  if (results.items.length === 0) {
    const noResults = document.createElement('p');
    noResults.className = 'search-status';
    noResults.textContent = 'No results found.';
    searchResults.appendChild(noResults);
    
    // Hide pagination
    if (paginationContainer) paginationContainer.setAttribute('hidden', '');
    
    // Announce for screen readers
    announceForScreenReaders('No search results found');
    return;
  }
  
  // Create results heading
  const resultsHeading = document.createElement('h3');
  resultsHeading.textContent = `${results.totalItems} results found`;
  searchResults.appendChild(resultsHeading);
  
  // Add each result
  results.items.forEach(result => {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    
    const resultTitle = document.createElement('div');
    resultTitle.className = 'result-title';
    resultTitle.textContent = result.title;
    
    const resultSnippet = document.createElement('div');
    resultSnippet.className = 'result-snippet';
    resultSnippet.innerHTML = result.snippet;
    
    const resultMeta = document.createElement('div');
    resultMeta.className = 'result-meta';
    
    const docType = document.createElement('span');
    docType.textContent = `${result.type.toUpperCase()} Document`;
    
    const docDate = document.createElement('span');
    docDate.textContent = formatDate(result.date);
    
    resultMeta.appendChild(docType);
    resultMeta.appendChild(docDate);
    
    resultItem.appendChild(resultTitle);
    resultItem.appendChild(resultSnippet);
    resultItem.appendChild(resultMeta);
    
    searchResults.appendChild(resultItem);
  });
  
  // Update pagination
  updatePaginationUI(results.totalPages);
  
  // Announce for screen readers
  announceForScreenReaders(`${results.totalItems} search results found. Page ${page} of ${results.totalPages}`);
}

/**
 * Update pagination UI
 * @param {number} totalPages - Total number of pages
 */
function updatePaginationUI(totalPages) {
  if (!paginationContainer) return;
  
  // Show/hide pagination based on results
  if (totalPages <= 1) {
    paginationContainer.setAttribute('hidden', '');
    return;
  } else {
    paginationContainer.removeAttribute('hidden');
  }
  
  // Update page numbers
  if (currentPageElement) currentPageElement.textContent = currentPage;
  if (totalPagesElement) totalPagesElement.textContent = totalPages;
  
  // Enable/disable pagination buttons
  if (prevPageButton) prevPageButton.disabled = currentPage <= 1;
  if (nextPageButton) nextPageButton.disabled = currentPage >= totalPages;
}

/**
 * Change to a different results page
 * @param {number} page - Page number to navigate to
 */
function changePage(page) {
  if (page < 1 || page > totalPages) return;
  
  // Scroll to top of results
  window.scrollTo({
    top: searchResults.offsetTop - 100,
    behavior: 'smooth'
  });
  
  // Perform search with new page number
  performSearch(currentQuery, page);
}

/**
 * Apply filters to current search
 */
function applyFilters() {
  // Update current filters
  updateCurrentFilters();
  
  // Update URL
  updateSearchUrl(currentQuery);
  
  // Re-run search with current query and filters
  if (currentQuery) {
    performSearch(currentQuery, 1);
  }
}

/**
 * Clear all filters
 */
function clearFilters() {
  // Reset type checkboxes
  const typeCheckboxes = document.querySelectorAll('input[name="type"]');
  typeCheckboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  
  // Reset date radio to "All time"
  const allTimeRadio = document.getElementById('date-all');
  if (allTimeRadio) allTimeRadio.checked = true;
  
  // Apply filters (which will now be empty)
  applyFilters();
  
  // Announce for screen readers
  announceForScreenReaders('Filters cleared');
}

/**
 * Get simulated search results for demo purposes
 * @param {string} query - Search query
 * @param {Object} filters - Filter options
 * @param {number} page - Page number
 * @returns {Object} Search results
 */
function getSimulatedResults(query, filters, page) {
  // This is just for demonstration purposes
  const allResults = [
    {
      title: 'Quarterly Financial Report - Q1 2024',
      snippet: 'The <strong>financial</strong> results for Q1 2024 showed a significant improvement from the previous quarter...',
      type: 'pdf',
      date: '2024-03-15T10:30:00Z'
    },
    {
      title: 'Market Analysis for Product X',
      snippet: 'According to our <strong>market</strong> analysis, the potential growth for Product X is estimated at 15% annually...',
      type: 'docx',
      date: '2024-04-02T14:15:00Z'
    },
    {
      title: 'Technical Specifications - Version 2.4',
      snippet: 'The updated <strong>technical</strong> specifications include support for the new protocol and increased processing capacity...',
      type: 'pdf',
      date: '2024-05-10T09:45:00Z'
    },
    {
      title: 'Meeting Notes - Strategy Planning',
      snippet: 'During the <strong>strategy</strong> planning session, the team discussed various approaches to implementing the new features...',
      type: 'txt',
      date: '2024-05-05T15:20:00Z'
    },
    {
      title: 'Customer Feedback Summary',
      snippet: 'Based on the <strong>customer</strong> feedback collected over the past quarter, the main areas for improvement include...',
      type: 'docx',
      date: '2024-02-28T11:00:00Z'
    },
    {
      title: 'Product Roadmap 2024-2025',
      snippet: 'The <strong>product</strong> roadmap outlines the key milestones and feature releases planned for the next 18 months...',
      type: 'pdf',
      date: '2024-01-15T13:45:00Z'
    },
    {
      title: 'Research Findings on User Behavior',
      snippet: 'The <strong>research</strong> indicates that users typically spend 45% more time on pages with interactive elements...',
      type: 'pdf',
      date: '2023-12-10T16:30:00Z'
    },
    {
      title: 'API Documentation v3.2',
      snippet: 'The updated <strong>API</strong> documentation includes new endpoints for the analytics service and improved authentication...',
      type: 'docx',
      date: '2024-04-25T09:15:00Z'
    }
  ];
  
  // Filter results based on search query
  let filteredResults = allResults.filter(result => {
    // Simple text matching for demo
    return result.title.toLowerCase().includes(query.toLowerCase()) || 
           result.snippet.toLowerCase().includes(query.toLowerCase());
  });
  
  // Apply type filters
  if (filters.type.length > 0) {
    filteredResults = filteredResults.filter(result => filters.type.includes(result.type));
  }
  
  // Apply date filters
  if (filters.date !== 'all') {
    const now = new Date();
    let cutoffDate;
    
    if (filters.date === 'week') {
      cutoffDate = new Date(now.setDate(now.getDate() - 7));
    } else if (filters.date === 'month') {
      cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
    }
    
    filteredResults = filteredResults.filter(result => new Date(result.date) >= cutoffDate);
  }
  
  // Paginate results
  const resultsPerPage = 3;
  const startIndex = (page - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
  
  return {
    items: paginatedResults,
    totalItems: filteredResults.length,
    totalPages: totalPages > 0 ? totalPages : 1,
    currentPage: page
  };
}

// Initialize search when script loads
initSearch();