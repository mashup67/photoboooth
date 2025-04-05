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

// ✅ Webapp Code
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

// ✅ Apply Filter Function
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
    alert("Max 4 photos allowed!");
    return;
  }
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.filter = currentFilter;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  const img = new Image();
  img.src = canvas.toDataURL("image/png");
  capturedPhotos.push(img);
  photoStrip.appendChild(img);
});

// ✅ Generate Photo Strip and Open in New Window
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
        body { text-align: center; background: pink; font-family: Arial; }
        canvas { margin: 20px auto; border: 3px solid black; background: white; display: block; }
        button { margin: 10px; padding: 10px; font-size: 16px; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>📸 Your Photo Strip</h1>
      <canvas id="stripCanvas"></canvas>
      <button id="download">Download</button>
      <script>
        const canvas = document.getElementById("stripCanvas");
        const ctx = canvas.getContext("2d");
        const imgWidth = 300;
        const imgHeight = 220;
        const spacing = 15;
        const images = ${JSON.stringify(capturedPhotos.map(img => img.src))};
        canvas.width = imgWidth + 40;
        canvas.height = (images.length * (imgHeight + spacing)) + 80;
        
        function drawStrip() {
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          let y = 20;
          let loaded = 0;
          images.forEach((src, index) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
              ctx.drawImage(img, 20, y, imgWidth, imgHeight);
              y += imgHeight + spacing;
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
        
        // ✅ After drawing, auto-upload the strip to Firebase via the parent window
        setTimeout(() => {
          const base64 = canvas.toDataURL("image/png");
          if (window.opener && window.opener.savePhotoStrip) {
            window.opener.savePhotoStrip(base64);
          }
        }, 1000);
      </script>
    </body>
    </html>
  `);
});

// ✅ Upload Function: Saves the photo strip to Firebase Storage and logs it in Firebase Database
window.savePhotoStrip = async function (base64Image) {
  const email = localStorage.getItem("userEmail") || "unknown_user";
  const fileName = `strip_${Date.now()}.png`;
  const path = `photo_strips/${email}/${fileName}`;
  const ref = storage.ref(path);

  await ref.putString(base64Image, 'data_url');
  
  const imageUrl = await ref.getDownloadURL();
  const entryRef = database.ref("payments/" + email.replace('.', '_')).push();
  await entryRef.set({
    email: email,
    fileName: fileName,
    imageUrl: imageUrl,
    timestamp: new Date().toISOString(),
    paid: true
  });

  alert("✅ Strip uploaded & linked with user payment!");
};
