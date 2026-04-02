import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const WASM_VER = '0.10.21';
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${WASM_VER}/wasm`;
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

/** Blendshapes that are noisy for “notifications” (blinks, gaze). */
const IGNORE_TOP_BLENDSHAPES = new Set([
  '_neutral',
  'neutral',
  'eyeBlinkLeft',
  'eyeBlinkRight',
  'eyeLookDownLeft',
  'eyeLookDownRight',
  'eyeLookInLeft',
  'eyeLookInRight',
  'eyeLookOutLeft',
  'eyeLookOutRight',
  'eyeLookUpLeft',
  'eyeLookUpRight',
  'mouthClose',
  'mouthRollLower',
  'mouthRollUpper',
]);

function buildScoreMap(classifications) {
  const map = {};
  if (!classifications?.categories) return map;
  for (const c of classifications.categories) {
    map[c.categoryName] = c.score;
  }
  return map;
}

function getTopCategory(classifications) {
  if (!classifications?.categories?.length) return null;
  const sorted = [...classifications.categories].sort((a, b) => b.score - a.score);
  return sorted[0];
}

/**
 * Friendly line from blendshape scores. Thresholds are intentionally moderate —
 * MediaPipe scores are often lower than “obvious” in the mirror.
 */
export function commentFromBlendshapes(classifications) {
  const m = buildScoreMap(classifications);

  const smileAvg = ((m.mouthSmileLeft ?? 0) + (m.mouthSmileRight ?? 0)) / 2;
  const smile = Math.max(smileAvg, m.mouthSmile ?? 0);
  const jaw = m.jawOpen ?? 0;
  const frown = ((m.mouthFrownLeft ?? 0) + (m.mouthFrownRight ?? 0)) / 2;
  const browUp = m.browInnerUp ?? 0;
  const squint = ((m.eyeSquintLeft ?? 0) + (m.eyeSquintRight ?? 0)) / 2;
  const pucker = m.mouthPucker ?? 0;
  const cheek = m.cheekPuff ?? 0;
  const sneer = ((m.noseSneerLeft ?? 0) + (m.noseSneerRight ?? 0)) / 2;

  if (jaw > 0.35) {
    return {
      id: 'surprised',
      title: 'Surprise',
      text: 'Whoa — that surprise reads loud and clear!',
    };
  }
  if (smile > 0.22) {
    return {
      id: 'smile',
      title: 'Smile',
      text: 'Nice smile — keep that energy going.',
    };
  }
  if (frown > 0.22) {
    return {
      id: 'concern',
      title: 'Concern',
      text: 'Take a breath — you’ve got this.',
    };
  }
  if (browUp > 0.25) {
    return {
      id: 'curious',
      title: 'Curiosity',
      text: 'Curious brows — something on your mind?',
    };
  }
  if (pucker > 0.22 || cheek > 0.22) {
    return {
      id: 'playful',
      title: 'Playful',
      text: 'Playful face — having fun with it!',
    };
  }
  if (squint > 0.2) {
    return {
      id: 'focus',
      title: 'Focus',
      text: 'Locked in — focus mode activated.',
    };
  }
  if (sneer > 0.18) {
    return {
      id: 'intense',
      title: 'Intensity',
      text: 'Intensity detected — channel it your way.',
    };
  }

  const top = getTopCategory(classifications);
  if (!top || top.score < 0.28) return null;
  if (IGNORE_TOP_BLENDSHAPES.has(top.categoryName)) return null;

  const id = `top:${top.categoryName}`;
  const label = top.displayName || top.categoryName.replace(/([A-Z])/g, ' $1').trim();
  return {
    id,
    title: 'Expression',
    text: `Strong cue: ${label} (${Math.round(top.score * 100)}%).`,
  };
}

export async function createFaceLandmarker() {
  const fileset = await FilesetResolver.forVisionTasks(WASM);
  const opts = {
    baseOptions: {
      modelAssetPath: MODEL,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    outputFaceBlendshapes: true,
    minFaceDetectionConfidence: 0.3,
    minFacePresenceConfidence: 0.3,
    minTrackingConfidence: 0.3,
  };
  try {
    return await FaceLandmarker.createFromOptions(fileset, opts);
  } catch {
    return await FaceLandmarker.createFromOptions(fileset, {
      ...opts,
      baseOptions: { ...opts.baseOptions, delegate: 'CPU' },
    });
  }
}
