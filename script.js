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

  let count = 0;

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

  function showCountdown(i, cb) {
    countdownOverlay.textContent = i;
    setTimeout(() => {
      if (i > 1) showCountdown(i - 1, cb);
      else {
        countdownOverlay.remove();
        cb();
      }
    }, 1000);
  }

  const interval = setInterval(() => {
    if (count >= 4) {
      clearInterval(interval);
      return;
    }

    showCountdown(3, () => {
      capturePhoto();
      count++;
    });

  }, 4000); // 3s countdown + 1s buffer
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

// ✅ Generate Strip
stripButton.addEventListener("click", () => {
  if (capturedPhotos.length === 0) {
    alert("No photos to generate strip!");
    return;
  }

  const newWindow = window.open("", "_blank");
  const imgData = capturedPhotos.map(img => img.src);

  newWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Customize Photo Strip</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background-color: #f0f0f0;
      text-align: center;
      padding: 30px;
    }
    canvas {
      border: 8px solid #000;
      border-radius: 10px;
      background-color: white;
    }
    .color-buttons {
      margin: 20px auto;
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .color-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid #fff;
      cursor: pointer;
      box-shadow: 0 0 5px rgba(0,0,0,0.3);
    }
    #downloadBtn {
      margin-top: 20px;
      padding: 12px 24px;
      font-size: 16px;
      background-color: hotpink;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    #downloadBtn:hover {
      background-color: deeppink;
    }
  </style>
</head>
<body>
  <h2>Customize Your Photo Strip</h2>

  <div class="color-buttons">
    <div class="color-btn" style="background: white;" data-color="#ffffff"></div>
    <div class="color-btn" style="background: pink;" data-color="#ffc0cb"></div>
    <div class="color-btn" style="background: lightblue;" data-color="#add8e6"></div>
    <div class="color-btn" style="background: lightyellow;" data-color="#ffffe0"></div>
    <div class="color-btn" style="background: lightgreen;" data-color="#90ee90"></div>
    <div class="color-btn" style="background: black;" data-color="#000000"></div>
  </div>

  <canvas id="stripCanvas"></canvas>
  <br/>
  <button id="downloadBtn">⬇️ Download Photo Strip</button>

  <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-storage-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-database-compat.js"></script>

  <script>
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

    const canvas = document.getElementById("stripCanvas");
    const ctx = canvas.getContext("2d");
    const downloadBtn = document.getElementById("downloadBtn");

    const images = JSON.parse(localStorage.getItem("capturedImages") || "[]");
    const email = localStorage.getItem("userEmail") || "unknown_user";
    let selectedColor = "#ffffff";

    function drawStrip() {
      const imgWidth = 300;
      const imgHeight = 220;
      const spacing = 15;

      canvas.width = imgWidth + 40;
      canvas.height = (images.length * (imgHeight + spacing)) + 80;

      ctx.fillStyle = selectedColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let y = 20;
      let loaded = 0;

      images.forEach((src, i) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          ctx.drawImage(img, 20, y, imgWidth, imgHeight);
          y += imgHeight + spacing;
          loaded++;
          if (loaded === images.length) {
            ctx.fillStyle = selectedColor === "#000000" ? "#fff" : "#000";
            ctx.font = "18px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Picapica " + new Date().toLocaleString(), canvas.width / 2, canvas.height - 30);
          }
        };
      });
    }

    drawStrip();

    // ✅ Handle frame color change
    document.querySelectorAll(".color-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedColor = btn.dataset.color;
        drawStrip();
      });
    });

    // ✅ Download & Upload
    downloadBtn.addEventListener("click", async () => {
      const base64 = canvas.toDataURL("image/png");
      const fileName = `strip_${Date.now()}.png`;
      const path = `photo_strips/${email}/${fileName}`;
      const ref = storage.ref(path);

      try {
        await ref.putString(base64, "data_url");
        const imageUrl = await ref.getDownloadURL();

        const entryRef = database.ref("payments/" + email.replace(/\./g, "_")).push();
        await entryRef.set({
          email: email,
          fileName: fileName,
          imageUrl: imageUrl,
          timestamp: new Date().toISOString(),
          color: selectedColor,
          paid: true
        });

        alert("✅ Strip uploaded with selected color!");
      } catch (err) {
        console.error("Upload failed:", err);
        alert("❌ Upload failed.");
      }

      // download
      const link = document.createElement("a");
      link.href = base64;
      link.download = "photo_strip.png";
      link.click();
    });
  </script>
</body>
</html>
  `);
});
