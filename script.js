// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAiwICR8vJ-XvryAqc2os-q7teaEn0n1SY",
  authDomain: "photobooth-f1b2e.firebaseapp.com",
  databaseURL: "https://photobooth-f1b2e-default-rtdb.firebaseio.com",
  projectId: "photobooth-f1b2e",
  storageBucket: "photobooth-f1b2e.appspot.com",
  messagingSenderId: "14447345131",
  appId: "1:14447345131:web:d3f3c979979d10cc366dae",
  measurementId: "G-W7N7W08LWV"
};

firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();
const database = firebase.database();

// ✅ DOM Elements
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const captureButton = document.getElementById("captureBtn");
const autoCaptureButton = document.getElementById("autoCaptureBtn");
const stripButton = document.getElementById("generateBtn");
const thumbnailsBox = document.getElementById("thumbnails");

let capturedPhotos = [];
let currentFilter = "none";

// ✅ Start Webcam
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(error => {
    console.error("Webcam error:", error);
    alert("Please allow camera access.");
  });

// ✅ Apply Filters
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    video.style.filter = currentFilter;
  });
});

// ✅ Capture Single Photo
captureButton.addEventListener("click", () => {
  if (capturedPhotos.length >= 4) {
    alert("Max 4 photos allowed!");
    return;
  }
  capturePhoto();
});

// ✅ Auto Capture with Countdown
autoCaptureButton.addEventListener("click", () => {
  if (capturedPhotos.length > 0 && !confirm("Clear old photos?")) return;

  capturedPhotos = [];
  thumbnailsBox.innerHTML = "";

  const flash = document.getElementById("flash-overlay");
  const interval = parseInt(document.getElementById("interval").value); // ms
  let count = 0;

  // Create countdown overlay
  const countdownOverlay = document.createElement("div");
  countdownOverlay.style.position = "absolute";
  countdownOverlay.style.top = "50%";
  countdownOverlay.style.left = "50%";
  countdownOverlay.style.transform = "translate(-50%, -50%)";
  countdownOverlay.style.fontSize = "80px";
  countdownOverlay.style.fontWeight = "bold";
  countdownOverlay.style.color = "#fff";
  countdownOverlay.style.zIndex = "9999";
  countdownOverlay.id = "countdown";
  document.body.appendChild(countdownOverlay);

  function showCountdown(number, callback) {
    countdownOverlay.textContent = number;
    if (number > 1) {
      setTimeout(() => showCountdown(number - 1, callback), 1000);
    } else {
      setTimeout(() => {
        countdownOverlay.textContent = "";
        callback();
      }, 1000);
    }
  }

  function flashScreen() {
    flash.style.display = "block";
    setTimeout(() => {
      flash.style.display = "none";
    }, 200);
  }

  function takeNextPhoto() {
    if (count >= 4) {
      countdownOverlay.remove();
      return;
    }

    showCountdown(3, () => {
      flashScreen();
      capturePhoto();
      count++;
      setTimeout(takeNextPhoto, interval); // wait interval before next photo
    });
  }

  takeNextPhoto();
});



// ✅ Capture Helper Function
function capturePhoto() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.filter = currentFilter;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/png");

  // Thumbnail
  const thumbWrapper = document.createElement("div");
  thumbWrapper.className = "thumbnail-wrapper";

  const thumb = new Image();
  thumb.src = dataUrl;
  thumbWrapper.appendChild(thumb);

  const delBtn = document.createElement("button");
  delBtn.textContent = "✕";
  delBtn.onclick = () => {
    const index = capturedPhotos.findIndex(p => p.src === dataUrl);
    if (index > -1) capturedPhotos.splice(index, 1);
    thumbWrapper.remove();
  };
  thumbWrapper.appendChild(delBtn);

  thumbnailsBox.appendChild(thumbWrapper);

  // Store
  const img = new Image();
  img.src = dataUrl;
  capturedPhotos.push(img);
}
stripButton.addEventListener("click", () => {
  if (capturedPhotos.length === 0) {
    alert("No photos to generate strip!");
    return;
  }

  // Save photos to localStorage
  const imgData = capturedPhotos.map(img => img.src);
  localStorage.setItem("capturedImages", JSON.stringify(imgData));

  // Save user email if needed
  const email = localStorage.getItem("userEmail") || "unknown_user";
  localStorage.setItem("userEmail", email);

  // Redirect to photobooth.html
  window.location.href = "photobooth.html";
});
