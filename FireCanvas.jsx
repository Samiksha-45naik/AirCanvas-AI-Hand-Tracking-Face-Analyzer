
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { HandTracking } from '../utils/handTracking';
import { drawLaserBeams, drawLaserTrail, TRAIL_MAX_AGE_MS } from '../utils/laserSparks';
import { inferGestureEmotion } from '../utils/emotionFromHand';
import { hueForFinger } from '../utils/fingerColors';
import { createFaceLandmarker, commentFromBlendshapes } from '../utils/faceExpression';

const FINGERTIPS = [4, 8, 12, 16, 20];
const FINGER_LABELS = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
const FINGER_SHORT = ['T', 'I', 'M', 'R', 'P'];
const DEFAULT_FINGER_ON = () => [true, true, true, true, true];

const NOTIFY_COOLDOWN_MS = 4200;
const MOVE_THRESHOLD_PX = 2;
const DIR_SMOOTH = 0.2;
const TRAIL_MIN_DIST_PX = 4;
const TRAIL_MAX_POINTS = 700;

const FireCanvas = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState(null);
    const [selectedFingers, setSelectedFingers] = useState(DEFAULT_FINGER_ON);
    const trackingRef = useRef(null);
    const faceLandmarkerRef = useRef(null);
    const lastShownFaceIdRef = useRef('');
    const lastNotifyTimeRef = useRef(0);
    const timeRef = useRef(0);
    const prevTipRef = useRef({});
    const smoothDirRef = useRef({});
    const trailRef = useRef({});
    const selectedFingersRef = useRef(DEFAULT_FINGER_ON());

    useEffect(() => {
        selectedFingersRef.current = selectedFingers;
    }, [selectedFingers]);

    useEffect(() => {
        if (!notification) return undefined;
        const timer = window.setTimeout(() => setNotification(null), 6500);
        return () => window.clearTimeout(timer);
    }, [notification]);

    const pushFaceNotification = useCallback((faceResult) => {
        const now = performance.now();

        if (!faceResult?.faceLandmarks?.length) {
            lastShownFaceIdRef.current = '';
            return;
        }

        const blend = faceResult.faceBlendshapes?.[0];
        if (!blend?.categories?.length) {
            return;
        }

        const comment = commentFromBlendshapes(blend);
        if (!comment) {
            lastShownFaceIdRef.current = '';
            return;
        }

        if (
            comment.id === lastShownFaceIdRef.current &&
            now - lastNotifyTimeRef.current < NOTIFY_COOLDOWN_MS
        ) {
            return;
        }

        lastShownFaceIdRef.current = comment.id;
        lastNotifyTimeRef.current = now;
        setNotification({
            text: comment.text,
            id: comment.id,
            title: comment.title ?? 'Expression',
        });
    }, []);

    const eraseDrawing = useCallback(() => {
        trailRef.current = {};
        prevTipRef.current = {};
        smoothDirRef.current = {};
    }, []);

    const toggleFinger = useCallback((index) => {
        setSelectedFingers((prev) => {
            const next = [...prev];
            next[index] = !next[index];
            if (!next[index]) {
                Object.keys(trailRef.current).forEach((k) => {
                    if (k.endsWith(`-${index}`)) {
                        delete trailRef.current[k];
                    }
                });
                Object.keys(prevTipRef.current).forEach((k) => {
                    if (k.endsWith(`-${index}`)) {
                        delete prevTipRef.current[k];
                    }
                });
                Object.keys(smoothDirRef.current).forEach((k) => {
                    if (k.endsWith(`-${index}`)) {
                        delete smoothDirRef.current[k];
                    }
                });
            }
            return next;
        });
    }, []);

    const selectAllFingers = useCallback((value) => {
        setSelectedFingers(FINGER_LABELS.map(() => value));
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let cancelled = false;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            trailRef.current = {};
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        (async () => {
            try {
                const face = await createFaceLandmarker();
                if (!cancelled) {
                    faceLandmarkerRef.current = face;
                }
            } catch (e) {
                console.warn('Face Landmarker unavailable:', e);
            }
        })();

        const onHandsResult = (results) => {
            setIsLoading(false);
            timeRef.current = performance.now();

            const faceLm = faceLandmarkerRef.current;
            if (faceLm && video.readyState >= 2) {
                try {
                    const frameMs =
                        video.currentTime > 0
                            ? video.currentTime * 1000
                            : timeRef.current;
                    const fr = faceLm.detectForVideo(video, frameMs);
                    pushFaceNotification(fr);
                } catch {
                    /* ignore frame */
                }
            }

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);

            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

            const t = timeRef.current;
            const w = canvas.width;
            const h = canvas.height;
            const beamLength = Math.min(w, h) * 0.52;
            const sel = selectedFingersRef.current;

            if (results.multiHandLandmarks?.length) {
                results.multiHandLandmarks.forEach((landmarks, handIndex) => {
                    const e = inferGestureEmotion(landmarks);

                    for (let fi = 0; fi < FINGERTIPS.length; fi++) {
                        if (!sel[fi]) continue;

                        const tip = landmarks[FINGERTIPS[fi]];
                        const cx = tip.x * w;
                        const cy = tip.y * h;
                        const key = `${handIndex}-${fi}`;
                        const hue = hueForFinger(fi, e.key);

                        const trail = trailRef.current[key] ?? [];
                        const lastPt = trail[trail.length - 1];
                        if (
                            !lastPt ||
                            Math.hypot(cx - lastPt.x, cy - lastPt.y) >= TRAIL_MIN_DIST_PX
                        ) {
                            trail.push({ x: cx, y: cy, t, hue });
                            while (trail.length > TRAIL_MAX_POINTS) {
                                trail.shift();
                            }
                        } else {
                            trail[trail.length - 1] = { x: cx, y: cy, t, hue };
                        }
                        trailRef.current[key] = trail;

                        const prev = prevTipRef.current[key];
                        let ux = 0;
                        let uy = -1;

                        if (prev) {
                            const vx = cx - prev.x;
                            const vy = cy - prev.y;
                            const mag = Math.hypot(vx, vy);
                            if (mag > MOVE_THRESHOLD_PX) {
                                ux = vx / mag;
                                uy = vy / mag;
                            } else {
                                const sd = smoothDirRef.current[key];
                                if (sd) {
                                    ux = sd.x;
                                    uy = sd.y;
                                }
                            }
                        }

                        prevTipRef.current[key] = { x: cx, y: cy };

                        const s = smoothDirRef.current[key] ?? { x: 0, y: -1 };
                        let sx = s.x * (1 - DIR_SMOOTH) + ux * DIR_SMOOTH;
                        let sy = s.y * (1 - DIR_SMOOTH) + uy * DIR_SMOOTH;
                        const nm = Math.hypot(sx, sy);
                        if (nm > 1e-6) {
                            sx /= nm;
                            sy /= nm;
                        } else {
                            sx = 0;
                            sy = -1;
                        }
                        smoothDirRef.current[key] = { x: sx, y: sy };
                    }
                });
            }

            Object.keys(trailRef.current).forEach((key) => {
                const fi = Number(key.split('-')[1]);
                if (!sel[fi]) {
                    delete trailRef.current[key];
                    return;
                }
                const trail = trailRef.current[key];
                if (!trail?.length) return;
                while (trail.length && t - trail[0].t > TRAIL_MAX_AGE_MS) {
                    trail.shift();
                }
                if (!trail.length) {
                    delete trailRef.current[key];
                }
            });

            Object.keys(trailRef.current).forEach((key) => {
                const fi = Number(key.split('-')[1]);
                if (!sel[fi]) return;
                const trail = trailRef.current[key];
                if (trail?.length >= 2) {
                    drawLaserTrail(ctx, trail, t);
                }
            });

            if (results.multiHandLandmarks?.length) {
                results.multiHandLandmarks.forEach((landmarks, handIndex) => {
                    const e = inferGestureEmotion(landmarks);
                    for (let fi = 0; fi < FINGERTIPS.length; fi++) {
                        if (!sel[fi]) continue;

                        const tip = landmarks[FINGERTIPS[fi]];
                        const cx = tip.x * w;
                        const cy = tip.y * h;
                        const key = `${handIndex}-${fi}`;
                        const hue = hueForFinger(fi, e.key);
                        const sd = smoothDirRef.current[key] ?? { x: 0, y: -1 };
                        drawLaserBeams(
                            ctx,
                            cx,
                            cy,
                            hue,
                            t,
                            fi,
                            sd.x,
                            sd.y,
                            beamLength
                        );
                    }
                });
            }

            ctx.restore();
        };

        trackingRef.current = new HandTracking(video, onHandsResult);
        trackingRef.current.start();

        return () => {
            cancelled = true;
            window.removeEventListener('resize', resizeCanvas);
            trackingRef.current?.stop();
            faceLandmarkerRef.current = null;
        };
    }, [pushFaceNotification]);

    return (
        <div className="fire-container">
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loader"></div>
                    <p>Loading vision models…</p>
                </div>
            )}
            <video
                ref={videoRef}
                style={{ display: 'none' }}
                playsInline
            />
            <canvas ref={canvasRef} />

            <div className="ui-overlay">
                <h1 className="ui-title">Laser</h1>
                <p className="ui-hint">Use the slim bar on the right. Face cues notify below.</p>
            </div>

            <aside className="controls-panel" aria-label="Laser controls">
                <div className="finger-toggles" role="group" aria-label="Fingers with laser">
                    {FINGER_LABELS.map((label, i) => (
                        <button
                            key={label}
                            type="button"
                            title={label}
                            className={`finger-toggle ${selectedFingers[i] ? 'finger-toggle-on' : ''}`}
                            onClick={() => toggleFinger(i)}
                            aria-pressed={selectedFingers[i]}
                            aria-label={`${label} finger laser`}
                        >
                            {FINGER_SHORT[i]}
                        </button>
                    ))}
                </div>
                <div className="finger-bulk">
                    <button
                        type="button"
                        className="btn-mini"
                        onClick={() => selectAllFingers(true)}
                        title="All fingers"
                    >
                        All
                    </button>
                    <button
                        type="button"
                        className="btn-mini"
                        onClick={() => selectAllFingers(false)}
                        title="No fingers"
                    >
                        Off
                    </button>
                </div>
                <button
                    type="button"
                    className="btn-erase"
                    onClick={eraseDrawing}
                    title="Clear all laser trails"
                >
                    Clear
                </button>
            </aside>

            {notification && (
                <div className="face-toast" role="status">
                    <span className="face-toast-label">Expression · {notification.title}</span>
                    <p className="face-toast-text">{notification.text}</p>
                    <button
                        type="button"
                        className="face-toast-dismiss"
                        onClick={() => setNotification(null)}
                        aria-label="Dismiss notification"
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
};

export default FireCanvas;
