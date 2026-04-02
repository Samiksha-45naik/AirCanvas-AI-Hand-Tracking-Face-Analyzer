import '@mediapipe/hands/hands.js';
import '@mediapipe/camera_utils/camera_utils.js';

const getHands = () => globalThis.Hands;
const getCamera = () => globalThis.Camera;

export class HandTracking {
    constructor(videoElement, onResults) {
        const Hands = getHands();
        const Camera = getCamera();
        if (!Hands || !Camera) {
            throw new Error('MediaPipe Hands/Camera failed to load');
        }
        this.videoElement = videoElement;
        this.onResults = onResults;
        
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults(this.onResults);

        this.camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await this.hands.send({ image: this.videoElement });
            },
            width: 1280,
            height: 720
        });
    }

    start() {
        this.camera.start();
    }

    stop() {
        this.camera.stop();
    }
}
