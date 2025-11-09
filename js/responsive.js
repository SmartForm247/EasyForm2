// Add this to your existing JavaScript files
document.addEventListener('DOMContentLoaded', function() {
  // Function to adjust layout based on screen size
  function adjustLayoutForScreenSize() {
    const width = window.innerWidth;
    const buttonContainer = document.querySelector('.button-container');
    const mainWrapper = document.querySelector('.main-wrapper');
    
    if (width <= 768) {
      // Mobile adjustments
      if (window.innerHeight > window.innerWidth) {
        // Portrait mode
        buttonContainer.style.position = 'fixed';
        buttonContainer.style.bottom = '10px';
        buttonContainer.style.top = 'auto';
        mainWrapper.style.paddingBottom = '80px';
        mainWrapper.style.paddingTop = '0';
      } else {
        // Landscape mode
        buttonContainer.style.position = 'fixed';
        buttonContainer.style.top = '10px';
        buttonContainer.style.bottom = 'auto';
        mainWrapper.style.paddingTop = '80px';
        mainWrapper.style.paddingBottom = '20px';
      }
    } else {
      // Desktop adjustments
      buttonContainer.style.position = 'fixed';
      buttonContainer.style.top = '10px';
      buttonContainer.style.bottom = 'auto';
      mainWrapper.style.paddingTop = '0';
      mainWrapper.style.paddingBottom = '0';
    }
  }
  
  // Initial adjustment
  adjustLayoutForScreenSize();
  
  // Adjust on window resize
  window.addEventListener('resize', adjustLayoutForScreenSize);
  
  // Adjust on orientation change
  window.addEventListener('orientationchange', function() {
    setTimeout(adjustLayoutForScreenSize, 100);
  });
});