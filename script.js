const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureButton = document.getElementById("capture");
const saveButton = document.getElementById("save");
const stripButton = document.getElementById("generate-strip");
const photoStrip = document.getElementById("photo-strip");

const ctx = canvas.getContext("2d");
let capturedPhotos = [];
let currentFilter = "none";

// ✅ Webcam Start
navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
        video.srcObject = stream;
    })
    .catch((error) => {
        console.error("Error accessing webcam:", error);
    });

// ✅ Filters Apply
function applyFilter(filterClass) {
    const dummyElement = document.createElement("div");
    dummyElement.className = filterClass;
    document.body.appendChild(dummyElement);
    currentFilter = getComputedStyle(dummyElement).filter;
    document.body.removeChild(dummyElement);
    video.style.filter = currentFilter;
}

// ✅ Photo Capture
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

// ✅ Generate Strip and Upload to Firebase
stripButton.addEventListener("click", () => {
    if (capturedPhotos.length === 0) {
        alert("No photos captured!");
        return;
    }

    const newWindow = window.open("", "_blank");
    const images = capturedPhotos.map(img => img.src);

    newWindow.document.write(`
        <html>
        <head>
            <title>Photo Strip</title>
            <style>
                body { text-align: center; font-family: Arial, sans-serif; background-color: pink; }
                .strip-container { padding: 20px; }
                canvas { display: block; margin: auto; border: 3px solid black; background: pink; }
                .color-picker { margin-top: 10px; }
                button { padding: 10px; font-size: 16px; margin: 10px; cursor: pointer; }
            </style>
        </head>
        <body>
            <h1>📸 Your Photo Strip 📸</h1>
            <div class="strip-container">
                <canvas id="stripCanvas"></canvas>
            </div>
            <label class="color-picker">Choose Background: 
                <input type="color" id="bgColorPicker" value="#ffffff">
            </label>
            <button id="download">Download Strip</button>
            <script type="module">
                import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
                import { getStorage, ref as storageRef, uploadString } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";
                import { getDatabase, ref as dbRef, set, push } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

                const firebaseConfig = {
                    apiKey: "YOUR_API_KEY",
                    authDomain: "YOUR_AUTH_DOMAIN",
                    projectId: "YOUR_PROJECT_ID",
                    storageBucket: "YOUR_BUCKET.appspot.com",
                    databaseURL: "https://YOUR_BUCKET.firebaseio.com"
                };

                const app = initializeApp(firebaseConfig);
                const storage = getStorage(app);
                const database = getDatabase(app);

                const canvas = document.getElementById("stripCanvas");
                const ctx = canvas.getContext("2d");
                const imgWidth = 300;
                const imgHeight = 220;
                const spacing = 15;
                const stripHeight = (${images.length} * (imgHeight + spacing)) + 80;

                canvas.width = imgWidth + 40;
                canvas.height = stripHeight;

                function drawStrip(bgColor = "#ffffff") {
                    ctx.fillStyle = bgColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    let yPos = 20;
                    let loadedCount = 0;
                    const imageData = ${JSON.stringify(images)};
                    
                    imageData.forEach((src, index) => {
                        const img = new Image();
                        img.src = src;
                        img.onload = () => {
                            ctx.drawImage(img, 20, yPos, imgWidth, imgHeight);
                            yPos += imgHeight + spacing;
                            loadedCount++;
                            if (loadedCount === imageData.length) drawText();
                        };
                    });

                    function drawText() {
                        const timestamp = new Date().toLocaleString();
                        ctx.fillStyle = "black";
                        ctx.font = "18px Arial";
                        ctx.textAlign = "center";
                        ctx.fillText("Picapica " + timestamp, canvas.width / 2, stripHeight - 30);
                    }
                }

                drawStrip();

                document.getElementById("bgColorPicker").addEventListener("input", (e) => {
                    drawStrip(e.target.value);
                });

                document.getElementById("download").addEventListener("click", () => {
                    const dataUrl = canvas.toDataURL("image/png");

                    const link = document.createElement("a");
                    link.href = dataUrl;
                    link.download = "photo_strip.png";
                    link.click();

                    // ✅ Upload to Firebase
                    const email = localStorage.getItem("userEmail") || "unknown_user";
                    const fileName = \`strip_\${Date.now()}.png\`;
                    const storagePath = \`photo_strips/\${email}/\${fileName}\`;
                    const imageRef = storageRef(storage, storagePath);

                    uploadString(imageRef, dataUrl, 'data_url')
                        .then(() => {
                            const dbPath = dbRef(database, "payments/" + email.replace('.', '_'));
                            const newEntry = push(dbPath);
                            return set(newEntry, {
                                email,
                                fileName,
                                imageUrl: \`gs://\${firebaseConfig.storageBucket}/\${storagePath}\`,
                                timestamp: new Date().toISOString(),
                                paid: true
                            });
                        })
                        .then(() => {
                            alert("✅ Strip uploaded & linked with payment!");
                        })
                        .catch(console.error);
                });
            </script>
        </body>
        </html>
    `);
});
