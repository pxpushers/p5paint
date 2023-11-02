let grid = [];
let gridSize = 24;
let blockSide = 20;
let modeStates = ['draw', 'sample', 'fill'];
let currentModeIndex = 0;
let previousMode = modeStates[currentModeIndex];
let currentColor;
let colorPalette = [];
let svgDataCache = {};
function setup() {
    let cnv = createCanvas(gridSize * blockSide, gridSize * blockSide);
    cnv.id('p5Canvas'); 
    cnv.parent('canvas-container');
    initGrid();
    preloadSVGs().then(() => {
        setDefaultSVG();
    });
    document.getElementById('modeToggle').addEventListener('click', toggleMode);
    document.getElementById('clearButton').addEventListener('click', clearCanvas);
    document.getElementById('saveButton').addEventListener('click', saveCanvasAsImage);
    document.getElementById('colorWheel').addEventListener('input', updateColorInputs);
    document.getElementById('hexValue').addEventListener('input', updateColorWheel);
    document.getElementById('gridSizeInput').addEventListener('input', updateGridSize);
    document.getElementById('darkModeToggle').addEventListener('click', function() {
        // Toggle the dark mode class on the body
        document.body.classList.toggle('dark-mode');
        
        // Update the SVG colors
        updateModeIcon();
    });
    currentColor = color(0); 
    initializePalette();
    updatePaletteDisplay();
    adjustLayoutForWindowSize();
    document.addEventListener('keydown', function(event) {
        if (event.altKey && modeStates[currentModeIndex] !== 'sample') { 
            previousMode = modeStates[currentModeIndex];
            currentModeIndex = modeStates.indexOf('sample');
            updateModeIcon();
        }
    });
    document.addEventListener('keyup', function(event) {
        if (event.key === 'Alt') { 
            currentModeIndex = modeStates.indexOf(previousMode);
            updateModeIcon();
        }
    });
    }
    function draw() {
        drawGrid();
    }
    function preloadSVGs() {
        const svgFiles = ["pencil.svg", "eyedropper.svg", "fill.svg"];
        const baseSVGPath = "https://aklo360.github.io/p5paint/svg/";
        
        let promises = svgFiles.map(svgFile => {
            return fetch(baseSVGPath + svgFile)
            .then(response => response.text())
            .then(svgData => {
                svgDataCache[svgFile] = "data:image/svg+xml," + encodeURIComponent(svgData);
            });
        });
    
        return Promise.all(promises);
    }
    preloadSVGs();
    function setDefaultSVG() {
        const modeButton = document.getElementById('modeToggle');
        modeButton.innerHTML = decodeURIComponent(svgDataCache["pencil.svg"].split(",")[1]);
    }    
    function fetchAndEmbedSVG(svgFile, container) {
        let svgDataUrl = svgDataCache[svgFile];
        container.innerHTML = svgDataUrl; // Embed the SVG directly into the container
    }
    
    function adjustLayoutForWindowSize() {
        const palette = document.getElementById('colorPalette');
        if (windowWidth <= 768) {
            palette.style.position = 'static';
            palette.style.left = 'initial';
        } else {
            palette.style.position = 'absolute';
            palette.style.left = 'calc(100% + 20px)';
        }
    }
    function windowResized() {
        adjustLayoutForWindowSize();
    }
    function toggleMode() {
        currentModeIndex = (currentModeIndex + 1) % modeStates.length;
        updateModeIcon();
    }
    function simplifyHexCode(hex) {
        if (hex.length === 7) { // Check if it's a 6-digit hex code
            return '#' + hex[1] + hex[3] + hex[5];
        }
        return hex;
    }        
    function updateModeIcon() {
        const modeButton = document.getElementById('modeToggle');
        const isDarkMode = document.body.classList.contains("dark-mode");
        let svgContent;
    
        switch (modeStates[currentModeIndex]) {
            case 'draw':
                svgContent = svgDataCache["pencil.svg"];
                modeButton.title = "Toggle to Sampling Mode";
                break;
            case 'sample':
                svgContent = svgDataCache["eyedropper.svg"];
                modeButton.title = "Toggle to Fill Mode";
                break;
            case 'fill':
                svgContent = svgDataCache["fill.svg"];
                modeButton.title = "Toggle to Drawing Mode";
                break;
        }
    
        modeButton.innerHTML = decodeURIComponent(svgContent.split(",")[1]);
        const svgElement = modeButton.querySelector('svg');
        if (svgElement) {
            const paths = svgElement.querySelectorAll('path');
            paths.forEach(path => {
                let currentStroke = path.getAttribute('stroke');
                if (isDarkMode) {
                    if (currentStroke === '#ff0') {
                        // Remove the path from the SVG if its stroke is #ff0 and dark mode is active
                        svgElement.removeChild(path);
                        return; 
                    } else if (currentStroke === '#000') {
                        path.setAttribute('stroke', '#FFF'); // Black to White
                    } else if (['#f0f', '#ff0', '#d2af00'].includes(currentStroke)) {
                        path.setAttribute('stroke', '#FFF'); // Yellow and Pink to White
                    }
                } else {
                    if (currentStroke === '#FFF') {
                        path.setAttribute('stroke', '#000'); // White to Black
                    }
                }
            });
        }
    }    
    function floodFill(x, y, targetColor, fillColor) {
        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;
        if (!colorsMatch(grid[x][y], targetColor) || colorsMatch(grid[x][y], fillColor)) return;
        grid[x][y] = fillColor;
        floodFill(x + 1, y, targetColor, fillColor);
        floodFill(x - 1, y, targetColor, fillColor);
        floodFill(x, y + 1, targetColor, fillColor);
        floodFill(x, y - 1, targetColor, fillColor);
    }

    function colorsMatch(c1, c2) {
        return c1.toString() === c2.toString();
    }
    function mousePressed() {
        let i = floor(mouseX / blockSide);
        let j = floor(mouseY / blockSide);
        if (i >= 0 && i < gridSize && j >= 0 && j < gridSize) {
            switch (modeStates[currentModeIndex]) {
                case 'draw':
                    grid[i][j] = currentColor;
                    addToPalette(currentColor);
                    break;
                case 'sample':
                    const pixelColor = grid[i][j];
                    addToPalette(pixelColor);
                    currentColor = pixelColor;
                    updateColorInputsFromCurrentColor();
                    break;
                case 'fill':
                    floodFill(i, j, grid[i][j], currentColor);
                    break;
            }
        }
    }
    function mouseDragged() {
        drawPixel();
    }
    function drawPixel() {
        let i = floor(mouseX / blockSide);
        let j = floor(mouseY / blockSide);
        if (i >= 0 && i < gridSize && j >= 0 && j < gridSize) {
            grid[i][j] = currentColor;
            addToPalette(currentColor);
        }
    }
    function updateColorInputsFromCurrentColor() {
        const hexColor = `#${currentColor.levels.slice(0, 3).map(c => c.toString(16).padStart(2, '0')).join('')}`;
        document.getElementById('hexValue').value = hexColor;
        document.getElementById('colorWheel').value = hexColor;
    }
    function selectPaletteColor(color) {
        document.getElementById('colorWheel').value = color;
        document.getElementById('hexValue').value = color;
        currentColor = color;
    }
    function samplePixelColorToPalette() {
        let i = floor(mouseX / blockSide);
        let j = floor(mouseY / blockSide);
        if (i >= 0 && i < gridSize && j >= 0 && j < gridSize) {
            const pixelColor = grid[i][j];
            addToPalette(pixelColor);
            currentColor = pixelColor;
            updateColorInputsFromCurrentColor();
        }
    }
    function initGrid() {
        grid = new Array(gridSize).fill(0).map(() => new Array(gridSize).fill(color(255)));
    }
    function clearCanvas() {
        initGrid();
    }
    function drawGrid(withStroke = true) {
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                fill(grid[i][j]);
                if (withStroke) {
                    stroke(0); 
                } else {
                    noStroke(); 
                }
                rect(i * blockSide, j * blockSide, blockSide, blockSide);
            }
        }
    }
    function updateColorInputs(event) {
        const hexColor = event.target.value;
        document.getElementById('hexValue').value = hexColor;
        currentColor = color(hexColor);
    }
    function updateColorWheel() {
        const hex = document.getElementById('hexValue').value;
        currentColor = color(hex);
        document.getElementById('colorWheel').value =
        hex;
    }
    function addToPalette(newColor) {
        const hexColor = newColor.toString('#rrggbb');
        if (!colorPalette.includes(hexColor)) {
            colorPalette.push(hexColor);
            if (colorPalette.length > 16) {
                colorPalette.shift();
            }
            updatePaletteDisplay();
        }
    }
    function initializePalette() {
        colorPalette = new Array(16).fill("#FFFFFF");
    }
    function updatePaletteDisplay() {
        const paletteContainer = document.getElementById('colorPalette');
        paletteContainer.innerHTML = '';
        colorPalette.forEach(color => {
            const colorElement = document.createElement('div');
            colorElement.className = 'palette-color';
            colorElement.style.backgroundColor = color;
            colorElement.addEventListener('click', () => selectPaletteColor(color));
            paletteContainer.appendChild(colorElement);
        });
    }
    function updateGridSize() {
        const gridSizeInputElement = document.querySelector('#gridSizeInput input');
        const newGridSize = parseInt(gridSizeInputElement.value, 10);
        
        if (newGridSize >= 6 && newGridSize <= 64) {
            gridSize = newGridSize;
            blockSide = width / gridSize;
            initGrid();
        }
    }
    function saveCanvasAsImage() {
        let originalDensity = pixelDensity();
        pixelDensity(1);
        
        // Create a new graphics object with the desired size
        let graphics = createGraphics(gridSize, gridSize);
        graphics.pixelDensity(1);
        graphics.noSmooth();
        
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                graphics.fill(grid[i][j]);
                graphics.noStroke();
                graphics.rect(i, j, 1, 1); // Draw each block as a 1x1 rectangle
            }
        }
        
        // Get the image data from the graphics
        let imgData = graphics.drawingContext.getImageData(0, 0, gridSize, gridSize);
    
        // Pass the image data to the convert function
        px2svg(imgData);
    
        // Restore the original canvas size and pixel density
        pixelDensity(originalDensity);
        drawGrid();
    }    