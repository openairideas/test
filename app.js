import * as tf from 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs';
import * as handpose from 'https://cdn.jsdelivr.net/npm/@tensorflow-models/hand-pose';
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

let model, video;
let sphere;

// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000); // Set background to black
document.body.appendChild(renderer.domElement);

// Position the camera
camera.position.set(0, 0, 5);
camera.lookAt(0, 0, 0);

// Create a sphere to represent the index finger tip
const geometry = new THREE.SphereGeometry(0.1, 32, 32);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Set up the video feed
async function setupCamera() {
    video = document.getElementById('video');

    if (navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
            await video.play();
            console.log('Video feed started.');
        } catch (error) {
            console.error('Error accessing the camera:', error);
        }
    }
}

// Load the handpose model
async function loadModel() {
    model = await handpose.load();
    console.log('Handpose model loaded.');
    predictWebcam();
}

// Predict hand landmarks from the video feed
async function predictWebcam() {
    while (true) {
        if (video.readyState === 4) {
            const predictions = await model.estimateHands(video);
            if (predictions.length > 0) {
                const hand = predictions[0];
                const landmarks = hand.landmarks;
                update3DEffect(landmarks);
            }
        }
        await tf.nextFrame();
    }
}

// Update the 3D effect based on hand landmarks
function update3DEffect(landmarks) {
    const indexFingerTip = landmarks[8]; // Landmark 8 is the tip of the index finger
    const [x, y, z] = indexFingerTip;

    // Map video coordinates (640x480) to Three.js coordinates
    const scaleX = (x - 320) / 320; // Normalize to [-1, 1]
    const scaleY = (240 - y) / 240; // Normalize to [-1, 1]
    const scaleZ = z / 100; // Adjust Z scaling as needed

    sphere.position.set(scaleX * 5, scaleY * 5, scaleZ); // Scale to fit the scene
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Start everything
setupCamera();
loadModel();
animate();
