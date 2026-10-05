// The mascot: big head, red eyes, nón lá, drawn around (0, 0) in a box
// about 28 x 27 units. The journey map flies it between stops; the app icon
// and splash script draws it on the red sign. Wing colours come from the
// page's CSS (.map-fly .wings), or from WINGS where there is no stylesheet.
export const MASCOT = `
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

export const WINGS = { fill: 'rgba(220, 240, 255, 0.75)', stroke: 'rgba(255, 255, 255, 0.9)', strokeWidth: 0.6 };
