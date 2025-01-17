import * as tf from 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs';
import * as handpose from 'https://cdn.jsdelivr.net/npm/@tensorflow-models/hand-pose';
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

let model, video;
let sphere;

// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 5;

// Create a sphere to represent the index finger tip
const geometry = new THREE.SphereGeometry(0.05, 32, 32);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

async function setupCamera() {
    video = document.getElementById('video');

    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then((stream) => {
                video.srcObject = stream;
            })
            .catch((err0r) => {
                console.log("Something went wrong!");
            });
    }
}

async function loadModel() {
    model = await handpose.load();
    console.log('Handpose model loaded.');
    predictWebcam();
}

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

function update3DEffect(landmarks) {
    // Example: Update the position of the sphere at the tip of the index finger
    const indexFingerTip = landmarks[8];
    const [x, y, z] = indexFingerTip;

    // Convert coordinates to Three.js coordinates
    // Assuming the video is 640x480, we scale the coordinates to fit the Three.js scene
    const scaleX = window.innerWidth / 640;
    const scaleY = window.innerHeight / 480;

    sphere.position.set((x - 320) * scaleX, -(y - 240) * scaleY, z);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

setupCamera();
loadModel();
animate();
