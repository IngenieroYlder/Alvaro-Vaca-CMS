function openJoinModal() {
    const modal = document.getElementById('joinModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeJoinModal() {
    const modal = document.getElementById('joinModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Close on Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        closeJoinModal();
    }
});

// Timeline Progress Animation
document.addEventListener('scroll', function() {
    const container = document.getElementById('timeline-container');
    const progressBar = document.getElementById('timeline-progress');

    if (container && progressBar) {
        const rect = container.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Start filling when the top of the container is within the viewport (e.g., at 80% height)
        // Finish filling when the bottom of the container is at the same point or fully scrolled
        
        const offset = windowHeight * 0.5; // Trigger point at 50% of viewport height
        const top = rect.top;
        const height = rect.height;
        
        // Calculate progress
        // When top == offset, progress = 0
        // When top == offset - height, progress = 1
        
        let progress = (offset - top) / height;
        
        // Clamp between 0 and 1
        progress = Math.max(0, Math.min(1, progress));
        
        progressBar.style.height = `${progress * 100}%`;
    }
});
