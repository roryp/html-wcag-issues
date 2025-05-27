/**
 * Document upload JavaScript
 * Handles the document upload functionality
 */

// DOM elements
const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const fileList = document.getElementById('file-list');
const uploadButton = document.getElementById('upload-button');
const totalDocsElement = document.getElementById('total-docs');
const processingDocsElement = document.getElementById('processing-docs');
const lastUpdatedElement = document.getElementById('last-updated');
const recentUploadsTable = document.getElementById('recent-uploads');

// Upload state
let selectedFiles = [];

/**
 * Initialize upload functionality
 */
function initUpload() {
  // Set up event listeners
  setupUploadEventListeners();
  
  // Load knowledge base status
  loadKnowledgeBaseStatus();
  
  // Load recent uploads
  loadRecentUploads();
}

/**
 * Set up upload-specific event listeners
 */
function setupUploadEventListeners() {
  // File input change
  if (fileInput) {
    fileInput.addEventListener('change', handleFileSelect);
  }
  
  // Drop zone events
  if (dropZone) {
    // Click to select files
    dropZone.addEventListener('click', () => {
      fileInput.click();
    });
    
    // Keyboard navigation for accessibility
    dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });
    
    // Drag and drop events
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    });
  }
  
  // Form submission
  if (uploadForm) {
    uploadForm.addEventListener('submit', handleUploadSubmit);
  }
}

/**
 * Handle file selection from input
 * @param {Event} e - Input change event
 */
function handleFileSelect(e) {
  if (e.target.files.length > 0) {
    handleFiles(e.target.files);
  }
}

/**
 * Process selected files
 * @param {FileList} files - Selected files
 */
function handleFiles(files) {
  const newFiles = Array.from(files).filter(file => {
    // Check file type
    const validTypes = ['.pdf', '.docx', '.doc', '.txt'];
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    return validTypes.includes(extension);
  });
  
  // Update selected files
  selectedFiles = [...selectedFiles, ...newFiles];
  
  // Update UI
  updateFileListUI();
  
  // Enable upload button if there are files
  uploadButton.disabled = selectedFiles.length === 0;
  
  // Announce for screen readers
  announceForScreenReaders(`${newFiles.length} files selected`);
}

/**
 * Update the file list UI
 */
function updateFileListUI() {
  if (!fileList) return;
  
  // Clear current list
  fileList.innerHTML = '';
  
  // Add each file to the list
  selectedFiles.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';
    
    const fileName = document.createElement('div');
    fileName.className = 'file-name';
    fileName.textContent = file.name;
    
    const fileMeta = document.createElement('div');
    fileMeta.className = 'file-meta';
    fileMeta.textContent = formatFileSize(file.size);
    
    const fileActions = document.createElement('div');
    fileActions.className = 'file-actions';
    
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'button text';
    removeButton.innerHTML = '×';
    removeButton.setAttribute('aria-label', `Remove ${file.name}`);
    removeButton.addEventListener('click', () => removeFile(index));
    
    // Assemble the file item
    fileInfo.appendChild(fileName);
    fileInfo.appendChild(fileMeta);
    fileActions.appendChild(removeButton);
    fileItem.appendChild(fileInfo);
    fileItem.appendChild(fileActions);
    
    fileList.appendChild(fileItem);
  });
  
  // Show message if no files
  if (selectedFiles.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No files selected';
    fileList.appendChild(emptyState);
  }
}

/**
 * Remove a file from the selected files
 * @param {number} index - Index of file to remove
 */
function removeFile(index) {
  const fileName = selectedFiles[index].name;
  selectedFiles.splice(index, 1);
  updateFileListUI();
  
  // Disable upload button if no files
  uploadButton.disabled = selectedFiles.length === 0;
  
  // Announce for screen readers
  announceForScreenReaders(`Removed ${fileName}`);
}

/**
 * Handle upload form submission
 * @param {Event} e - Form submission event
 */
function handleUploadSubmit(e) {
  e.preventDefault();
  
  if (selectedFiles.length === 0) return;
  
  // Show loading state
  uploadButton.disabled = true;
  const buttonText = uploadButton.querySelector('.button-text');
  const spinner = uploadButton.querySelector('.spinner');
  buttonText.textContent = 'Uploading...';
  spinner.classList.remove('hidden');
  
  // Announce upload start for screen readers
  announceForScreenReaders(`Uploading ${selectedFiles.length} files`);
  
  // Mock upload process - replace with actual API upload
  setTimeout(() => {
    // Update knowledge base stats
    const totalDocs = parseInt(totalDocsElement.textContent) + selectedFiles.length;
    const processingDocs = parseInt(processingDocsElement.textContent) + selectedFiles.length;
    
    totalDocsElement.textContent = totalDocs;
    processingDocsElement.textContent = processingDocs;
    lastUpdatedElement.textContent = formatDate(new Date());
    
    // Add to recent uploads
    updateRecentUploads(selectedFiles);
    
    // Reset state
    selectedFiles = [];
    updateFileListUI();
    uploadButton.disabled = true;
    buttonText.textContent = 'Upload Documents';
    spinner.classList.add('hidden');
    
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'alert success';
    successMessage.setAttribute('role', 'alert');
    successMessage.textContent = 'Files uploaded successfully. Processing has started.';
    uploadForm.insertAdjacentElement('afterbegin', successMessage);
    
    // Remove success message after delay
    setTimeout(() => {
      successMessage.remove();
    }, 5000);
    
    // Announce success for screen readers
    announceForScreenReaders('Files uploaded successfully. Processing has started.');
  }, 3000);
}

/**
 * Load knowledge base status
 */
function loadKnowledgeBaseStatus() {
  // Mock data - replace with actual API call
  const stats = {
    totalDocuments: 12,
    processingDocuments: 2,
    lastUpdated: '2024-05-20T14:30:00Z'
  };
  
  // Update UI
  if (totalDocsElement) totalDocsElement.textContent = stats.totalDocuments;
  if (processingDocsElement) processingDocsElement.textContent = stats.processingDocuments;
  if (lastUpdatedElement) lastUpdatedElement.textContent = stats.lastUpdated ? formatDate(stats.lastUpdated) : 'Never';
}

/**
 * Load recent uploads
 */
function loadRecentUploads() {
  if (!recentUploadsTable) return;
  
  // Mock data - replace with actual API call
  const uploads = [
    { name: 'financial_report_2023.pdf', size: 2457600, status: 'Completed', uploaded: '2024-05-20T14:30:00Z' },
    { name: 'user_manual_v2.docx', size: 1048576, status: 'Processing', uploaded: '2024-05-20T14:15:00Z' },
    { name: 'meeting_notes.txt', size: 8192, status: 'Completed', uploaded: '2024-05-18T09:45:00Z' }
  ];
  
  // Update UI
  if (uploads.length > 0) {
    recentUploadsTable.innerHTML = '';
    
    uploads.forEach(upload => {
      const row = document.createElement('tr');
      
      const nameCell = document.createElement('td');
      nameCell.textContent = upload.name;
      
      const sizeCell = document.createElement('td');
      sizeCell.textContent = formatFileSize(upload.size);
      
      const statusCell = document.createElement('td');
      const statusSpan = document.createElement('span');
      statusSpan.className = `status ${upload.status.toLowerCase()}`;
      statusSpan.textContent = upload.status;
      statusCell.appendChild(statusSpan);
      
      const uploadedCell = document.createElement('td');
      uploadedCell.textContent = formatDate(upload.uploaded);
      
      row.appendChild(nameCell);
      row.appendChild(sizeCell);
      row.appendChild(statusCell);
      row.appendChild(uploadedCell);
      
      recentUploadsTable.appendChild(row);
    });
  }
}

/**
 * Update recent uploads table with newly uploaded files
 * @param {Array} files - Newly uploaded files
 */
function updateRecentUploads(files) {
  if (!recentUploadsTable) return;
  
  // Remove empty state row if present
  const emptyState = recentUploadsTable.querySelector('.empty-state');
  if (emptyState) {
    emptyState.remove();
  }
  
  // Add each file to recent uploads
  files.forEach(file => {
    const row = document.createElement('tr');
    
    const nameCell = document.createElement('td');
    nameCell.textContent = file.name;
    
    const sizeCell = document.createElement('td');
    sizeCell.textContent = formatFileSize(file.size);
    
    const statusCell = document.createElement('td');
    const statusSpan = document.createElement('span');
    statusSpan.className = 'status processing';
    statusSpan.textContent = 'Processing';
    statusCell.appendChild(statusSpan);
    
    const uploadedCell = document.createElement('td');
    uploadedCell.textContent = formatDate(new Date());
    
    row.appendChild(nameCell);
    row.appendChild(sizeCell);
    row.appendChild(statusCell);
    row.appendChild(uploadedCell);
    
    // Add to top of table
    recentUploadsTable.insertBefore(row, recentUploadsTable.firstChild);
  });
}

// Initialize upload functionality when script loads
initUpload();