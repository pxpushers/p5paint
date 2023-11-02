document.addEventListener("DOMContentLoaded", function() {
    const toggleCheckbox = document.getElementById("darkModeToggle");
    const body = document.body;

    toggleCheckbox.addEventListener("change", function() {
        if (this.checked) {
            body.classList.add("dark-mode");
            switchToDarkMode();
        } else {
            body.classList.remove("dark-mode");
            switchToLightMode();
        }
    });

    function switchToDarkMode() {
        body.classList.add('dark-mode');
        body.classList.remove('light-mode');
        switchSVGs(true);
    }
    
    function switchToLightMode() {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        switchSVGs(false);
    }

    function switchSVGs(isDarkMode) {
        const svgs = document.querySelectorAll("img[src$='.svg'], button[style*='.svg']");
        svgs.forEach(svg => {
            if (svg.tagName.toLowerCase() === 'img') {
                if (isDarkMode) {
                    svg.src = svg.src.replace('.svg', '-w.svg');
                } else {
                    svg.src = svg.src.replace('-w.svg', '.svg');
                }
            } else if (svg.tagName.toLowerCase() === 'button') {
                if (isDarkMode) {
                    svg.style.backgroundImage = svg.style.backgroundImage.replace('.svg', '-w.svg');
                } else {
                    svg.style.backgroundImage = svg.style.backgroundImage.replace('-w.svg', '.svg');
                }
            }
        });
    }
});
