import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getStorage, ref as storageRef, uploadString } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";
import { getDatabase, ref as dbRef, set, push } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const database = getDatabase(app);

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const captureButton = document.getElementById("capture");
const stripButton = document.getElementById("generate-strip");
const photoStrip = document.getElementById("photo-strip");

let capturedPhotos = [];
let currentFilter = "none";

// ✅ Start Webcam
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => {
    console.error("Webcam error:", err);
  });

// ✅ Apply Filter
window.applyFilter = function (filterClass) {
  const dummy = document.createElement("div");
  dummy.className = filterClass;
  document.body.appendChild(dummy);
  currentFilter = getComputedStyle(dummy).filter;
  document.body.removeChild(dummy);
  video.style.filter = currentFilter;
};

// ✅ Capture Image
captureButton.addEventListener("click", () => {
  if (capturedPhotos.length >= 4) {
    alert("Maximum 4 photos allowed!");
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.filter = currentFilter;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  let img = new Image();
  img.src = canvas.toDataURL("image/png");
  img.dataset.filter = currentFilter;

  capturedPhotos.push(img);
  photoStrip.appendChild(img);
});

// ✅ Generate Photo Strip and Upload
stripButton.addEventListener("click", () => {
  if (capturedPhotos.length === 0) {
    alert("No photos captured!");
    return;
  }

  const newWindow = window.open("", "_blank");
  newWindow.document.write(`
    <html>
    <head>
      <title>Photo Strip</title>
      <style>
        body { text-align: center; font-family: Arial; background-color: pink; }
        canvas { display: block; margin: 20px auto; border: 3px solid black; background: white; }
        button { padding: 10px; font-size: 16px; margin: 10px; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>📸 Your Photo Strip 📸</h1>
      <canvas id="stripCanvas"></canvas>
      <button id="download">Download Strip</button>
      <script>
        const canvas = document.getElementById("stripCanvas");
        const ctx = canvas.getContext("2d");
        const imgWidth = 300;
        const imgHeight = 220;
        const spacing = 15;
        const stripHeight = (${capturedPhotos.length} * (imgHeight + spacing)) + 80;
        canvas.width = imgWidth + 40;
        canvas.height = stripHeight;

        function drawStrip() {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          let yPos = 20;
          const images = ${JSON.stringify(capturedPhotos.map(img => img.src))};
          let loaded = 0;

          images.forEach((src, index) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
              ctx.drawImage(img, 20, yPos, imgWidth, imgHeight);
              yPos += imgHeight + spacing;
              loaded++;
              if (loaded === images.length) drawText();
            };
          });

          function drawText() {
            ctx.fillStyle = "black";
            ctx.font = "18px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Picapica " + new Date().toLocaleString(), canvas.width / 2, canvas.height - 30);
          }
        }

        drawStrip();

        document.getElementById("download").addEventListener("click", () => {
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = "photo_strip.png";
          link.click();
        });

        // ✅ Upload to Firebase via parent
        setTimeout(() => {
          const base64 = canvas.toDataURL("image/png");
          if (window.opener && window.opener.savePhotoStrip) {
            window.opener.savePhotoStrip(base64);
          }
        }, 1500);
      </script>
    </body>
    </html>
  `);
});

// ✅ Upload Function
window.savePhotoStrip = async function (base64Image) {
  const email = localStorage.getItem("userEmail") || "unknown_user";
  const fileName = `strip_${Date.now()}.png`;
  const path = `photo_strips/${email}/${fileName}`;
  const imageRef = storageRef(storage, path);
  await uploadString(imageRef, base64Image, 'data_url');

  const dbPath = dbRef(database, "payments/" + email.replace('.', '_'));
  const newEntry = push(dbPath);
  await set(newEntry, {
    email,
    fileName,
    imageUrl: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${encodeURIComponent(path)}?alt=media`,
    timestamp: new Date().toISOString(),
    paid: true
  });

  alert("✅ Photo strip uploaded and saved to Firebase!");
};
