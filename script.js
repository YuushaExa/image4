document.addEventListener('DOMContentLoaded', function() {
    const uploadInput = document.getElementById('upload');
    const dropArea = document.getElementById('drop-area');
    const imageUrlInput = document.getElementById('image-url');
    const loadUrlButton = document.getElementById('load-url');
    const cropButton = document.getElementById('crop-btn');
    const canvasElement = document.getElementById('canvas');
    const ctx = canvasElement.getContext('2d');
    const imageWidthInput = document.getElementById('image-width');
    const imageHeightInput = document.getElementById('image-height');
    const canvasWidthInput = document.getElementById('canvas-width');
    const canvasHeightInput = document.getElementById('canvas-height');
    const objectInfo = document.getElementById('objectInfo');
    const toggleInfo = document.getElementById('toggleInfo');
    const angleInput = document.getElementById('angleInput');

    let img = new Image();
    let imgData, imgInstance;
    let isCropping = false;
    let cropStartX, cropStartY, cropEndX, cropEndY;
    
    uploadInput.addEventListener('change', handleFileSelect);
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('drop', handleDrop);
    dropArea.addEventListener('click', () => uploadInput.click());
    loadUrlButton.addEventListener('click', handleImageUrl);
    cropButton.addEventListener('click', handleCrop);
    canvasWidthInput.addEventListener('input', updateCanvasSize);
    canvasHeightInput.addEventListener('input', updateCanvasSize);
    imageWidthInput.addEventListener('input', updateImageSize);
    imageHeightInput.addEventListener('input', updateImageSize);
    angleInput.addEventListener('input', updateAngle);

    const controls = ['brightness', 'contrast', 'saturation'];
    controls.forEach(control => {
        const input = document.getElementById(control);
        input.addEventListener('input', () => {
            applyFilters();
            updateLabel(control);
        });
    });

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                loadImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    function handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        dropArea.classList.add('dragover');
    }

    function handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        dropArea.classList.remove('dragover');
        const file = event.dataTransfer.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                loadImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    function handleImageUrl() {
        const url = imageUrlInput.value;
        if (url) {
            loadImage(url);
        }
    }

    function loadImage(src) {
        img.src = src;
        img.onload = function() {
            canvasElement.width = img.width;
            canvasElement.height = img.height;
            ctx.drawImage(img, 0, 0);
            updateImageSizeInputs();
            updateCanvasSizeInputs();
        };
    }

    function applyFilters() {
        ctx.drawImage(img, 0, 0);
        imgData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
        let data = imgData.data;

        const brightness = parseInt(document.getElementById('brightness').value, 10);
        const contrast = parseInt(document.getElementById('contrast').value, 10);
        const saturation = parseInt(document.getElementById('saturation').value, 10);

        // Apply brightness
        for (let i = 0; i < data.length; i += 4) {
            data[i] = data[i] + brightness;
            data[i + 1] = data[i + 1] + brightness;
            data[i + 2] = data[i + 2] + brightness;
        }

        // Apply contrast
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        for (let i = 0; i < data.length; i += 4) {
            data[i] = factor * (data[i] - 128) + 128;
            data[i + 1] = factor * (data[i + 1] - 128) + 128;
            data[i + 2] = factor * (data[i + 2] - 128) + 128;
        }

        // Apply saturation
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
            data[i] = gray + (data[i] - gray) * (1 + saturation / 100);
            data[i + 1] = gray + (data[i + 1] - gray) * (1 + saturation / 100);
            data[i + 2] = gray + (data[i + 2] - gray) * (1 + saturation / 100);
        }

        ctx.putImageData(imgData, 0, 0);
    }

    function updateLabel(control) {
        const value = document.getElementById(control).value;
        document.getElementById(`${control}-label`).textContent = `${value}%`;
    }

    function updateCanvasSize() {
        const width = parseInt(canvasWidthInput.value, 10);
        const height = parseInt(canvasHeightInput.value, 10);
        if (!isNaN(width) && !isNaN(height)) {
            canvasElement.width = width;
            canvasElement.height = height;
            ctx.drawImage(img, 0, 0);
        }
    }

    function updateImageSize() {
        const width = parseInt(imageWidthInput.value, 10);
        const height = parseInt(imageHeightInput.value, 10);
        if (!isNaN(width) && !isNaN(height)) {
            canvasElement.width = width;
            canvasElement.height = height;
            ctx.drawImage(img, 0, 0, width, height);
        }
    }

    function updateImageSizeInputs() {
        imageWidthInput.value = img.width;
        imageHeightInput.value = img.height;
    }

    function updateCanvasSizeInputs() {
        canvasWidthInput.value = canvasElement.width;
        canvasHeightInput.value = canvasElement.height;
    }

    function handleCrop() {
        if (!isCropping) {
            canvasElement.addEventListener('mousedown', startCrop);
            canvasElement.addEventListener('mouseup', endCrop);
            cropButton.textContent = 'Confirm Crop';
            isCropping = true;
        } else {
            cropButton.textContent = 'Crop';
            isCropping = false;
        }
    }

    function startCrop(event) {
        cropStartX = event.offsetX;
        cropStartY = event.offsetY;
    }

    function endCrop(event) {
        cropEndX = event.offsetX;
        cropEndY = event.offsetY;

        const cropWidth = cropEndX - cropStartX;
        const cropHeight = cropEndY - cropStartY;

        const croppedImg = ctx.getImageData(cropStartX, cropStartY, cropWidth, cropHeight);
        canvasElement.width = cropWidth;
        canvasElement.height = cropHeight;
        ctx.putImageData(croppedImg, 0, 0);
    }

    function updateAngle() {
        const angle = parseFloat(angleInput.value);
        if (!isNaN(angle)) {
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            ctx.save();
            ctx.translate(canvasElement.width / 2, canvasElement.height / 2);
            ctx.rotate(angle * Math.PI / 180);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
            ctx.restore();
        }
    }

    function updateObjectInfo() {
        const width = img.width;
        const height = img.height;
        const angle = angleInput.value;
        const left = canvasElement.offsetLeft;
        const top = canvasElement.offsetTop;

        if (toggleInfo.checked) {
            objectInfo.innerHTML = `Width: ${width}px, Height: ${height}px, Angle: ${angle}°, Position: (${left}px, ${top}px)`;
        } else {
            objectInfo.innerHTML = '';
        }
    }

    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();
});
