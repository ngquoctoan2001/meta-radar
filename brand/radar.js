// Màn hình radar dùng chung cho avatar và ảnh bìa: vệt quét, vòng tròn, chữ thập, vạch chia độ, tia quét, điểm sáng.
// Vẽ vào một phần tử rỗng đặt position: absolute; inset: 0 (kích thước = khung ảnh).
//   drawRadar(el, { cx, cy, r, sweep: 58, blips: [{ deg, r, color, size, label, anchor }] })
// Góc tính theo chiều kim đồng hồ từ hướng 12 giờ; r của điểm sáng tính bằng px.

const CYAN = (a) => `rgb(56 225 255 / ${a})`;

export function drawRadar(el, { cx, cy, r, sweep = 58, blips = [], alpha = 1, labelSize = 25 }) {
  const { width, height } = el.getBoundingClientRect();
  const k = r / 468; // tỉ lệ so với radar gốc của avatar
  const pt = (deg, dist) => {
    const a = (deg * Math.PI) / 180;
    return [cx + dist * Math.sin(a), cy - dist * Math.cos(a)].map((v) => +v.toFixed(1));
  };
  const c = (a) => CYAN(+(a * alpha).toFixed(3));

  // vệt quét: nón màu mờ dần phía sau tia
  const cone = document.createElement('div');
  const cr = r * 1.004;
  Object.assign(cone.style, {
    position: 'absolute', left: `${cx - cr}px`, top: `${cy - cr}px`, width: `${cr * 2}px`, height: `${cr * 2}px`,
    borderRadius: '50%',
    background: `conic-gradient(from ${sweep - 95}deg, transparent 0deg, ${c(0.04)} 40deg, ${c(0.16)} 80deg, ${c(0.34)} 95deg, transparent 95deg)`,
  });

  const [bx, by] = pt(sweep, r);
  let s = `
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="${7 * k}" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <linearGradient id="beam" gradientUnits="userSpaceOnUse" x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}">
        <stop offset="0" stop-color="#38e1ff" stop-opacity="${0.15 * alpha}"/>
        <stop offset="1" stop-color="#9ff3ff" stop-opacity="${alpha}"/>
      </linearGradient>
    </defs>`;

  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c(0.6)}" stroke-width="${4 * k}"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r + 22 * k}" fill="none" stroke="${c(0.16)}" stroke-width="${2 * k}" stroke-dasharray="${3 * k} ${11 * k}"/>`;
  for (const [f, a] of [[0.795, 0.2], [0.577, 0.17], [0.359, 0.14]]) {
    s += `<circle cx="${cx}" cy="${cy}" r="${r * f}" fill="none" stroke="${c(a)}" stroke-width="${2 * k}"/>`;
  }
  for (const d of [0, 90, 180, 270]) {
    const [x1, y1] = pt(d, 60 * k), [x2, y2] = pt(d, r);
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c(0.16)}" stroke-width="${2 * k}"/>`;
  }
  for (let d = 0; d < 360; d += 5) {
    const major = d % 30 === 0;
    const [x1, y1] = pt(d, r - (major ? 30 : 14) * k), [x2, y2] = pt(d, r);
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c(major ? 0.75 : 0.35)}" stroke-width="${(major ? 4 : 2) * k}"/>`;
  }
  s += `<line x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}" stroke="url(#beam)" stroke-width="${5 * k}" stroke-linecap="round" filter="url(#glow)"/>`;

  // điểm sáng: xanh = buff, hồng = nerf, vàng = điều chỉnh
  for (const b of blips) {
    const [x, y] = pt(b.deg, b.r);
    const z = b.size * k;
    s += `<circle cx="${x}" cy="${y}" r="${z * 3.6}" fill="none" stroke="${b.color}" stroke-opacity="0.22" stroke-width="${2 * k}"/>`;
    s += `<circle cx="${x}" cy="${y}" r="${z * 2.1}" fill="${b.color}" fill-opacity="0.16" stroke="${b.color}" stroke-opacity="0.55" stroke-width="${2 * k}"/>`;
    s += `<circle cx="${x}" cy="${y}" r="${z}" fill="${b.color}" filter="url(#glow)"/>`;
    if (b.label) {
      const dx = (b.anchor === 'end' ? -1 : 1) * z * 4.6;
      s += `<text x="${(x + dx).toFixed(1)}" y="${(y + labelSize * 0.36).toFixed(1)}" fill="${b.color}" text-anchor="${b.anchor ?? 'start'}"
        style="font: 700 ${labelSize}px/1 var(--f-hud); letter-spacing: 0.2em">${b.label}</text>`;
    }
  }
  s += `<circle cx="${cx}" cy="${cy}" r="${7 * k}" fill="${c(0.9)}"/>`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  Object.assign(svg.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
  svg.innerHTML = s;
  el.replaceChildren(cone, svg);
}

// Chờ tải đủ font (+ các việc khác, vd tải ảnh) rồi mới báo sẵn sàng để chụp (scripts/render-brand.mjs đợi window.__READY__).
export function markReady(...waits) {
  Promise.all([...document.fonts].map((f) => f.load().catch(() => {})))
    .then(() => Promise.all([document.fonts.ready, ...waits]))
    .then(() => { window.__READY__ = 'ok'; })
    .catch((err) => { window.__ERROR__ = String(err); window.__READY__ = 'error'; });
}
