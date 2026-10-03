import { LEVELS } from '../levels.js';
import { REGIONS } from '../regions.js';
import { COPY } from '../copy.js';

// The S-shaped map of Vietnam shown between levels, drawn as chalk on the
// result board. Places are given as [longitude, latitude] and projected
// flat, so the stops sit roughly where the real cities are.

const SVG_NS = 'http://www.w3.org/2000/svg';
const SCALE = 20;
const WEST = 101.6;
const NORTH = 23.8;

const project = ([lon, lat]) => [(lon - WEST) * SCALE, (NORTH - lat) * SCALE];
const fmt = (n) => n.toFixed(1);

// Coastline and land borders, clockwise from the north-west corner.
const OUTLINE = [
  [102.1, 22.4], [102.5, 22.8], [103.5, 22.6], [104.0, 22.8], [104.8, 23.2], [105.3, 23.3],
  [106.0, 22.9], [106.7, 22.8], [106.6, 22.3], [107.4, 21.7], [108.0, 21.5], [107.1, 20.9],
  [106.6, 20.4], [106.0, 19.8], [105.8, 19.2], [105.7, 18.6], [106.3, 18.0], [106.6, 17.4],
  [107.2, 16.8], [107.6, 16.5], [108.2, 16.1], [108.4, 15.8], [108.8, 15.2], [109.1, 14.2],
  [109.3, 13.0], [109.2, 12.2], [109.1, 11.6], [108.8, 11.2], [108.1, 10.9], [107.3, 10.4],
  [106.8, 10.2], [106.4, 9.6], [105.8, 9.2], [105.2, 8.6], [104.8, 8.7], [104.9, 9.6],
  [104.5, 10.4], [105.1, 10.9], [106.0, 11.0], [106.4, 11.7], [107.0, 12.0], [107.5, 12.6],
  [107.5, 14.0], [107.6, 14.6], [107.3, 15.3], [107.2, 15.7], [106.8, 16.3], [106.5, 16.6],
  [106.0, 17.3], [105.6, 17.9], [105.0, 18.6], [104.4, 19.1], [104.0, 19.4], [104.5, 19.7],
  [104.3, 20.0], [103.8, 20.4], [103.0, 21.0], [102.4, 21.6],
];

const ISLANDS = {
  phuQuoc: [[103.85, 10.45], [104.05, 10.4], [104.0, 10.05], [103.9, 10.15]],
};
// Small dots for the two archipelagos, with their labels.
const ARCHIPELAGOS = [
  { name: COPY.map.paracels, at: [111.9, 16.4], dots: [[-0.5, 0.2], [0, 0], [0.4, 0.3], [0.1, -0.4], [0.7, -0.2]] },
  {
    name: COPY.map.spratlys,
    at: [113.6, 9.6],
    dots: [[-0.9, 0.6], [-0.3, 0.3], [0.2, 0.6], [0.6, -0.1], [-0.5, -0.4], [0.1, -0.7], [0.9, 0.4]],
  },
];

// The stops, in route order, and where each label goes.
const STOPS = {
  hanoi: { at: [105.85, 21.03], label: 'left' },
  hue: { at: [107.58, 16.46], label: 'left' },
  hoian: { at: [108.33, 15.88], label: 'right' },
  saigon: { at: [106.2, 11.3], label: 'left' },
  nightmarket: { at: [106.85, 10.45], label: 'right' },
};
// Extra points the route bends through between two stops, to follow the coast.
const VIA = {
  'hanoi>hue': [[105.95, 19.4], [106.75, 17.6]],
  'hoian>saigon': [[108.85, 13.6], [108.4, 11.6]],
};

const stopPoints = () => LEVELS.map((l) => project(STOPS[l.region].at));

// Smooth path through `pts` (Catmull-Rom turned into cubic Béziers).
function smoothPath(pts) {
  let d = `M${fmt(pts[0][0])} ${fmt(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const [p1, p2] = [pts[i], pts[i + 1]];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${fmt(c1[0])} ${fmt(c1[1])} ${fmt(c2[0])} ${fmt(c2[1])} ${fmt(p2[0])} ${fmt(p2[1])}`;
  }
  return d;
}

function legPath(from, to) {
  const via = VIA[`${LEVELS[from].region}>${LEVELS[to].region}`] ?? [];
  const pts = stopPoints();
  return smoothPath([pts[from], ...via.map(project), pts[to]]);
}

function polygon(points) {
  return points.map((p) => project(p).map(fmt).join(',')).join(' ');
}

function svgEl(tag, attrs = {}, text) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text != null) node.textContent = text;
  return node;
}

// The mascot: big head, red eyes, nón lá, drawn around (0, 0).
const MASCOT = `
  <g class="wings"><ellipse cx="-7" cy="-3" rx="7" ry="4" transform="rotate(-25 -7 -3)"/><ellipse cx="7" cy="-3" rx="7" ry="4" transform="rotate(25 7 -3)"/></g>
  <ellipse cx="0" cy="6" rx="4.5" ry="5.5" fill="#22262b"/>
  <path d="M-4 5h8M-4 8h8" stroke="#4f5d57" stroke-width="1"/>
  <circle cx="0" cy="-2" r="6.5" fill="#22262b"/>
  <circle cx="-3.4" cy="-2" r="3" fill="#b3262b"/><circle cx="3.4" cy="-2" r="3" fill="#b3262b"/>
  <circle cx="-2.6" cy="-2.9" r="0.9" fill="#fff"/><circle cx="4.2" cy="-2.9" r="0.9" fill="#fff"/>
  <path d="M-1.6 2.3q1.6 1.4 3.2 0" stroke="#f2d0c4" stroke-width="0.9" fill="none" stroke-linecap="round"/>
  <path d="M-10 -6L0 -15L10 -6Z" fill="#ecd38c" stroke="#8a6a2a" stroke-width="0.7" stroke-linejoin="round"/>
  <path d="M-4.5 -10.5L4.5 -10.5" stroke="#c9b06a" stroke-width="0.6"/>
  <path d="M-7.5 -6.6h15" stroke="#c9452f" stroke-width="1.3"/>`;

const FLIGHT_MS = 1800;
const TAKEOFF_MS = 450;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

// Builds the map after finishing level `done` (0-based). The fly travels
// to the next stop on real time, so it doesn't depend on the frame rate;
// the map gets `data-arrived` once it lands. With `done` on the last
// level it simply sits on the final stop.
export function journeyMap(done) {
  const pts = stopPoints();
  const last = done >= LEVELS.length - 1;
  const next = last ? done : done + 1;

  const xs = [...OUTLINE.map((p) => project(p)[0]), project([115, 0])[0]];
  const ys = [...OUTLINE.map((p) => project(p)[1]), project([0, 8.4])[1]];
  const root = svgEl('svg', {
    class: 'journey-map',
    viewBox: `${fmt(Math.min(...xs) - 10)} ${fmt(Math.min(...ys) - 10)} ${fmt(Math.max(...xs) - Math.min(...xs) + 20)} ${fmt(Math.max(...ys) - Math.min(...ys) + 20)}`,
    role: 'img',
    'aria-label': COPY.map.label,
  });

  root.append(svgEl('polygon', { class: 'land', points: polygon(OUTLINE) }));
  for (const island of Object.values(ISLANDS)) root.append(svgEl('polygon', { class: 'land', points: polygon(island) }));
  for (const group of ARCHIPELAGOS) {
    const [cx, cy] = project(group.at);
    for (const [dx, dy] of group.dots) root.append(svgEl('circle', { class: 'islet', cx: fmt(cx + dx * 6), cy: fmt(cy + dy * 6), r: 1.4 }));
    root.append(svgEl('text', { class: 'islands', x: fmt(cx), y: fmt(cy + 15), 'text-anchor': 'middle' }, group.name));
  }

  // The whole route, then the legs already flown on top of it.
  for (let i = 0; i < LEVELS.length - 1; i++) {
    root.append(svgEl('path', { class: i < done ? 'route flown' : 'route', d: legPath(i, i + 1) }));
  }
  const leg = last ? null : svgEl('path', { class: 'route flying', d: legPath(done, next) });
  if (leg) root.append(leg);

  LEVELS.forEach((level, i) => {
    const [x, y] = pts[i];
    const state = i <= done ? 'done' : i === next ? 'next' : 'ahead';
    const right = STOPS[level.region].label === 'right';
    const g = svgEl('g', { class: `stop ${state}`, 'data-stop': level.region });
    g.append(svgEl('circle', { class: 'ring', cx: fmt(x), cy: fmt(y), r: 8 }));
    g.append(svgEl('circle', { class: 'dot', cx: fmt(x), cy: fmt(y), r: 4.5 }));
    if (state === 'done') g.append(svgEl('path', { class: 'tick', d: `M${fmt(x - 2.4)} ${fmt(y)}l1.7 1.9 3.2-3.8` }));
    const label = svgEl('text', { x: fmt(x + (right ? 11 : -11)), y: fmt(y + 4), 'text-anchor': right ? 'start' : 'end' });
    label.append(svgEl('tspan', { class: 'num' }, `${i + 1}. `), REGIONS[level.region].name);
    g.append(label);
    root.append(g);
  });

  const fly = svgEl('g', { class: 'map-fly' });
  const body = svgEl('g', { class: 'map-fly-body' });
  body.innerHTML = MASCOT;
  fly.append(body);
  root.append(fly);

  const place = (x, y, facing) => {
    fly.setAttribute('transform', `translate(${fmt(x)} ${fmt(y - 17)}) scale(1.35)`);
    body.setAttribute('transform', `scale(${facing < 0 ? -1 : 1} 1)`);
  };
  const arrive = () => {
    const [x, y] = pts[next];
    place(x, y, 1);
    root.setAttribute('data-arrived', '');
  };

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (last || reduced) {
    arrive();
    if (leg) leg.style.strokeDashoffset = '0';
    return root;
  }

  place(...pts[done], 1);
  const start = performance.now();
  const step = (now) => {
    if (!root.isConnected && now - start > 100) return; // board was closed
    const t = Math.min(1, Math.max(0, (now - start - TAKEOFF_MS) / FLIGHT_MS));
    const len = leg.getTotalLength();
    const at = leg.getPointAtLength(ease(t) * len);
    const ahead = leg.getPointAtLength(Math.min(len, ease(t) * len + 1));
    leg.style.strokeDasharray = `${len}`;
    leg.style.strokeDashoffset = `${len * (1 - ease(t))}`;
    // A gentle bob while flying.
    place(at.x, at.y - Math.sin(t * Math.PI) * 6, ahead.x - at.x < -0.05 ? -1 : 1);
    if (t < 1) requestAnimationFrame(step);
    else arrive();
  };
  requestAnimationFrame(step);
  return root;
}
