/** Electric laser hues per fingertip (thumb → pinky): cyan / blue / violet / aqua / magenta */
const FINGER_HUES = [188, 205, 275, 168, 302];

const EMOTION_HUE_SHIFT = {
  rock: 12,
  peace: -8,
  ok: -15,
  open: 18,
  wave: 6,
  playful: 14,
  duo: 0,
  point: -12,
  calm: -22,
  expressive: 20,
};

export function hueForFinger(fingerIndex, emotionKey) {
  const hue = FINGER_HUES[fingerIndex % 5];
  const shift = EMOTION_HUE_SHIFT[emotionKey] ?? 0;
  return (hue + shift + 360) % 360;
}
