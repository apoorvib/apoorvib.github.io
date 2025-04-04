// Add this code to fix the modal close button issue

document.addEventListener('DOMContentLoaded', function() {
    const openResearchModal = document.getElementById('open-research-modal');
    const closeResearchModal = document.getElementById('close-research-modal');
    const researchModal = document.getElementById('research-modal');
    const modalCloseButton = document.querySelector('.modal-close');
    
    // Function to open modal
    function openModal() {
        researchModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    // Function to close modal
    function closeModal() {
        researchModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Event listeners
    if (openResearchModal) {
        openResearchModal.addEventListener('click', openModal);
    }
    
    if (closeResearchModal) {
        closeResearchModal.addEventListener('click', closeModal);
    }
    
    // Add event listener for the X button
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === researchModal) {
            closeModal();
        }
    });
    
    // Also fix by ensuring the buttons have the correct type
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
        if (!button.hasAttribute('type')) {
            button.setAttribute('type', 'button');
        }
    });
});