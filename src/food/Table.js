const TOP = 0xb5763c;
const TOP_EDGE = 0x8a5228;
const SIDE_LEFT = 0x8a5228;
const SIDE_RIGHT = 0x6e4120;
const LEG = 0x5a361b;
const THICKNESS = 6;
const LEG_W = 6;

// An isometric table. (x, y) is the centre of its footprint on the ground;
// halfWidth is the footprint's horizontal radius, its depth radius is half
// that, and the top surface sits `height` px above the ground.
export class Table {
  constructor(scene, { x, y, halfWidth, height = 28 }) {
    this.x = x;
    this.y = y;
    this.hw = halfWidth;
    this.hd = halfWidth / 2;
    this.height = height;
    // Depth of the table's front corner; anything in front of it draws over.
    this.depth = y + this.hd;

    const g = scene.add.graphics().setDepth(this.depth);
    const top = y - height;
    const left = { x: x - this.hw, y: top };
    const front = { x, y: top + this.hd };
    const right = { x: x + this.hw, y: top };
    const back = { x, y: top - this.hd };

    // Legs at the three visible corners.
    g.fillStyle(LEG, 1);
    g.fillRect(left.x + 8, left.y, LEG_W, height);
    g.fillRect(right.x - 8 - LEG_W, right.y, LEG_W, height);
    g.fillRect(front.x - LEG_W / 2, front.y - 4, LEG_W, height);

    // Tabletop thickness (two visible side faces).
    g.fillStyle(SIDE_LEFT, 1);
    g.fillPoints([left, front, { x: front.x, y: front.y + THICKNESS }, { x: left.x, y: left.y + THICKNESS }], true);
    g.fillStyle(SIDE_RIGHT, 1);
    g.fillPoints([front, right, { x: right.x, y: right.y + THICKNESS }, { x: front.x, y: front.y + THICKNESS }], true);

    // Top surface with an edge outline.
    g.fillStyle(TOP, 1);
    g.fillPoints([back, right, front, left], true);
    g.lineStyle(2, TOP_EDGE, 1);
    g.strokePoints([back, right, front, left], true);
  }

  // Whether a ground-plane point lies within the table's footprint.
  contains(px, py) {
    return Math.abs(px - this.x) / this.hw + Math.abs(py - this.y) / this.hd <= 1;
  }
}
