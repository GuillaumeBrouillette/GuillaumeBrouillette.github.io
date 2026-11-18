// Nearest neighbours and choice of distance.
//
// Web port of the desktop applet visualisation_knn.py: the k nearest
// neighbours of a query point among the points of a synthetic dataset, for
// the Euclidean, Manhattan, Chebyshev or cosine distance, in 2D or in 3D.
// The cloud, its controls and the editing gestures come from the module
// shared by the point-cloud applettes (/applets/cloud.js).
//
// Sections: 1. strings, 2. neighbours, 3. 2D drawing, 4. 3D drawing,
// 5. page wiring.

import {
  THREE, withCloudStrings, editHint, CloudData, QueryControl, CloudView3D, DISTANCES,
  numberField, metricSelect, actionButtons, attachEdit2D, attachEdit3D, formatNumber, saveCanvasPNG,
} from "/applets/cloud.js";

// ---------------------------------------------------------------------------
// 1. Strings
// ---------------------------------------------------------------------------

const STRINGS = withCloudStrings({
  fr: {
    docTitle: "Plus proches voisins selon la distance – Guillaume Brouillette",
    title: "Plus proches voisins selon la distance",
    lead: "Cette applette affiche, parmi les points d'un jeu de données synthétique du plan ou de l'espace, les <i>k</i> plus proches voisins d'un point requête que l'on déplace librement, pour la distance euclidienne, de Manhattan, de Tchebychev ou cosinus.",
    kLabel: "Nombre de voisins <i>k</i>",
    kAria: "Nombre de voisins k",
    canvasAria: "Jeu de données, point requête et plus proches voisins",
    legendPoints: "points du jeu de données",
    legendQuery: "point requête",
    legendNeighbours: "plus proches voisins",
    legendOrigin: "origine",
    status2: "Point requête&nbsp;: ({x}; {y}). {metric} au {rank} voisin&nbsp;: {d}.",
    status3: "Point requête&nbsp;: ({x}; {y}; {z}). {metric} au {rank} voisin&nbsp;: {d}.",
    statusEuclidean: "Distance euclidienne",
    statusCosine: "Distance cosinus",
    statusManhattan: "Distance de Manhattan",
    statusChebyshev: "Distance de Tchebychev",
    fileName: "plus-proches-voisins",
    notesReadTitle: "Lecture de la figure",
    notesRead: "Le point requête, tracé en bleu, n'appartient pas au jeu de données. Il se déplace en le glissant dans la figure ou en entrant ses coordonnées dans le panneau. Ses <i>k</i> plus proches voisins parmi les points du jeu de données, selon la distance choisie, sont tracés en rouge. Pour les distances euclidienne, de Manhattan et de Tchebychev, le tracé en tirets délimite la boule centrée au point requête dont le rayon est la distance au <i>k</i><sup>e</sup> voisin. Tous les voisins se trouvent dans cette boule. En 3D, cette boule est tracée en transparence.",
    notesMetricsTitle: "Quatre distances",
    notesMetricsIntro: "Pour deux points <i>x</i> et <i>y</i>, on note <i>a</i><sub><i>i</i></sub> = |<i>x</i><sub><i>i</i></sub> − <i>y</i><sub><i>i</i></sub>| l'écart entre leurs coordonnées d'indice <i>i</i>.",
    notesEuclidean: "La distance euclidienne est la racine carrée de la somme des <i>a</i><sub><i>i</i></sub>². Ses boules sont des disques dans le plan et des boules rondes dans l'espace.",
    notesManhattan: "La distance de Manhattan est la somme des <i>a</i><sub><i>i</i></sub>. Ses boules sont des carrés dont les diagonales sont parallèles aux axes dans le plan et des octaèdres dans l'espace.",
    notesChebyshev: "La distance de Tchebychev est le plus grand des <i>a</i><sub><i>i</i></sub>. Ses boules sont des carrés et des cubes dont les côtés sont parallèles aux axes.",
    notesCosine: "La distance cosinus vaut 1 − cos θ, où θ est l'angle entre les vecteurs qui joignent l'origine à <i>x</i> et à <i>y</i>. Elle ne dépend que de la direction des points vus de l'origine, tracée en violet. Les voisins du point requête sont alors les points dont la direction fait le plus petit angle avec la demi-droite grise qui part de l'origine et passe par ce point. Leur distance à l'origine n'intervient pas.",
    notesCompare: "Les trois premières distances sont induites par des normes et donnent des voisinages semblables, qui ne diffèrent que par les points situés près du bord de la boule. La distance cosinus n'est pas une distance au sens mathématique&nbsp;: deux points distincts situés sur une même demi-droite issue de l'origine sont à distance nulle.",
  },
  en: {
    docTitle: "Nearest neighbours and choice of distance – Guillaume Brouillette",
    title: "Nearest neighbours and choice of distance",
    lead: "This applet shows, among the points of a synthetic dataset in the plane or in space, the <i>k</i> nearest neighbours of a query point that can be moved freely, for the Euclidean, Manhattan, Chebyshev or cosine distance.",
    kLabel: "Number of neighbours <i>k</i>",
    kAria: "Number of neighbours k",
    canvasAria: "Dataset, query point and nearest neighbours",
    legendPoints: "points of the dataset",
    legendQuery: "query point",
    legendNeighbours: "nearest neighbours",
    legendOrigin: "origin",
    status2: "Query point: ({x}, {y}). {metric} to the {rank} neighbour: {d}.",
    status3: "Query point: ({x}, {y}, {z}). {metric} to the {rank} neighbour: {d}.",
    statusEuclidean: "Euclidean distance",
    statusCosine: "Cosine distance",
    statusManhattan: "Manhattan distance",
    statusChebyshev: "Chebyshev distance",
    fileName: "nearest-neighbours",
    notesReadTitle: "Reading the figure",
    notesRead: "The query point, drawn in blue, does not belong to the dataset. It is moved by dragging it in the figure or by entering its coordinates in the panel. Its <i>k</i> nearest neighbours among the points of the dataset, for the chosen distance, are drawn in red. For the Euclidean, Manhattan and Chebyshev distances, the dashed outline is the boundary of the ball centred at the query point whose radius is the distance to the <i>k</i>th neighbour. All the neighbours lie in this ball. In 3D, this ball is drawn as a translucent solid.",
    notesMetricsTitle: "Four distances",
    notesMetricsIntro: "For two points <i>x</i> and <i>y</i>, write <i>a</i><sub><i>i</i></sub> = |<i>x</i><sub><i>i</i></sub> − <i>y</i><sub><i>i</i></sub>| for the difference between their coordinates of index <i>i</i>.",
    notesEuclidean: "The Euclidean distance is the square root of the sum of the <i>a</i><sub><i>i</i></sub>². Its balls are discs in the plane and round balls in space.",
    notesManhattan: "The Manhattan distance is the sum of the <i>a</i><sub><i>i</i></sub>. Its balls are squares whose diagonals are parallel to the axes in the plane and octahedra in space.",
    notesChebyshev: "The Chebyshev distance is the largest of the <i>a</i><sub><i>i</i></sub>. Its balls are squares and cubes whose sides are parallel to the axes.",
    notesCosine: "The cosine distance is 1 − cos θ, where θ is the angle between the vectors from the origin to <i>x</i> and to <i>y</i>. It depends only on the direction of the points as seen from the origin, drawn in purple. The neighbours of the query point are then the points whose direction makes the smallest angle with the grey ray that starts at the origin and passes through this point. Their distance to the origin plays no role.",
    notesCompare: "The first three distances are induced by norms and give similar neighbourhoods, which differ only in the points close to the boundary of the ball. The cosine distance is not a distance in the mathematical sense: two distinct points on the same ray from the origin are at distance zero.",
  },
});

// ---------------------------------------------------------------------------
// 2. Neighbours
// ---------------------------------------------------------------------------

// The k nearest neighbours of the point q among the points of the dataset,
// from the nearest to the farthest. Each neighbour is given as
// { index, distance }. The point q need not belong to the dataset.
function nearestNeighbours(points, q, k, distance) {
  const all = points.map((p, index) => ({ index, distance: distance(p, q) }));
  all.sort((a, b) => a.distance - b.distance || a.index - b.index);
  return all.slice(0, k);
}

// ---------------------------------------------------------------------------
// 3. 2D drawing
// ---------------------------------------------------------------------------

const COLOURS = {
  point: "rgba(0, 0, 0, 0.47)",
  neighbour: "rgba(255, 0, 0, 0.6)",
  query: "rgba(0, 0, 255, 0.78)",
  origin: "rgba(128, 0, 128, 0.78)",
  guide: "rgba(150, 150, 150, 0.6)",
  axis: "#8e8c84",
  text: "#3e3f3a",
};

const FONT_SIZE = 12;
const VIEW_HALF = 1.08; // the figure shows [-1.08, 1.08]^2
let fontFamily = "sans-serif";

// Sizes the bitmap of a canvas to its displayed size and returns a context
// whose unit is the CSS pixel.
function prepareCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, canvas.clientWidth);
  const h = Math.max(1, canvas.clientHeight);
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(bw / w, 0, 0, bh / h, 0, 0);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  return { ctx, w, h };
}

// Maps between data coordinates and the largest square that fits in a canvas
// of size w by h, with margins for the axes.
function makeView(w, h) {
  const side = Math.max(1, Math.min(w - 50, h - 34));
  const rect = { x: 42 + (w - 50 - side) / 2, y: 8 + (h - 34 - side) / 2, w: side, h: side };
  const unit = side / (2 * VIEW_HALF);
  return {
    rect,
    unit,
    X: (x) => rect.x + (x + VIEW_HALF) * unit,
    Y: (y) => rect.y + (VIEW_HALF - y) * unit,
    dataX: (px) => (px - rect.x) / unit - VIEW_HALF,
    dataY: (py) => VIEW_HALF - (py - rect.y) / unit,
  };
}

// Left and bottom axes, with a tick every 0.5.
function drawAxes(ctx, view) {
  const { rect } = view;
  const bottom = rect.y + rect.h;
  const ticks = [-1, -0.5, 0, 0.5, 1];

  ctx.save();
  ctx.strokeStyle = COLOURS.axis;
  ctx.fillStyle = COLOURS.text;
  ctx.lineWidth = 1;
  ctx.font = `${FONT_SIZE}px ${fontFamily}`;
  ctx.beginPath();
  ctx.moveTo(rect.x + 0.5, rect.y);
  ctx.lineTo(rect.x + 0.5, bottom + 0.5);
  ctx.lineTo(rect.x + rect.w, bottom + 0.5);
  for (const tick of ticks) {
    const x = Math.round(view.X(tick)) + 0.5;
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, bottom + 4);
    const y = Math.round(view.Y(tick)) + 0.5;
    ctx.moveTo(rect.x, y);
    ctx.lineTo(rect.x - 4, y);
  }
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const tick of ticks) ctx.fillText(formatNumber(tick, 1), view.X(tick), bottom + 6);
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const tick of ticks) ctx.fillText(formatNumber(tick, 1), rect.x - 7, view.Y(tick));
  ctx.restore();
}

function drawDots(ctx, view, points, radius, colour) {
  ctx.fillStyle = colour;
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(view.X(p[0]), view.Y(p[1]), radius, 0, 2 * Math.PI);
    ctx.fill();
  }
}

// Dashed guide of the chosen distance. For a distance induced by a norm it is
// the sphere centred at the query point that passes through the k-th
// neighbour: a circle (Euclidean), a square with diagonals parallel to the
// axes (Manhattan) or a square with sides parallel to the axes (Chebyshev).
// For the cosine distance it is the ray from the origin through the query
// point, with the origin marked.
function drawGuide(ctx, view, metric, q, radius) {
  const { X, Y, unit } = view;
  ctx.save();
  ctx.strokeStyle = COLOURS.guide;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  if (metric === "euclidean") {
    ctx.arc(X(q[0]), Y(q[1]), radius * unit, 0, 2 * Math.PI);
  } else if (metric === "manhattan") {
    ctx.moveTo(X(q[0]), Y(q[1] - radius));
    ctx.lineTo(X(q[0] + radius), Y(q[1]));
    ctx.lineTo(X(q[0]), Y(q[1] + radius));
    ctx.lineTo(X(q[0] - radius), Y(q[1]));
    ctx.closePath();
  } else if (metric === "chebyshev") {
    ctx.rect(X(q[0] - radius), Y(q[1] + radius), 2 * radius * unit, 2 * radius * unit);
  } else {
    const norm = Math.hypot(q[0], q[1]);
    const scale = norm > 0 ? 4 / norm : 0;
    ctx.moveTo(X(0), Y(0));
    ctx.lineTo(X(scale * q[0]), Y(scale * q[1]));
  }
  ctx.stroke();
  ctx.restore();
  if (metric === "cosine") drawDots(ctx, view, [[0, 0]], 5, COLOURS.origin);
}

// Whole 2D figure. Returns the view, used to convert pointer positions.
function drawFigure2D(canvas, scene) {
  const { ctx, w, h } = prepareCanvas(canvas);
  const view = makeView(w, h);
  const { rect } = view;
  const { points, query, neighbours, metric } = scene;

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  drawDots(ctx, view, points, points.length > 150 ? 2.5 : 3.5, COLOURS.point);
  if (neighbours.length) {
    drawGuide(ctx, view, metric, query, neighbours[neighbours.length - 1].distance);
    drawDots(ctx, view, neighbours.map((nb) => points[nb.index]), 4.5, COLOURS.neighbour);
  }
  // The query point has a white outline, which sets it apart from the dataset.
  ctx.beginPath();
  ctx.arc(view.X(query[0]), view.Y(query[1]), 6, 0, 2 * Math.PI);
  ctx.fillStyle = COLOURS.query;
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  drawAxes(ctx, view);
  return view;
}

// ---------------------------------------------------------------------------
// 4. 3D drawing
// ---------------------------------------------------------------------------

// Ball of the distance in space: a round ball, an octahedron or a cube. For
// the cosine distance, the ray from the origin through the query point.
function drawGuide3D(view3d, metric, q, radius) {
  const grey = 0x8e8c84;
  if (metric === "euclidean") {
    view3d.addSolid(new THREE.SphereGeometry(radius, 32, 20), q, grey, 0.12);
  } else if (metric === "manhattan") {
    view3d.addSolid(new THREE.OctahedronGeometry(radius), q, grey, 0.14);
  } else if (metric === "chebyshev") {
    view3d.addSolid(new THREE.BoxGeometry(2 * radius, 2 * radius, 2 * radius), q, grey, 0.14);
  } else {
    const norm = Math.hypot(...q);
    if (norm > 0) view3d.addSegments([[[0, 0, 0], q.map((x) => (1.7 * x) / norm)]], grey);
    view3d.addPoints([[0, 0, 0]], 0.03, 0x800080);
  }
}

function drawFigure3D(view3d, scene) {
  const { points, query, neighbours, metric } = scene;
  const chosen = new Set(neighbours.map((nb) => nb.index));
  view3d.clear();
  view3d.addPoints(points.filter((p, i) => !chosen.has(i)), points.length > 150 ? 0.014 : 0.02, 0x777777);
  view3d.addPoints(neighbours.map((nb) => points[nb.index]), 0.026, 0xe41a1c);
  view3d.addPoints([query], 0.034, 0x1f1fff);
  if (neighbours.length) drawGuide3D(view3d, metric, query, neighbours[neighbours.length - 1].distance);
}

// ---------------------------------------------------------------------------
// 5. Page wiring
// ---------------------------------------------------------------------------

const t = Applet.localize(STRINGS);
fontFamily = getComputedStyle(document.body).fontFamily || fontFamily;

const panel = document.getElementById("panel");
const canvas = document.getElementById("canvas");
const holder3d = document.getElementById("view3d");
const legendOrigin = document.getElementById("legend-origin");
const status = document.getElementById("status");
const hint = document.getElementById("hint");
canvas.setAttribute("aria-label", t("canvasAria"));

const DEFAULT_K = 5;
let view2d = null;
let view3d = null; // created at the first use of the 3D mode
let neighbours = [];
let query = null;

const cloud = new CloudData(panel, t, {
  defaults: { dim: 2, dataset: "uniform", seed: 178, n: 400, noise: 0.1, clusters: 4 },
  n: { min: 10, max: 1000 },
  onChange: () => {
    query.sync();
    requestDraw();
  },
});
const kField = numberField(panel, {
  id: "k-input", label: t("kLabel"), aria: t("kAria"), min: 1, max: 40, integer: true, value: DEFAULT_K,
  onChange: requestDraw,
});
const metric = metricSelect(panel, t, { onChange: requestDraw });
query = new QueryControl(panel, t, cloud, { onChange: requestDraw });
actionButtons(panel, t, {
  onReset() {
    kField.set(DEFAULT_K);
    metric.set("euclidean");
    query.reset();
    if (view3d) view3d.resetCamera();
    cloud.reset();
  },
  onDownload() {
    const source = cloud.dim === 3 ? view3d.snapshot() : canvas;
    saveCanvasPNG(source, `${t("fileName")}-${cloud.dim}d.png`);
  },
});

// Rank of the k-th neighbour: "5e" in French, "5th" in English.
function rank(k) {
  if (Applet.lang === "fr") return k === 1 ? "1<sup>er</sup>" : `${k}<sup>e</sup>`;
  const tens = k % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : ["th", "st", "nd", "rd"][k % 10] || "th";
  return `${k}${suffix}`;
}

// Three decimals, or a power of ten for the small values that the cosine
// distance takes between points of nearly equal direction.
function formatDistance(d) {
  if (d >= 0.001 || d <= 0) return Applet.fmt(Math.max(d, 0), 3);
  let exponent = Math.floor(Math.log10(d));
  let mantissa = Math.round((d / Math.pow(10, exponent)) * 10) / 10;
  if (mantissa >= 10) {
    mantissa = 1;
    exponent += 1;
  }
  return `${Applet.fmt(mantissa, 1)}&nbsp;×&nbsp;10<sup>−${-exponent}</sup>`;
}

function updateStatus(q) {
  if (!neighbours.length) {
    status.innerHTML = "";
    return;
  }
  const name = metric.value;
  const values = {
    x: formatNumber(q[0], 2),
    y: formatNumber(q[1], 2),
    z: q.length > 2 ? formatNumber(q[2], 2) : "",
    metric: t(`status${name[0].toUpperCase()}${name.slice(1)}`),
    rank: rank(neighbours.length),
    d: formatDistance(neighbours[neighbours.length - 1].distance),
  };
  status.innerHTML = t(`status${q.length}`).replace(/\{(\w+)\}/g, (_, key) => values[key]);
}

function draw() {
  const is3d = cloud.dim === 3;
  const q = query.value;
  const k = Math.min(kField.value, cloud.points.length);
  neighbours = nearestNeighbours(cloud.points, q, k, DISTANCES[metric.value]);
  const scene = { points: cloud.points, query: q, neighbours, metric: metric.value };

  canvas.hidden = is3d;
  holder3d.hidden = !is3d;
  if (is3d) {
    if (!view3d) {
      view3d = new CloudView3D(holder3d);
      attachEdit3D(view3d.dom, view3d.camera, view3d.controls, { cloud, query, onEdit: requestDraw });
    }
    view3d.active = true;
    view3d.resize();
    drawFigure3D(view3d, scene);
  } else {
    if (view3d) view3d.active = false;
    view2d = drawFigure2D(canvas, scene);
  }
  legendOrigin.hidden = metric.value !== "cosine";
  hint.textContent = editHint(t, cloud.dim);
  updateStatus(q);
}

// At most one redraw per frame. The timer covers the case where the page is
// not being painted, in which requestAnimationFrame does not fire.
let pending = false;
function requestDraw() {
  if (pending) return;
  pending = true;
  const run = () => {
    if (!pending) return;
    pending = false;
    draw();
  };
  requestAnimationFrame(run);
  setTimeout(run, 100);
}

attachEdit2D(canvas, {
  toPixel: (p) => [view2d.X(p[0]), view2d.Y(p[1])],
  toData: (x, y) => [view2d.dataX(x), view2d.dataY(y)],
  cloud,
  query,
  onEdit: requestDraw,
});

window.addEventListener("resize", requestDraw);
if ("ResizeObserver" in window) {
  let lastWidth = 0;
  new ResizeObserver((entries) => {
    const width = entries[0].contentRect.width;
    if (Math.abs(width - lastWidth) > 0.5) {
      lastWidth = width;
      requestDraw();
    }
  }).observe(document.querySelector(".cloud-figure"));
}

draw();
window.knnApplet = { cloud, query, draw, get neighbours() { return neighbours; } };
