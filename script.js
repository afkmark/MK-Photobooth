const video = document.getElementById("video");
const captureBtn = document.getElementById("capture");
const resetBtn = document.getElementById("reset");
const canvas = document.getElementById("canvas");
const gallery = document.getElementById("gallery");
const filterSelect = document.getElementById("filter");
const captionInput = document.getElementById("caption");
const photoMode = document.getElementById("photoMode");
const cameraToggleBtn = document.getElementById("cameraToggle"); // Camera On/Off button
const countdownOverlay = document.createElement("div"); // Countdown display
const ctx = canvas.getContext("2d");

let stream = null;
let stripImages = [];

// Style the Countdown Overlay
countdownOverlay.style.position = "absolute";
countdownOverlay.style.top = "50%";
countdownOverlay.style.left = "50%";
countdownOverlay.style.transform = "translate(-50%, -50%)";
countdownOverlay.style.fontSize = "80px";
countdownOverlay.style.color = "white";
countdownOverlay.style.fontWeight = "bold";
countdownOverlay.style.textShadow = "2px 2px 10px rgba(0, 0, 0, 0.8)";
countdownOverlay.style.display = "none";
countdownOverlay.style.zIndex = "10";
video.parentElement.appendChild(countdownOverlay); // Append inside the camera container

// Function to Start Camera
function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(camStream => {
            stream = camStream;
            video.srcObject = stream;
            cameraToggleBtn.textContent = "Turn Off Camera";
        })
        .catch(err => console.error("Camera Access Denied", err));
}

// Function to Stop Camera
function stopCamera() {
    if (stream) {
        let tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
        stream = null;
        cameraToggleBtn.textContent = "Turn On Camera";
    }
}

// Toggle Camera On/Off
cameraToggleBtn.addEventListener("click", () => {
    if (stream) {
        stopCamera();
    } else {
        startCamera();
    }
});

// Set default filter to "none"
video.style.filter = "none";

// Apply Selected Filter
filterSelect.addEventListener("change", () => {
    if (filterSelect.value === "polaroid") {
        video.style.filter = "brightness(110%) contrast(90%) saturate(80%) sepia(20%)";
    } else {
        video.style.filter = filterSelect.value;
    }
});

// Countdown Timer Inside Camera
function startCountdown(callback) {
    let countdown = 3;
    countdownOverlay.textContent = countdown;
    countdownOverlay.style.display = "block";

    const interval = setInterval(() => {
        countdown--;
        if (countdown === 0) {
            countdownOverlay.textContent = "📸"; // Show camera emoji on last second
        } else if (countdown < 0) {
            clearInterval(interval);
            countdownOverlay.style.display = "none"; // Hide countdown
            callback();
        } else {
            countdownOverlay.textContent = countdown;
        }
    }, 1000);
}

// Capture Image with Border & Caption
captureBtn.addEventListener("click", () => {
    startCountdown(() => {
        if (!stream) return; // Prevent capturing when the camera is off

        const borderSize = 30;
        const bottomBorderSize = 80; // Increased to make space for caption

        const finalWidth = video.videoWidth + borderSize * 2;
        const finalHeight = video.videoHeight + borderSize + bottomBorderSize;

        canvas.width = finalWidth;
        canvas.height = finalHeight;

        // Draw white border
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.translate(finalWidth, 0);
        ctx.scale(-1, 1);

        // Apply Selected Filter
        ctx.filter = filterSelect.value === "polaroid"
            ? "brightness(110%) contrast(90%) saturate(80%) sepia(20%)"
            : filterSelect.value;

        // Draw captured image inside the white border
        ctx.drawImage(video, borderSize, borderSize, video.videoWidth, video.videoHeight);

        // Draw Caption if Available
        const captionText = captionInput.value.trim();
        if (captionText !== "") {
            ctx.translate(finalWidth, 0);
            ctx.scale(-1, 1);
            ctx.fillStyle = "black"; // Caption color
            ctx.font = "20px Arial"; // Caption font
            ctx.textAlign = "center";
            ctx.fillText(captionText, canvas.width / 2, canvas.height - 30); // Draw caption at bottom
        }

        const imgData = canvas.toDataURL("image/png");

        if (photoMode.value === "strip") {
            stripImages.push(imgData);
            if (stripImages.length === 4) {
                createPhotoStrip();
                stripImages = [];
            }
        } else {
            addPhotoToGallery(imgData);
        }
    });
});


// Create 1x4 Photo Strip with Full Images
function createPhotoStrip() {
    const imgWidth = video.videoWidth; // Keep original width
    const imgHeight = video.videoHeight; // Keep original height

    const stripCanvas = document.createElement("canvas");
    stripCanvas.width = imgWidth; // Width remains the same
    stripCanvas.height = imgHeight * 4; // Height for 4 images

    const stripCtx = stripCanvas.getContext("2d");

    stripImages.forEach((imgSrc, index) => {
        const img = new Image();
        img.src = imgSrc;
        img.onload = () => {
            stripCtx.drawImage(img, 0, index * imgHeight, imgWidth, imgHeight);
            if (index === 3) {
                addPhotoToGallery(stripCanvas.toDataURL("image/png"));
            }
        };
    });
}

// Add Photo to Gallery
function addPhotoToGallery(imgData) {
    const photoDiv = document.createElement("div");
    photoDiv.classList.add("photo");

    const img = document.createElement("img");
    img.src = imgData;

    // Only add caption if user types something
    if (captionInput.value.trim() !== "") {
        const caption = document.createElement("div");
        caption.classList.add("caption");
        caption.textContent = captionInput.value;
        photoDiv.appendChild(caption);
    }

    const downloadLink = document.createElement("a");
    downloadLink.href = imgData;
    downloadLink.download = "instax_photo.png";
    downloadLink.textContent = "Download";
    downloadLink.classList.add("download");

    photoDiv.appendChild(img);
    photoDiv.appendChild(downloadLink);

    gallery.appendChild(photoDiv);
}

// Reset Gallery
resetBtn.addEventListener("click", () => {
    gallery.innerHTML = "";
    stripImages = [];
});
