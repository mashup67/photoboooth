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
    body {
      margin: 0;
      padding: 20px;
      background: linear-gradient(to bottom, #ffe6f0, #fff);
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }

    .strip-section {
      flex: 1;
      text-align: center;
    }

    canvas {
      margin: 20px auto;
      border: 3px solid black;
      background: white;
      display: block;
    }

    .buttons {
      margin-top: 20px;
    }

    button {
      margin: 10px;
      padding: 10px 20px;
      font-size: 16px;
      border-radius: 10px;
      border: 1px solid #333;
      cursor: pointer;
      background: white;
    }

    .customize-panel {
      width: 300px;
      padding: 20px;
      background-color: #ffeaf5;
      border-left: 2px solid #ccc;
    }

    .customize-panel h2,
    .customize-panel h3 {
      margin: 10px 0;
      text-align: center;
    }

    .customize-panel .filters button {
      display: block;
      width: 100%;
      margin: 6px 0;
    }

    .ghibli-button {
      background-color: white;
      color: #ff69b4;
      border: 2px solid #ff69b4;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="strip-section">
    <h1>📸 Your Photo Strip</h1>
    <canvas id="stripCanvas"></canvas>
    <div class="buttons">
      <button id="download">⬇️ Download Photo Strip</button>
      <button id="download-gif">⬇️ Download GIF</button>
      <button onclick="window.location.href='home.html'">📸 Take New Photos</button>
    </div>
  </div>

  <div class="customize-panel">
    <h2>🎨 Customize your strip</h2>

    <h3>Frame Colour</h3>
    <div class="filters">
      <button onclick="changeBorder('white')">White</button>
      <button onclick="changeBorder('black')">Black</button>
      <button onclick="changeBorder('pink')">Pink</button>
      <button onclick="changeBorder('blue')">Blue</button>
      <button onclick="changeBorder('purple')">Purple</button>
      <button onclick="changeBorder('green')">Green</button>
      <button onclick="changeBorder('yellow')">Yellow</button>
      <button onclick="changeBorder('maroon')">Maroon</button>
      <button onclick="changeBorder('burgundy')">Burgundy</button>
    </div>

    <h3>Stickers</h3>
    <div class="filters">
      <button onclick="addSticker('none')">No Stickers</button>
      <button onclick="addSticker('girlypop')">Girlypop</button>
      <button onclick="addSticker('cute')">Cute</button>
      <button onclick="addSticker('mofucand')">Mofucand</button>
      <button onclick="addSticker('miffy')">Miffy</button>
      <button onclick="addSticker('nctdream')">NCT Dream</button>
    </div>

    <button class="ghibli-button" onclick="window.location.href='payment.html'">🌸 Ghibli Strip (₹15)</button>
  </div>

  <script>
  const canvas = document.getElementById("stripCanvas");
  const ctx = canvas.getContext("2d");
  const imgWidth = 300;
  const imgHeight = 220;
  const spacing = 15;
  const images = ${JSON.stringify(capturedPhotos.map(img => img.src))};
  let selectedSticker = null; // ← sticker image object

  canvas.width = imgWidth + 40;
  canvas.height = (images.length * (imgHeight + spacing)) + 80;

  // 🖼️ Load and set sticker
  function addSticker(name) {
    if (name === "none") {
      selectedSticker = null;
    } else {
      selectedSticker = new Image();
      selectedSticker.src = `stickers/${name}.png`;
      selectedSticker.onload = drawStrip; // redraw after load
    }
    drawStrip();
  }

  function drawStrip() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let y = 20;
    let loaded = 0;

    images.forEach((src, index) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        ctx.drawImage(img, 20, y, imgWidth, imgHeight);

        // ✨ Draw sticker (bottom-right corner of each image)
        if (selectedSticker) {
          const stickerSize = 60;
          ctx.drawImage(
            selectedSticker,
            20 + imgWidth - stickerSize - 10,
            y + imgHeight - stickerSize - 10,
            stickerSize,
            stickerSize
          );
        }

        y += imgHeight + spacing;
        loaded++;
        if (loaded === images.length) drawText();
      };
    });

    function drawText() {
      ctx.fillStyle = "black";
      ctx.font = "18px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "Picapica " + new Date().toLocaleString(),
        canvas.width / 2,
        canvas.height - 30
      );
    }
  }

  drawStrip();

  document.getElementById("download").addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "photo_strip.png";
    link.click();
  });

  // 🔄 Auto-upload to Firebase from parent
  setTimeout(() => {
    const base64 = canvas.toDataURL("image/png");
    if (window.opener && window.opener.savePhotoStrip) {
      window.opener.savePhotoStrip(base64);
    }
  }, 1000);
</script>
</body>
</html>

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
