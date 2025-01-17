import * as tf from 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs';
import * as handpose from 'https://cdn.jsdelivr.net/npm/@tensorflow-models/hand-pose';
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

let model, video, canvas, ctx;

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
            await model.estimateHands(video).then(predictions => {
                if (predictions.length > 0) {
                    const hand = predictions[0];
                    const landmarks = hand.landmarks;
                    update3DEffect(landmarks);
                }
            });
        }
        await tf.nextFrame();
    }
}

function update3DEffect(landmarks) {
    // Example: Create a 3D sphere at the tip of the index finger
    const indexFingerTip = landmarks[8];
    const [x, y, z] = indexFingerTip;

    // Convert coordinates to Three.js coordinates
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    sphere.position.set(x, -y, z);

    // Add the sphere to the scene
    scene.add(sphere);
}

// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

setupCamera();
loadModel();
animate();
