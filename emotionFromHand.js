const TIP = [4, 8, 12, 16, 20];
const PIP = [3, 6, 10, 14, 18];

function dist2(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/** Whether each finger reads as extended (rotation-tolerant vs wrist). */
export function fingerStates(landmarks) {
  const w = landmarks[0];
  const extended = TIP.map((tip, i) => {
    const pip = PIP[i];
    return dist2(w, landmarks[tip]) > dist2(w, landmarks[pip]) * 1.04;
  });
  return extended;
}

function countExtended(extended) {
  return extended.filter(Boolean).length;
}

/**
 * Map hand pose to a playful “emotion” label + emoji from gesture.
 * (Uses the same camera stream as hands — no separate face model.)
 */
export function inferGestureEmotion(landmarks) {
  const ext = fingerStates(landmarks);
  const [t, idx, mid, ring, pinky] = ext;
  const n = countExtended(ext);

  const pinch = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y);

  // Rock on: index + pinky out, middle + ring in
  if (idx && pinky && !mid && !ring) {
    return {
      key: 'rock',
      emoji: '🤘',
      label: 'Electric',
      mood: 'Wild & free',
    };
  }

  // Peace / V
  if (idx && mid && !ring && !pinky) {
    return {
      key: 'peace',
      emoji: '✌️',
      label: 'Peaceful',
      mood: 'Easy & calm',
    };
  }

  // OK sign: thumb–index pinch, others extended or neutral
  if (pinch < 0.06 && (mid || ring || pinky)) {
    return {
      key: 'ok',
      emoji: '😌',
      label: 'All good',
      mood: 'Relaxed',
    };
  }

  if (pinch < 0.045) {
    return {
      key: 'ok',
      emoji: '😌',
      label: 'Focused',
      mood: 'In the zone',
    };
  }

  // Finger-count moods
  if (n === 5) {
    return {
      key: 'open',
      emoji: '🤩',
      label: 'Joyful',
      mood: 'Hands wide open',
    };
  }
  if (n === 4 && !t) {
    return {
      key: 'wave',
      emoji: '👋',
      label: 'Friendly',
      mood: 'Warm hello',
    };
  }
  if (n === 3) {
    return {
      key: 'playful',
      emoji: '😊',
      label: 'Playful',
      mood: 'Light & fun',
    };
  }
  if (n === 2) {
    return {
      key: 'duo',
      emoji: '🙂',
      label: 'Curious',
      mood: 'Exploring',
    };
  }
  if (n === 1 && idx) {
    return {
      key: 'point',
      emoji: '👉',
      label: 'Intent',
      mood: 'Pointing the way',
    };
  }
  if (n <= 1) {
    return {
      key: 'calm',
      emoji: '😌',
      label: 'Calm',
      mood: 'Quiet focus',
    };
  }

  return {
    key: 'expressive',
    emoji: '🔥',
    label: 'Expressive',
    mood: 'Keep moving',
  };
}
