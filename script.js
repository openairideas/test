// Get DOM elements
const video = document.getElementById('webcam');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
const responseDiv = document.getElementById('response');

// Set canvas dimensions to match video feed
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Three.js variables
let scene, camera, renderer, handObject;

// Function to set up the webcam (with back camera)
async function setupWebcam() {
    try {
        const constraints = {
            video: {
                facingMode: { exact: "environment" } // Use the back camera
            }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                resolve(video);
            };
        });
    } catch (error) {
        console.error("Error accessing the webcam:", error);
        alert("Unable to access the back camera. Please ensure it is connected and permissions are granted.");
    }
}

// Function to load the Handpose model
async function loadHandposeModel() {
    try {
        const model = await handpose.load();
        console.log("Handpose model loaded successfully.");
        return model;
    } catch (error) {
        console.error("Error loading the Handpose model:", error);
        alert("Failed to load the Handpose model. Please check your internet connection.");
    }
}

// Function to initialize Three.js scene
function initThreeJS() {
    // Create a scene
    scene = new THREE.Scene();

    // Create a camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 10); // Adjust camera position to view the scene

    // Create a renderer
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create a 3D object to highlight the hand
    const geometry = new THREE.SphereGeometry(0.2, 32, 32); // Sphere size
    const material = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: false });
    handObject = new THREE.Mesh(geometry, material);
    handObject.position.z = 0; // Set initial Z position to 0
    scene.add(handObject);

    // Add a test cube to verify Three.js is working
    const testGeometry = new THREE.BoxGeometry(1, 1, 1);
    const testMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const testCube = new THREE.Mesh(testGeometry, testMaterial);
    testCube.position.set(0, 0, 0); // Position the test cube at the center
    scene.add(testCube);

    // Add lighting (optional, if using materials that require light)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);
}

// Function to detect hand gestures
async function detectHandGestures(model) {
    if (!model) return;

    // Get hand predictions
    const predictions = await model.estimateHands(video);

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (predictions.length > 0) {
        // Draw hand landmarks
        const landmarks = predictions[0].landmarks;
        drawHand(landmarks);

        // Highlight the hand in 3D
        highlightHandIn3D(landmarks);
    } else {
        responseDiv.textContent = "No hand detected.";
    }

    // Continuously detect gestures
    requestAnimationFrame(() => detectHandGestures(model));
}

// Function to draw hand landmarks on the canvas
function drawHand(landmarks) {
    ctx.fillStyle = 'red';
    for (let i = 0; i < landmarks.length; i++) {
        const [x, y] = landmarks[i];
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI); // Draw a circle for each landmark
        ctx.fill();
    }
}

// Function to highlight the hand in 3D
function highlightHandIn3D(landmarks) {
    // Get the center of the hand (e.g., palm base)
    const palmBase = landmarks[0]; // Palm base landmark

    // Map hand position to 3D object position
    const x = (palmBase[0] / canvas.width) * 10 - 5; // Map X coordinate
    const y = -(palmBase[1] / canvas.height) * 10 + 5; // Map Y coordinate

    // Update 3D object position
    handObject.position.x = x;
    handObject.position.y = y;
    handObject.position.z = 0; // Ensure Z position is 0

    // Log sphere position for debugging
    console.log("Sphere position:", handObject.position);

    // Render the scene
    renderer.render(scene, camera);
}

// Initialize the project
async function init() {
    console.log("Initializing the project...");

    // Set up the webcam (back camera)
    await setupWebcam();
    console.log("Webcam setup complete.");

    // Verify webcam feed is playing
    video.onplay = () => {
        console.log("Webcam feed is playing.");
    };

    // Load the Handpose model
    const model = await loadHandposeModel();
    console.log("Handpose model loaded.");

    // Initialize Three.js
    initThreeJS();
    console.log("Three.js initialized.");

    // Start detecting hand gestures
    detectHandGestures(model);
    console.log("Hand gesture detection started.");
}

// Run the initialization function
init();
