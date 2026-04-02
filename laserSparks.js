/**
 * Single long laser segment: one stroke from (x,y) in direction (dirX, dirY) for beamLength px.
 */
export function drawLaserBeams(
  ctx,
  x,
  y,
  baseHue,
  timeMs,
  fingerIndex,
  dirX,
  dirY,
  beamLength
) {
  const flicker = 0.72 + 0.28 * Math.sin(timeMs * 0.011 + fingerIndex * 1.4);
  const pulse = 0.96 + 0.04 * Math.sin(timeMs * 0.004 + fingerIndex * 0.8);
  const len = beamLength * pulse;

  const x2 = x + dirX * len;
  const y2 = y + dirY * len;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = flicker;

  const g = ctx.createLinearGradient(x, y, x2, y2);
  g.addColorStop(0, `hsla(${baseHue}, 100%, 98%, ${0.98 * flicker})`);
  g.addColorStop(0.12, `hsla(${baseHue}, 100%, 72%, ${0.82 * flicker})`);
  g.addColorStop(0.45, `hsla(${baseHue}, 100%, 52%, ${0.45 * flicker})`);
  g.addColorStop(1, `hsla(${baseHue}, 85%, 42%, 0)`);

  ctx.strokeStyle = g;
  ctx.shadowColor = `hsla(${baseHue}, 100%, 55%, 0.85)`;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.restore();
}

const TRAIL_MAX_AGE_MS = 12000;

/**
 * Draw accumulated path — older segments fade so the drawing reads clearly.
 */
export function drawLaserTrail(ctx, points, nowMs) {
  if (points.length < 2) return;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const ageA = nowMs - a.t;
    const ageB = nowMs - b.t;
    const fadeA = Math.max(0, 1 - ageA / TRAIL_MAX_AGE_MS);
    const fadeB = Math.max(0, 1 - ageB / TRAIL_MAX_AGE_MS);
    const alpha = 0.1 + ((fadeA + fadeB) / 2) * 0.38;
    const h = a.hue;

    ctx.strokeStyle = `hsla(${h}, 100%, 58%, ${alpha})`;
    ctx.shadowColor = `hsla(${h}, 100%, 50%, ${alpha * 0.55})`;
    ctx.shadowBlur = 5;
    ctx.lineWidth = 1.1 + ((fadeA + fadeB) / 2) * 0.85;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  ctx.restore();
}

export { TRAIL_MAX_AGE_MS };
