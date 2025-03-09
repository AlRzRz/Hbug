document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const returnButton = document.getElementById('return-product-btn');
  const returnButtonContainer = document.getElementById('return-button-container');
  const cameraContainer = document.getElementById('camera-container');
  const cameraInput = document.getElementById('camera-input');
  const captureBtn = document.getElementById('capture-btn');
  const uploadBtn = document.getElementById('upload-btn');
  const previewContainer = document.getElementById('preview-container');
  const previewImage = document.getElementById('preview-image');
  const retakeBtn = document.getElementById('retake-btn');
  const submitBtn = document.getElementById('submit-btn');
  const resultContainer = document.getElementById('result-container');
  const rankDisplay = document.getElementById('rank-display');
  const reimbursementAmount = document.getElementById('reimbursement-amount');
  const acceptBtn = document.getElementById('accept-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const confirmationContainer = document.getElementById('confirmation-container');
  const backToHomeBtn = document.getElementById('back-to-home-btn');
  const loadingContainer = document.getElementById('loading-container');
  
  let capturedImage = null;
  
  // Make sure all containers except returnButtonContainer are hidden on page load
  cameraContainer.classList.add('hidden');
  previewContainer.classList.add('hidden');
  resultContainer.classList.add('hidden');
  confirmationContainer.classList.add('hidden');
  loadingContainer.classList.add('hidden');
  returnButtonContainer.classList.remove('hidden');
  
  // Event Listeners
  returnButton.addEventListener('click', function() {
    returnButtonContainer.classList.add('hidden');
    cameraContainer.classList.remove('hidden');
  });
  
  captureBtn.addEventListener('click', function() {
    // For camera capture on mobile
    cameraInput.setAttribute('capture', 'camera');
    cameraInput.click();
  });
  
  uploadBtn.addEventListener('click', function() {
    // For uploading existing images
    cameraInput.removeAttribute('capture');
    cameraInput.click();
  });
  
  cameraInput.addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = function(event) {
        previewImage.src = event.target.result;
        capturedImage = file;
        previewContainer.classList.remove('hidden');
        submitBtn.disabled = false; // Enable submit button once image is loaded
      };
      
      reader.readAsDataURL(file);
    }
  });
  
  retakeBtn.addEventListener('click', function() {
    previewContainer.classList.add('hidden');
    capturedImage = null;
    submitBtn.disabled = true; // Disable submit button when retaking
  });
  
  submitBtn.addEventListener('click', function() {
    if (!capturedImage) {
      alert('Please take a photo first');
      return;
    }
    
    const formData = new FormData();
    formData.append('image', capturedImage);
    
    // Show loading screen
    cameraContainer.classList.add('hidden');
    loadingContainer.classList.remove('hidden');
    
    fetch('/api/upload-image', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Display results
        rankDisplay.textContent = data.productRank;
        reimbursementAmount.textContent = `${data.reimbursementPercentage}%`;
        
        // Hide loading screen and show result container
        loadingContainer.classList.add('hidden');
        resultContainer.classList.remove('hidden');
      } else {
        alert('Error processing image. Please try again.');
        // Hide loading screen and go back to camera
        loadingContainer.classList.add('hidden');
        cameraContainer.classList.remove('hidden');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
      // Hide loading screen and go back to camera
      loadingContainer.classList.add('hidden');
      cameraContainer.classList.remove('hidden');
    });
  });
  
  acceptBtn.addEventListener('click', function() {
    resultContainer.classList.add('hidden');
    confirmationContainer.classList.remove('hidden');
  });
  
  cancelBtn.addEventListener('click', function() {
    resultContainer.classList.add('hidden');
    returnButtonContainer.classList.remove('hidden');
  });
  
  backToHomeBtn.addEventListener('click', function() {
    confirmationContainer.classList.add('hidden');
    returnButtonContainer.classList.remove('hidden');
    // Reset everything
    previewContainer.classList.add('hidden');
    capturedImage = null;
    submitBtn.disabled = true; // Ensure submit button is disabled when resetting
  });
});
