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

// ✅ Elements
const video = document.getElementById("video");
const captureButton = document.getElementById("captureBtn");
const autoCaptureButton = document.getElementById("autoCaptureBtn");
const stripButton = document.getElementById("generateBtn");
const photoStrip = document.getElementById("photo-strip");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const thumbnailsBox = document.getElementById("thumbnails");

let capturedPhotos = [];
let currentFilter = "none";

// ✅ Start Webcam
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((error) => {
    console.error("Error accessing webcam:", error);
  });

// ✅ Apply Filter Buttons
document.querySelectorAll(".filter-btn").forEach((btn) => {
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

// ✅ Auto Capture 4 Photos with Countdown
autoCaptureButton.addEventListener("click", () => {
  if (capturedPhotos.length > 0) {
    if (!confirm("Old photos will be cleared. Continue?")) return;
    capturedPhotos = [];
    thumbnailsBox.innerHTML = "";
  }

  let count = 0;

  const countdownDiv = document.createElement("div");
  countdownDiv.style.position = "fixed";
  countdownDiv.style.top = "50%";
  countdownDiv.style.left = "50%";
  countdownDiv.style.transform = "translate(-50%, -50%)";
  countdownDiv.style.fontSize = "80px";
  countdownDiv.style.fontWeight = "bold";
  countdownDiv.style.color = "#ff66b2";
  countdownDiv.style.zIndex = "9999";
  document.body.appendChild(countdownDiv);

  function startCountdownAndCapture() {
    let timer = 3;
    countdownDiv.textContent = timer;

    const countdownInterval = setInterval(() => {
      timer--;
      if (timer > 0) {
        countdownDiv.textContent = timer;
      } else {
        clearInterval(countdownInterval);
        countdownDiv.textContent = "📸";
        setTimeout(() => {
          capturePhoto();
          countdownDiv.textContent = "";
          count++;
          if (count < 4) {
            startCountdownAndCapture();
          } else {
            document.body.removeChild(countdownDiv);
          }
        }, 500);
      }
    }, 1000);
  }

  startCountdownAndCapture();
});

// ✅ Capture Logic Function
function capturePhoto() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.filter = currentFilter;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/png");

  // Thumbnail
  const thumbWrapper = document.createElement("div");
  thumbWrapper.classList.add("thumbnail-wrapper");

  const thumbImg = new Image();
  thumbImg.src = dataUrl;

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "✖";
  deleteBtn.onclick = () => {
    thumbnailsBox.removeChild(thumbWrapper);
    capturedPhotos = capturedPhotos.filter(p => p.src !== dataUrl);
  };

  thumbWrapper.appendChild(thumbImg);
  thumbWrapper.appendChild(deleteBtn);
  thumbnailsBox.appendChild(thumbWrapper);

  const img = new Image();
  img.src = dataUrl;
  capturedPhotos.push(img);
}

// ✅ Generate Photo Strip in New Window
stripButton.addEventListener("click", () => {
  if (capturedPhotos.length === 0) {
    alert("No photos captured!");
    return;
  }

  const newWindow = window.open("", "_blank");
  const imgData = capturedPhotos.map((img) => img.src);

  newWindow.document.write(`
    <html>
    <head><title>Photo Strip</title></head>
    <body>
      <script>
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        document.body.appendChild(canvas);

        const images = ${JSON.stringify(imgData)};
        const imgWidth = 300;
        const imgHeight = 220;
        const spacing = 15;
        canvas.width = imgWidth + 40;
        canvas.height = (images.length * (imgHeight + spacing)) + 80;

        function drawStrip() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#fff";
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
                ctx.fillStyle = "black";
                ctx.font = "18px Arial";
                ctx.textAlign = "center";
                ctx.fillText("Picapica " + new Date().toLocaleString(), canvas.width / 2, canvas.height - 30);
              }
            };
          });
        }

        drawStrip();

        // Auto-upload
        setTimeout(() => {
          const base64 = canvas.toDataURL("image/png");
          if (window.opener && window.opener.savePhotoStrip) {
            window.opener.savePhotoStrip(base64);
          }
        }, 1000);

        // Download Button
        const downloadBtn = document.createElement("button");
        downloadBtn.innerText = "⬇️ Download Photo Strip";
        downloadBtn.style.padding = "10px 20px";
        downloadBtn.style.marginTop = "20px";
        downloadBtn.style.fontSize = "16px";
        downloadBtn.onclick = () => {
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = "photo_strip.png";
          link.click();
        };
        document.body.appendChild(downloadBtn);
      <\/script>
    </body>
    </html>
  `);
});

// ✅ Save to Firebase Storage & Database
window.savePhotoStrip = async function (base64Image) {
  try {
    const email = localStorage.getItem("userEmail") || "unknown_user";
    const fileName = `strip_${Date.now()}.png`;
    const path = `photo_strips/${email}/${fileName}`;
    const ref = storage.ref(path);

    await ref.putString(base64Image, "data_url");
    const imageUrl = await ref.getDownloadURL();

    const entryRef = database.ref("payments/" + email.replace(/\./g, "_")).push();
    await entryRef.set({
      email: email,
      fileName: fileName,
      imageUrl: imageUrl,
      timestamp: new Date().toISOString(),
      paid: true
    });

    alert("✅ Strip uploaded & linked with user payment!");
  } catch (error) {
    console.error("❌ Upload failed:", error);
    alert("❌ Upload failed. Try again!");
  }
};
