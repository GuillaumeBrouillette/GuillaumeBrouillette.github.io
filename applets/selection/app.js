// Neighbour selection: k-NN, MMR, DPP and RNG-Score around a query point,
// in 2D or in 3D.
//
// The algorithms and the drawing code come from the research tool
// voronoi_app.html and are kept as they were written. The control panel, the
// point cloud and the editing gestures come from the module shared by the
// point-cloud applettes (/applets/cloud.js). The library d3 is loaded by the
// page as a global.
//
// Sections: strings, panel, engine (distance, selection algorithms, 3D
// Delaunay and Voronoï, Three.js and SVG helpers), state, 2D render, 3D
// render, page wiring.

import {
  THREE, withCloudStrings, editHint, CloudData, QueryControl, numberField, metricSelect, actionButtons,
  attachEdit2D, attachEdit3D, saveCanvasPNG, saveSvgPNG,
} from "/applets/cloud.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const ARXIV = "https://arxiv.org/abs/2610.09412";
const CODE = "https://github.com/GuillaumeBrouillette/finding-the-right-balance";

// ════════════════════════════════════════════════════════════════
// Strings
// ════════════════════════════════════════════════════════════════
const STRINGS = withCloudStrings({
  fr: {
    docTitle: "Sélection de voisins – Guillaume Brouillette",
    title: "Sélection de voisins&nbsp;: <i>k</i>-NN, MMR et RNG-Score",
    lead: "Cette applette compare plusieurs méthodes de sélection de points autour d'une requête dans un nuage de points en deux ou en trois dimensions. Les points jouent le rôle des plongements des passages d'un corpus et la requête, celui du plongement d'une question.",
    showQuery: "Afficher le point requête",
    highlightLabel: "Méthode de référence",
    hlNone: "Aucune",
    hlKnn: "k-NN",
    hlMmr: "MMR",
    hlDpp: "DPP",
    kLabel: "Nombre de points retenus <i>k</i>",
    lambdaLabel: "Paramètre λ",
    algoLabel: "Sélection géométrique",
    algoNone: "Aucune",
    algoRng: "RNG-Score",
    alphaLabel: "Paramètre α",
    kSelLabel: "Nombre de points retenus <i>k</i><sub>sel</sub>",
    overlaysLabel: "Tracés superposés",
    ovVoronoi: "Diagramme de Voronoï",
    ovFill: "Cellules de Voronoï colorées",
    ovRng: "Graphe de voisinage relatif (RNG)",
    ovGabriel: "Graphe de Gabriel",
    ovDelaunay: "Triangulation de Delaunay",
    ovVorBounds: "Frontières de Voronoï",
    ovDelFill: "Faces de Delaunay",
    ovVorFill: "Facettes de Voronoï",
    styleLabel: "Apparence",
    styleQLabel: "Étiquette de la requête",
    styleHighlight: "Référence",
    styleSelected: "Sélection",
    styleAxes: "Axes",
    styleOpacity: "opacité",
    lineSolid: "plein",
    lineDashed: "tirets",
    lineDotted: "pointillé",
    lineDashdot: "mixte",
    symCircle: "cercle",
    symSquare: "carré",
    symCross: "croix",
    symDiamond: "losange",
    symTriangle: "triangle",
    legendInFigure: "Légende dans la figure",
    legendTitle: "Légende",
    legCorpus: "Corpus",
    legQuery: "Requête",
    legSelected: "Sélection RNG-Score",
    legVoronoi: "Voronoï",
    legDelFill: "Faces de Delaunay",
    legVorBounds: "Frontières de Voronoï",
    legVorFill: "Facettes de Voronoï",
    statKnn: "k-NN, k = {k} : {m} points",
    statMmr: "MMR, k = {k}, λ = {l} : {m} points",
    statDpp: "DPP, k = {k} : {m} points",
    statRng: "RNG-Score, α = {a} : {m} points retenus sur {k} demandés",
    statCorpus: "{n} points dans le corpus",
    warnSlow: "Avec plus de 100 points, le calcul des graphes peut être lent.",
    warnEuclid: "En 3D, la triangulation de Delaunay et le diagramme de Voronoï sont calculés pour la distance euclidienne.",
    warnDelaunay: "La triangulation de Delaunay n'est pas calculée au-delà de 150 points.",
    warnFacets: "Les facettes de Voronoï ne sont pas calculées au-delà de 60 points.",
    warnError: "Erreur dans le calcul de la triangulation de Delaunay :",
    warnRng: "Le graphe RNG n'est pas calculé au-delà de 80 points.",
    warnGabriel: "Le graphe de Gabriel n'est pas calculé au-delà de 80 points.",
    fileName: "selection-de-voisins",
    notesTitle: "Lecture de la figure",
    notesMethods: "Le menu « Méthode de référence » met en évidence les points retenus par une méthode de référence. Les <i>k</i> plus proches voisins (<i>k</i>-NN) retiennent les <i>k</i> points les plus proches de la requête. La pertinence marginale maximale (MMR) choisit les points un à un en pondérant, selon le paramètre λ, la proximité à la requête et l'éloignement des points déjà choisis. La sélection gloutonne par processus ponctuel déterminantal (DPP) retient des points à la fois proches de la requête et de directions différentes vues de l'origine. Le menu « Sélection géométrique » applique RNG-Score, qui attribue à chaque point <i>w</i> sa distance à la requête <i>q</i>, augmentée d'une pénalité pour chaque point <i>v</i> plus proche de <i>q</i> que <i>w</i> et situé près de <i>w</i>. Les points de plus petit score sont retenus, ce qui écarte les points redondants.",
    notesOverlays: "Les cases « Tracés superposés » ajoutent au nuage de points le diagramme de Voronoï, la triangulation de Delaunay, le graphe de Gabriel et le graphe de voisinage relatif (RNG). La section « Apparence » règle les couleurs, les symboles et les traits. Elle permet aussi de placer la légende dans la figure avant de télécharger l'image.",
    notesRefTitle: "Référence",
    notesRef: `RNG-Score est présenté dans la prépublication G. Brouillette, F. Kagabo, U. Faghihi et N. Ghazzali, <i>Finding the Right Balance: Relevance and Diversity in LLM Retrieval</i>, 2026, <a href="${ARXIV}" target="_blank" rel="noopener noreferrer">arXiv:2610.09412</a>. Le code des expériences est disponible sur <a href="${CODE}" target="_blank" rel="noopener noreferrer">GitHub</a>.`,
  },
  en: {
    docTitle: "Neighbour selection – Guillaume Brouillette",
    title: "Neighbour selection: <i>k</i>-NN, MMR and RNG-Score",
    lead: "This applet compares several methods for selecting points around a query in a point cloud in two or three dimensions. The points play the role of the embeddings of the passages of a corpus and the query, that of the embedding of a question.",
    showQuery: "Show the query point",
    highlightLabel: "Baseline method",
    hlNone: "None",
    hlKnn: "k-NN",
    hlMmr: "MMR",
    hlDpp: "DPP",
    kLabel: "Number of points retained <i>k</i>",
    lambdaLabel: "Parameter λ",
    algoLabel: "Geometric selection",
    algoNone: "None",
    algoRng: "RNG-Score",
    alphaLabel: "Parameter α",
    kSelLabel: "Number of points retained <i>k</i><sub>sel</sub>",
    overlaysLabel: "Overlays",
    ovVoronoi: "Voronoi diagram",
    ovFill: "Coloured Voronoi cells",
    ovRng: "Relative neighbourhood graph (RNG)",
    ovGabriel: "Gabriel graph",
    ovDelaunay: "Delaunay triangulation",
    ovVorBounds: "Voronoi boundaries",
    ovDelFill: "Delaunay faces",
    ovVorFill: "Voronoi facets",
    styleLabel: "Appearance",
    styleQLabel: "Label of the query",
    styleHighlight: "Baseline",
    styleSelected: "Selection",
    styleAxes: "Axes",
    styleOpacity: "opacity",
    lineSolid: "solid",
    lineDashed: "dashed",
    lineDotted: "dotted",
    lineDashdot: "dash-dot",
    symCircle: "circle",
    symSquare: "square",
    symCross: "cross",
    symDiamond: "diamond",
    symTriangle: "triangle",
    legendInFigure: "Legend inside the figure",
    legendTitle: "Legend",
    legCorpus: "Corpus",
    legQuery: "Query",
    legSelected: "RNG-Score selection",
    legVoronoi: "Voronoi",
    legDelFill: "Delaunay faces",
    legVorBounds: "Voronoi boundaries",
    legVorFill: "Voronoi facets",
    statKnn: "k-NN, k = {k}: {m} points",
    statMmr: "MMR, k = {k}, λ = {l}: {m} points",
    statDpp: "DPP, k = {k}: {m} points",
    statRng: "RNG-Score, α = {a}: {m} points retained of {k} requested",
    statCorpus: "{n} points in the corpus",
    warnSlow: "With more than 100 points, computing the graphs may be slow.",
    warnEuclid: "In 3D, the Delaunay triangulation and the Voronoi diagram are computed for the Euclidean distance.",
    warnDelaunay: "The Delaunay triangulation is not computed beyond 150 points.",
    warnFacets: "The Voronoi facets are not computed beyond 60 points.",
    warnError: "Error in the computation of the Delaunay triangulation:",
    warnRng: "The RNG graph is not computed beyond 80 points.",
    warnGabriel: "The Gabriel graph is not computed beyond 80 points.",
    fileName: "neighbour-selection",
    notesTitle: "Reading the figure",
    notesMethods: "The menu \"Baseline method\" marks the points retained by a baseline method. The <i>k</i> nearest neighbours (<i>k</i>-NN) retain the <i>k</i> points closest to the query. Maximal marginal relevance (MMR) chooses the points one by one by weighting, according to the parameter λ, the proximity to the query and the distance to the points already chosen. Greedy selection with a determinantal point process (DPP) retains points that are both close to the query and in different directions as seen from the origin. The menu \"Geometric selection\" applies RNG-Score, which assigns to each point <i>w</i> its distance to the query <i>q</i>, increased by a penalty for each point <i>v</i> that is closer to <i>q</i> than <i>w</i> and located near <i>w</i>. The points with the smallest scores are retained, which discards redundant points.",
    notesOverlays: "The boxes \"Overlays\" add to the point cloud the Voronoi diagram, the Delaunay triangulation, the Gabriel graph and the relative neighbourhood graph (RNG). The section \"Appearance\" sets the colours, the symbols and the line styles. It also allows the legend to be placed inside the figure before the image is downloaded.",
    notesRefTitle: "Reference",
    notesRef: `RNG-Score is introduced in the preprint G. Brouillette, F. Kagabo, U. Faghihi and N. Ghazzali, <i>Finding the Right Balance: Relevance and Diversity in LLM Retrieval</i>, 2026, <a href="${ARXIV}" target="_blank" rel="noopener noreferrer">arXiv:2610.09412</a>. The code of the experiments is available on <a href="${CODE}" target="_blank" rel="noopener noreferrer">GitHub</a>.`,
  },
});

const t = Applet.localize(STRINGS);
const byId = (id) => document.getElementById(id);
const num = (x, digits) => Applet.fmt(x, digits);
const say = (key, values) => t(key).replace(/\{(\w+)\}/g, (_, name) => values[name]);

// ════════════════════════════════════════════════════════════════
// Panel
// ════════════════════════════════════════════════════════════════
// Order: cloud (dimension, dataset, seed, parameters, number of points),
// distance, query point, baseline method, geometric selection, overlays,
// appearance, reset and download. The groups written here by hand carry the
// attribute data-static: any change in them redraws the figure.
const panel = byId("panel");
const DEFAULTS = { k: 3, lambda: 0.5, alpha: 0, kSel: 3 };
let query = null;

function addHtml(text) {
  const template = document.createElement("template");
  template.innerHTML = text.trim();
  panel.appendChild(template.content);
}

const redraw = () => render();

const cloud = new CloudData(panel, t, {
  defaults: { dim: 2, dataset: "uniform", seed: 12, n: 25, sigma: 0.4, noise: 0, clusters: 4 },
  n: { min: 4, max: 200 },
  onChange: () => {
    query.sync();
    render();
  },
});
const metric = metricSelect(panel, t, { onChange: redraw });
query = new QueryControl(panel, t, cloud, { onChange: redraw });

addHtml(`
  <div class="control-group" data-static>
    <div class="form-check">
      <input class="form-check-input" type="checkbox" id="show-q" checked>
      <label class="form-check-label" for="show-q">${t("showQuery")}</label>
    </div>
  </div>
  <div class="control-group" data-static>
    <label class="form-label" for="highlight">${t("highlightLabel")}</label>
    <select class="form-select form-select-sm" id="highlight">
      <option value="none" selected>${t("hlNone")}</option>
      <option value="knn">${t("hlKnn")}</option>
      <option value="mmr">${t("hlMmr")}</option>
      <option value="dpp">${t("hlDpp")}</option>
    </select>
  </div>`);
const kField = numberField(panel, {
  id: "k-nn", label: t("kLabel"), min: 1, max: 50, integer: true, value: DEFAULTS.k, onChange: redraw,
});
const lambdaField = numberField(panel, {
  id: "lambda", label: t("lambdaLabel"), min: 0, max: 1, step: 0.01, value: DEFAULTS.lambda, onChange: redraw,
});

addHtml(`
  <div class="control-group" data-static>
    <label class="form-label" for="algo">${t("algoLabel")}</label>
    <select class="form-select form-select-sm" id="algo">
      <option value="none" selected>${t("algoNone")}</option>
      <option value="rng-score">${t("algoRng")}</option>
    </select>
  </div>`);
const alphaField = numberField(panel, {
  id: "alpha", label: t("alphaLabel"), min: -1, max: 5, step: 0.005, digits: 3, value: DEFAULTS.alpha, onChange: redraw,
});
const kSelField = numberField(panel, {
  id: "k-sel", label: t("kSelLabel"), min: 1, max: 50, integer: true, value: DEFAULTS.kSel, onChange: redraw,
});

const checkBox = (id, key, rowId) => `
    <div class="form-check"${rowId ? ` id="${rowId}"` : ""}>
      <input class="form-check-input" type="checkbox" id="${id}">
      <label class="form-check-label" for="${id}">${t(key)}</label>
    </div>`;
const lineOptions = (chosen) => ["solid", "dashed", "dotted", "dashdot"].map((value) => {
  const key = `line${value[0].toUpperCase()}${value.slice(1)}`;
  return `<option value="${value}"${value === chosen ? " selected" : ""}>${t(key)}</option>`;
}).join("");
const symbolOptions = () => ["circle", "square", "cross", "diamond", "triangle"].map((value, i) => {
  const key = `sym${value[0].toUpperCase()}${value.slice(1)}`;
  return `<option value="${value}"${i === 0 ? " selected" : ""}>${t(key)}</option>`;
}).join("");
const colour = (id, value) =>
  `<input type="color" class="form-control form-control-sm form-control-color" id="${id}" value="${value}">`;
const lineRow = (label, prefix, hex, line, width, rowId) => `
      <div class="sel-row"${rowId ? ` id="${rowId}"` : ""}>
        <span class="sel-label">${label}</span>
        ${colour(`${prefix}-c`, hex)}
        <select class="form-select form-select-sm" id="${prefix}-s">${lineOptions(line)}</select>
        <input type="number" class="form-control form-control-sm sel-number" id="${prefix}-w" value="${width}" min="0.5" max="8" step="0.5">
      </div>`;
const fillRow = (label, prefix, hex, rowId) => `
      <div class="sel-row" id="${rowId}">
        <span class="sel-label">${label}</span>
        ${colour(`${prefix}-c`, hex)}
        <span class="small text-muted">${t("styleOpacity")}</span>
        <input type="number" class="form-control form-control-sm sel-number" id="${prefix}-a" value="0.12" min="0.02" max="0.5" step="0.02">
      </div>`;
const symbolRow = (label, prefix, hex) => `
      <div class="sel-row">
        <span class="sel-label">${label}</span>
        ${colour(`${prefix}-c`, hex)}
        <select class="form-select form-select-sm" id="${prefix}-sym">${symbolOptions()}</select>
      </div>`;

addHtml(`
  <div class="control-group" data-static>
    <span class="form-label d-block">${t("overlaysLabel")}</span>
    ${checkBox("show-vor", "ovVoronoi", "vor-row")}
    ${checkBox("fill-cells", "ovFill", "fill-row")}
    ${checkBox("show-rng", "ovRng")}
    ${checkBox("show-gab", "ovGabriel")}
    ${checkBox("show-del", "ovDelaunay")}
    ${checkBox("show-vor-bounds", "ovVorBounds", "vor-bounds-row")}
    ${checkBox("fill-del-3d", "ovDelFill", "del-fill-row")}
    ${checkBox("fill-vor-3d", "ovVorFill", "vorf-row")}
  </div>
  <details class="control-group" data-static>
    <summary class="form-label">${t("styleLabel")}</summary>
    <div class="sel-style">
      <div class="sel-row">
        <label class="sel-label sel-wide" for="q-label">${t("styleQLabel")}</label>
        <input type="text" class="form-control form-control-sm sel-number" id="q-label" value="q">
      </div>
      ${symbolRow(t("styleHighlight"), "knn", "#fd8d3c")}
      ${symbolRow(t("styleSelected"), "sel", "#31a354")}
      ${lineRow(t("legVoronoi"), "vor", "#bdbdbd", "solid", 1, "vor-style-row")}
      ${lineRow("RNG", "rng", "#cb181d", "solid", 1)}
      ${lineRow("Gabriel", "gab", "#fc4e2a", "dotted", 1)}
      ${lineRow("Delaunay", "del", "#4292c6", "dashed", 1)}
      ${lineRow(t("ovVorBounds"), "vb", "#aaaaaa", "solid", 0.5, "vor-bounds-style-row")}
      ${fillRow(t("ovDelFill"), "delf", "#4292c6", "del-fill-style-row")}
      ${fillRow(t("ovVorFill"), "vorf", "#bdbdbd", "vorf-style-row")}
      <div class="sel-row" id="axes-sec">
        <span class="sel-label">${t("styleAxes")}</span>
        <i>x</i>${colour("ax-x", "#ff4444")}
        <i>y</i>${colour("ax-y", "#44bb44")}
        <i>z</i>${colour("ax-z", "#4488ff")}
      </div>
      <div class="form-check mt-1">
        <input class="form-check-input" type="checkbox" id="show-legend">
        <label class="form-check-label" for="show-legend">${t("legendInFigure")}</label>
      </div>
    </div>
  </details>`);
actionButtons(panel, t, { onReset: resetAll, onDownload: download });

// ════════════════════════════════════════════════════════════════
// Metric — configurable distance function (Euclidean / Manhattan / Chebyshev / Cosine)
// Cosine distance uses origin at (0,0) / (0,0,0) (coordinates in [-1,1]).
// ════════════════════════════════════════════════════════════════
let activeMetric = 'euclidean';

function dist(a, b) {
  switch(activeMetric) {
    case 'manhattan': {
      let s=0; for(let i=0;i<a.length;i++) s+=Math.abs(a[i]-b[i]); return s;
    }
    case 'chebyshev': {
      let mx=0; for(let i=0;i<a.length;i++) mx=Math.max(mx,Math.abs(a[i]-b[i])); return mx;
    }
    case 'cosine': {
      let dot=0,na=0,nb=0;
      for(let i=0;i<a.length;i++){dot+=a[i]*b[i];na+=a[i]*a[i];nb+=b[i]*b[i];}
      const denom=Math.sqrt(na)*Math.sqrt(nb);
      return denom<1e-12?1:1-dot/denom;
    }
    default: { // euclidean
      let s=0; for(let i=0;i<a.length;i++) s+=(a[i]-b[i])**2; return Math.sqrt(s);
    }
  }
}

// ════════════════════════════════════════════════════════════════
// Selection Algorithms — unified (2D and 3D via dist)
// ════════════════════════════════════════════════════════════════
function kNN(pts, q, k) {
  return pts
    .map((p, i) => [i, dist(p, q)])
    .sort((a, b) => a[1] - b[1])
    .slice(0, Math.min(k, pts.length))
    .map(x => x[0]);
}

// RNG-Score reranker — returns indices of top-k documents by lowest RNG-score
// C(w,q) = d(w,q) + sum_{v: d(v,q) < d(w,q)} max(d(w,q) - d(v,w) + alpha, 0)
// Sorted once (O(n log n)); inner loop breaks early → ~n²/2 distance evaluations.
function RNGScore(pts, q, kSel, alpha) {
  const order = pts.map((p, i) => [i, dist(p, q)]).sort((a, b) => a[1] - b[1]);
  const scores = order.map(([w, dqw], j) => {
    let score = dqw;                          // base term d(w,q)
    for (let i = 0; i < j; i++) {            // order[i] has d(v,q) < d(w,q) by construction
      const term = dqw - dist(pts[w], pts[order[i][0]]) + alpha;
      if (term > 0) score += term;
    }
    return [w, score];
  });
  return scores
    .sort((a, b) => a[1] - b[1])
    .slice(0, Math.min(kSel, pts.length))
    .map(x => x[0]);
}

// MMR — Maximal Marginal Relevance (Carbonell & Goldstein, 1998)
// lambda=1 → pure relevance (k-NN order); lambda=0 → pure diversity
// First element is always the nearest to q (standard convention).
function MMR(pts, q, k, lambda) {
  const remaining = new Set(pts.map((_, i) => i));
  const selected = [];
  while (selected.length < k && remaining.size > 0) {
    let best = -1, bestScore = -Infinity;
    for (const i of remaining) {
      const rel = -dist(pts[i], q);   // higher = closer to q
      let score;
      if (selected.length === 0) {
        score = rel;                   // first pick: always nearest to q
      } else {
        const div = Math.min(...selected.map(s => dist(pts[i], pts[s])));
        score = lambda * rel + (1 - lambda) * div;
      }
      if (score > bestScore) { bestScore = score; best = i; }
    }
    if (best === -1) break;
    selected.push(best);
    remaining.delete(best);
  }
  return selected;
}

// GreedyDPP — Greedy MAP-DPP via Gram-Schmidt (Chen et al., 2018)
// Kernel: K[i,j] = score_i * cosine(p_i, p_j) * score_j
// where score_i = max(0, 1 - dist(p_i, q) / maxDist) (relevance to query).
// At each step the document with the largest residual squared-norm is chosen.
function GreedyDPP(pts, q, k) {
  const n = pts.length;
  k = Math.min(k, n);
  const D = pts[0].length;

  // Relevance scores: higher = closer to query
  const dists = pts.map(p => dist(p, q));
  const maxDist = Math.max(...dists) || 1;
  const scores = dists.map(d => Math.max(0, 1 - d / maxDist));

  // L2-normalize each point
  function normalize(v) {
    const len = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    return len < 1e-12 ? Array(D).fill(0) : v.map(x => x / len);
  }

  // Weighted embeddings: u_i = score_i * normalize(p_i)
  const u = pts.map((p, i) => normalize(p).map(x => x * scores[i]));

  const selected = [];
  const excluded = new Set();

  for (let iter = 0; iter < k; iter++) {
    let best = -1, bestNormSq = -Infinity;
    for (let i = 0; i < n; i++) {
      if (excluded.has(i)) continue;
      const normSq = u[i].reduce((s, x) => s + x * x, 0);
      if (normSq > bestNormSq) { bestNormSq = normSq; best = i; }
    }
    if (best === -1 || bestNormSq <= 1e-14) break;
    selected.push(best);
    excluded.add(best);

    // Orthogonalise remaining residuals against u[best]
    const uBestNorm = Math.sqrt(bestNormSq);
    const uBestUnit = u[best].map(x => x / uBestNorm);
    for (let i = 0; i < n; i++) {
      if (excluded.has(i)) continue;
      const proj = u[i].reduce((s, x, d) => s + x * uBestUnit[d], 0);
      u[i] = u[i].map((x, d) => x - proj * uBestUnit[d]);
    }
  }
  return selected;
}


function computeRNG(pts) {
  const n = pts.length, edges = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dij = dist(pts[i], pts[j]);
      let ok = true;
      for (let w = 0; w < n && ok; w++) {
        if (w === i || w === j) continue;
        if (dist(pts[i], pts[w]) < dij && dist(pts[j], pts[w]) < dij) ok = false;
      }
      if (ok) edges.push([i, j]);
    }
  }
  return edges;
}

function computeGabriel(pts) {
  const n = pts.length, edges = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const mid = pts[i].map((v, k) => (v + pts[j][k]) / 2);
      const r2  = dist(pts[i], pts[j]) ** 2 / 4;
      let ok = true;
      for (let w = 0; w < n && ok; w++) {
        if (w === i || w === j) continue;
        if (dist(pts[w], mid) ** 2 < r2) ok = false;
      }
      if (ok) edges.push([i, j]);
    }
  }
  return edges;
}

// ════════════════════════════════════════════════════════════════
// 3D Delaunay — Bowyer-Watson
// ════════════════════════════════════════════════════════════════
function circumsphere3D(p0, p1, p2, p3) {
  const ax=p1[0]-p0[0],ay=p1[1]-p0[1],az=p1[2]-p0[2];
  const bx=p2[0]-p0[0],by=p2[1]-p0[1],bz=p2[2]-p0[2];
  const cx=p3[0]-p0[0],cy=p3[1]-p0[1],cz=p3[2]-p0[2];
  const D=2*(ax*(by*cz-bz*cy)-ay*(bx*cz-bz*cx)+az*(bx*cy-by*cx));
  if (Math.abs(D)<1e-12) return null;
  const a2=ax*ax+ay*ay+az*az,b2=bx*bx+by*by+bz*bz,c2=cx*cx+cy*cy+cz*cz;
  const ux=(a2*(by*cz-bz*cy)-b2*(ay*cz-az*cy)+c2*(ay*bz-az*by))/D;
  const uy=(a2*(bz*cx-bx*cz)-b2*(az*cx-ax*cz)+c2*(az*bx-ax*bz))/D;
  const uz=(a2*(bx*cy-by*cx)-b2*(ax*cy-ay*cx)+c2*(ax*by-ay*bx))/D;
  return {cx:p0[0]+ux,cy:p0[1]+uy,cz:p0[2]+uz,r2:ux*ux+uy*uy+uz*uz};
}

function bowyerWatson3D(pts) {
  const n=pts.length,M=100;
  const allPts=[...pts,[-M,-M,-M],[3*M,-M,-M],[-M,3*M,-M],[-M,-M,3*M]];
  const tetFaces=v=>[
    [v[1],v[2],v[3]],[v[0],v[2],v[3]],[v[0],v[1],v[3]],[v[0],v[1],v[2]]
  ].map(f=>[...f].sort((a,b)=>a-b));
  const initCS=circumsphere3D(allPts[n],allPts[n+1],allPts[n+2],allPts[n+3]);
  let tets=initCS?[{verts:[n,n+1,n+2,n+3],cs:initCS}]:[];
  for (let pi=0;pi<n;pi++) {
    const p=allPts[pi],bad=[],good=[];
    for (const tet of tets) {
      const{cx,cy,cz,r2}=tet.cs,dx=p[0]-cx,dy=p[1]-cy,dz=p[2]-cz;
      (dx*dx+dy*dy+dz*dz<r2+1e-9?bad:good).push(tet);
    }
    const faceCount=new Map();
    for (const tet of bad) for (const face of tetFaces(tet.verts)) {
      const key=face.join(',');faceCount.set(key,(faceCount.get(key)||0)+1);
    }
    const newTets=[];
    for (const[key,cnt] of faceCount) {
      if(cnt!==1) continue;
      const[a,b,c]=key.split(',').map(Number);
      const cs=circumsphere3D(allPts[a],allPts[b],allPts[c],p);
      if(cs) newTets.push({verts:[a,b,c,pi],cs});
    }
    tets=[...good,...newTets];
  }
  const pureTets=tets.filter(t=>t.verts.every(v=>v<n)).map(t=>t.verts);
  const allTets=tets.map(t=>t.verts);
  return {pureTets, allTets, bwPts:allPts};
}

function delaunayEdges3D(tets) {
  const edgeSet=new Set(),edges=[];
  for (const[a,b,c,d] of tets) {
    for (const[i,j] of [[a,b],[a,c],[a,d],[b,c],[b,d],[c,d]]) {
      const key=`${Math.min(i,j)},${Math.max(i,j)}`;
      if(!edgeSet.has(key)){edgeSet.add(key);edges.push([Math.min(i,j),Math.max(i,j)]);}
    }
  }
  return edges;
}

function sortPolygon3D(verts,dir) {
  if(verts.length<=2) return verts;
  const dlen=Math.sqrt(dir[0]**2+dir[1]**2+dir[2]**2);
  if(dlen<1e-12) return verts;
  const d=dir.map(x=>x/dlen);
  const center=[0,0,0];
  for(const v of verts){center[0]+=v[0];center[1]+=v[1];center[2]+=v[2];}
  center[0]/=verts.length;center[1]/=verts.length;center[2]/=verts.length;
  let u;
  if(Math.abs(d[0])<=Math.abs(d[1])&&Math.abs(d[0])<=Math.abs(d[2])) u=[0,-d[2],d[1]];
  else if(Math.abs(d[1])<=Math.abs(d[2])) u=[-d[2],0,d[0]];
  else u=[-d[1],d[0],0];
  const ulen=Math.sqrt(u[0]**2+u[1]**2+u[2]**2);
  if(ulen<1e-12) return verts;
  u=u.map(x=>x/ulen);
  const v2=[d[1]*u[2]-d[2]*u[1],d[2]*u[0]-d[0]*u[2],d[0]*u[1]-d[1]*u[0]];
  return verts.slice().sort((a,b)=>{
    const ra=[a[0]-center[0],a[1]-center[1],a[2]-center[2]];
    const rb=[b[0]-center[0],b[1]-center[1],b[2]-center[2]];
    const angA=Math.atan2(ra[0]*v2[0]+ra[1]*v2[1]+ra[2]*v2[2],ra[0]*u[0]+ra[1]*u[1]+ra[2]*u[2]);
    const angB=Math.atan2(rb[0]*v2[0]+rb[1]*v2[1]+rb[2]*v2[2],rb[0]*u[0]+rb[1]*u[1]+rb[2]*u[2]);
    return angA-angB;
  });
}

// Sutherland-Hodgman clipping of a convex polygon against one half-space nx*x+ny*y+nz*z >= d
function clipPolygonHalfSpace(poly,nx,ny,nz,d) {
  if(!poly.length) return [];
  const out=[];
  for(let i=0;i<poly.length;i++) {
    const cur=poly[i],prv=poly[(i-1+poly.length)%poly.length];
    const vc=nx*cur[0]+ny*cur[1]+nz*cur[2];
    const vp=nx*prv[0]+ny*prv[1]+nz*prv[2];
    const cinside=vc>=d-1e-10,pinside=vp>=d-1e-10;
    if(cinside){
      if(!pinside){const t=(d-vp)/(vc-vp);out.push([prv[0]+t*(cur[0]-prv[0]),prv[1]+t*(cur[1]-prv[1]),prv[2]+t*(cur[2]-prv[2])]);}
      out.push([...cur]);
    } else if(pinside){
      const t=(d-vp)/(vc-vp);out.push([prv[0]+t*(cur[0]-prv[0]),prv[1]+t*(cur[1]-prv[1]),prv[2]+t*(cur[2]-prv[2])]);
    }
  }
  return out;
}

// Clip a convex polygon to the [-1,1]^3 cube
function clipPolygonToUnitCube(poly) {
  let p=poly;
  p=clipPolygonHalfSpace(p, 1, 0, 0,-1);  // x >= -1
  p=clipPolygonHalfSpace(p,-1, 0, 0,-1);  // x <= 1
  p=clipPolygonHalfSpace(p, 0, 1, 0,-1);  // y >= -1
  p=clipPolygonHalfSpace(p, 0,-1, 0,-1);  // y <= 1
  p=clipPolygonHalfSpace(p, 0, 0, 1,-1);  // z >= -1
  p=clipPolygonHalfSpace(p, 0, 0,-1,-1);  // z <= 1
  return p;
}

// Build Voronoi facets from ALL BW tets (including super-tet), clip each to unit cube.
// n = number of original input points; only emit facets for edges where both endpoints < n.
function voronoiFacets3D(bwPts,allTets,n) {
  const centers=allTets.map(([a,b,c,d])=>{
    const cs=circumsphere3D(bwPts[a],bwPts[b],bwPts[c],bwPts[d]);
    return cs?[cs.cx,cs.cy,cs.cz]:null;
  });
  const edgeTets=new Map();
  for(let ti=0;ti<allTets.length;ti++) {
    const[a,b,c,d]=allTets[ti];
    for(const[i,j] of [[a,b],[a,c],[a,d],[b,c],[b,d],[c,d]]) {
      if(i>=n||j>=n) continue;  // only edges between original points
      const key=`${Math.min(i,j)},${Math.max(i,j)}`;
      if(!edgeTets.has(key)) edgeTets.set(key,[]);
      edgeTets.get(key).push(ti);
    }
  }
  const facets=[];
  for(const[key,tetIdxs] of edgeTets) {
    if(tetIdxs.length<2) continue;
    const[i,j]=key.split(',').map(Number);
    let verts=tetIdxs.map(ti=>centers[ti]).filter(c=>c!==null);
    if(verts.length<2) continue;
    const dir=[bwPts[j][0]-bwPts[i][0],bwPts[j][1]-bwPts[i][1],bwPts[j][2]-bwPts[i][2]];
    verts=sortPolygon3D(verts,dir);
    verts=clipPolygonToUnitCube(verts);
    if(verts.length<3) continue;
    facets.push({edge:[i,j],verts});
  }
  return facets;
}

// Extract unique polygon edges from Voronoi facets
function voronoiFacetEdges3D(facets) {
  const seen=new Set(),edges=[];
  for(const facet of facets) {
    const v=facet.verts;
    for(let i=0;i<v.length;i++) {
      const a=v[i],b=v[(i+1)%v.length];
      const ka=a.map(x=>x.toFixed(8)).join(','),kb=b.map(x=>x.toFixed(8)).join(',');
      const key=ka<kb?`${ka}|${kb}`:`${kb}|${ka}`;
      if(!seen.has(key)){seen.add(key);edges.push([a,b]);}
    }
  }
  return edges;
}

// ════════════════════════════════════════════════════════════════
// Three.js Helpers
// ════════════════════════════════════════════════════════════════
function hexToInt(h) { return parseInt(h.replace('#',''),16); }

function makeSphere(x,y,z,radius,color) {
  const geo=new THREE.SphereGeometry(radius,12,8);
  const mat=new THREE.MeshLambertMaterial({color});
  const mesh=new THREE.Mesh(geo,mat);
  mesh.position.set(x,y,z);
  mesh.userData.isSceneObj=true;
  return mesh;
}

// Create a 3D symbol object at (x,y,z) with given size and color.
// symbol: 'circle' (sphere) | 'square' (box) | 'cross' (3-axis cross) | 'diamond' (octahedron) | 'triangle' (tetrahedron)
function makeSymbol3D(x,y,z,size,color,symbol) {
  let geo;
  switch(symbol) {
    case 'square':
      geo=new THREE.BoxGeometry(size*2,size*2,size*2); break;
    case 'cross': {
      const grp=new THREE.Group();
      grp.userData.isSceneObj=true;
      const mat=new THREE.MeshLambertMaterial({color});
      const arm=size*3.2,thick=size*0.65;
      [new THREE.BoxGeometry(arm,thick,thick),
       new THREE.BoxGeometry(thick,arm,thick),
       new THREE.BoxGeometry(thick,thick,arm)].forEach(g=>{
        const m=new THREE.Mesh(g,mat); m.userData.isSceneObj=true; grp.add(m);
      });
      grp.position.set(x,y,z); return grp;
    }
    case 'diamond':
      geo=new THREE.OctahedronGeometry(size*1.4); break;
    case 'triangle':
      geo=new THREE.TetrahedronGeometry(size*1.5); break;
    default: // circle / sphere
      geo=new THREE.SphereGeometry(size,12,8);
  }
  const mat=new THREE.MeshLambertMaterial({color});
  const mesh=new THREE.Mesh(geo,mat);
  mesh.position.set(x,y,z);
  mesh.userData.isSceneObj=true;
  return mesh;
}

// Ring that always faces the camera, drawn around a point chosen by both
// methods (the 3D counterpart of the outer ring of the 2D figure).
const ringTextures=new Map();
function ringTexture(color) {
  if(!ringTextures.has(color)) {
    const c=document.createElement('canvas'); c.width=c.height=128;
    const g=c.getContext('2d');
    g.strokeStyle=color; g.lineWidth=18;
    g.beginPath(); g.arc(64,64,52,0,2*Math.PI); g.stroke();
    const tex=new THREE.CanvasTexture(c);
    tex.colorSpace=THREE.SRGBColorSpace;
    ringTextures.set(color,tex);
  }
  return ringTextures.get(color);
}
function makeRing3D(x,y,z,radius,color) {
  const mat=new THREE.SpriteMaterial({map:ringTexture(color),transparent:true,alphaTest:0.3});
  const sprite=new THREE.Sprite(mat);
  sprite.scale.set(2*radius,2*radius,1);
  sprite.position.set(x,y,z);
  sprite.userData.isSceneObj=true;
  return sprite;
}

// Lines using index pairs into a pts array
function makeLines3D(edges,pts,color,linewidth) {
  if(!edges.length) return null;
  const positions=[];
  for(const[i,j] of edges) {
    positions.push(pts[i][0],pts[i][1],pts[i][2],pts[j][0],pts[j][1],pts[j][2]);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const obj=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color,linewidth}));
  obj.userData.isSceneObj=true;
  return obj;
}

// Lines using coordinate pairs (for Voronoi facet edges)
function makeLineSegments3D(segs,color,linewidth) {
  if(!segs.length) return null;
  const positions=[];
  for(const[a,b] of segs) positions.push(a[0],a[1],a[2],b[0],b[1],b[2]);
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const obj=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color,linewidth}));
  obj.userData.isSceneObj=true;
  return obj;
}

// Filled semi-transparent mesh from a flat positions array
function makeFacetMesh3D(positions,color,opacity) {
  if(!positions.length) return null;
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false});
  const mesh=new THREE.Mesh(geo,mat);
  mesh.userData.isSceneObj=true;
  return mesh;
}

// Axis line from (x1,y1,z1) to (x2,y2,z2)
function makeAxisLine(x1,y1,z1,x2,y2,z2,color) {
  const pos=new Float32Array([x1,y1,z1,x2,y2,z2]);
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const obj=new THREE.Line(geo,new THREE.LineBasicMaterial({color}));
  obj.userData.isSceneObj=true;
  return obj;
}

// ════════════════════════════════════════════════════════════════
// Three.js Scene Setup (initialised once)
// ════════════════════════════════════════════════════════════════
const canvas3d=document.getElementById('diagram3d');
const renderer=new THREE.WebGLRenderer({canvas:canvas3d,antialias:true,preserveDrawingBuffer:true});
renderer.setClearColor(0xffffff);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(600,600);

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(45,1,0.001,100);
camera.position.set(3,2.5,3);
camera.lookAt(0,0,0);

const controls3d=new OrbitControls(camera,renderer.domElement);
controls3d.target.set(0,0,0);
controls3d.enableDamping=true;
controls3d.dampingFactor=0.08;

scene.add(new THREE.AmbientLight(0xffffff,0.8));
const dirLight=new THREE.DirectionalLight(0xffffff,0.5);
dirLight.position.set(2,3,2);
scene.add(dirLight);

(function animate(){requestAnimationFrame(animate);controls3d.update();renderer.render(scene,camera);})();

function clearScene3D() {
  const toRemove=[];
  scene.traverse(obj=>{if(obj.userData.isSceneObj) toRemove.push(obj);});
  for(const obj of toRemove) {
    scene.remove(obj);
    if(obj.geometry) obj.geometry.dispose();
    if(obj.material) {
      if(Array.isArray(obj.material)) obj.material.forEach(m=>m.dispose());
      else obj.material.dispose();
    }
  }
}

// ════════════════════════════════════════════════════════════════
// SVG Helpers (2D)
// ════════════════════════════════════════════════════════════════
const NS='http://www.w3.org/2000/svg';

function svgEl(tag,attrs) {
  const e=document.createElementNS(NS,tag);
  if(attrs) for(const[k,v] of Object.entries(attrs)) e.setAttribute(k,String(v));
  return e;
}

function dasharray(style) {
  const map={solid:null,dashed:'8,4',dotted:'2,4',dashdot:'8,3,2,3'};
  return map[style]??null;
}

function applyEdgeStyle(el,color,width,style) {
  el.setAttribute('stroke',color);
  el.setAttribute('stroke-width',width);
  el.setAttribute('fill','none');
  const da=dasharray(style);
  if(da) el.setAttribute('stroke-dasharray',da);
  else   el.removeAttribute('stroke-dasharray');
}

// Draw a point symbol centred at (cx,cy) with given radius into parent SVG element.
// symbol: 'circle' | 'square' | 'cross' | 'diamond' | 'triangle'
function drawPointSymbol(parent,cx,cy,r,fill,stroke,strokeWidth,symbol,extraAttrs) {
  const attrs=extraAttrs||{};
  switch(symbol) {
    case 'square': {
      const s=r*1.85;
      return parent.appendChild(svgEl('rect',{x:cx-s/2,y:cy-s/2,width:s,height:s,fill,stroke,'stroke-width':strokeWidth,...attrs}));
    }
    case 'cross': {
      const hw=r*0.38;
      const d=`M${cx-hw},${cy-r} L${cx+hw},${cy-r} L${cx+hw},${cy-hw} L${cx+r},${cy-hw} L${cx+r},${cy+hw} L${cx+hw},${cy+hw} L${cx+hw},${cy+r} L${cx-hw},${cy+r} L${cx-hw},${cy+hw} L${cx-r},${cy+hw} L${cx-r},${cy-hw} L${cx-hw},${cy-hw} Z`;
      return parent.appendChild(svgEl('path',{d,fill,stroke,'stroke-width':strokeWidth,...attrs}));
    }
    case 'diamond': {
      const p=`${cx},${cy-r} ${cx+r},${cy} ${cx},${cy+r} ${cx-r},${cy}`;
      return parent.appendChild(svgEl('polygon',{points:p,fill,stroke,'stroke-width':strokeWidth,...attrs}));
    }
    case 'triangle': {
      const h=r*1.5,w=r*1.3;
      const p=`${cx},${cy-h*0.7} ${cx+w},${cy+h*0.3} ${cx-w},${cy+h*0.3}`;
      return parent.appendChild(svgEl('polygon',{points:p,fill,stroke,'stroke-width':strokeWidth,...attrs}));
    }
    default: // circle
      return parent.appendChild(svgEl('circle',{cx,cy,r,fill,stroke,'stroke-width':strokeWidth,...attrs}));
  }
}

// Build a draggable SVG legend group at (x0,y0)
function drawLegend(svg,entries,x0,y0) {
  if(!entries.length) return;
  const ROW_H=18,PAD=6,COL_W=148;
  const totalH=entries.length*ROW_H+PAD*2+14; // extra for close btn row
  const g=svgEl('g',{id:'legend-g-2d',transform:`translate(${x0},${y0})`,'data-legend-drag':'1'});
  g.appendChild(svgEl('rect',{x:0,y:0,width:COL_W,height:totalH,fill:'rgba(255,255,255,0.88)',stroke:'#ccc','stroke-width':0.5,rx:4,'data-legend-drag':'1'}));
  // Close button
  const closeBtn=svgEl('text',{x:COL_W-PAD,y:PAD+8,'font-size':12,'font-family':'sans-serif',fill:'#999',cursor:'pointer',class:'legend-close','data-legend-close':'1','text-anchor':'end'});
  closeBtn.textContent='×';
  g.appendChild(closeBtn);
  entries.forEach((entry,idx)=>{
    const cy=PAD+14+idx*ROW_H+ROW_H/2;
    const ix=PAD+9;
    if(entry.type==='circle') {
      drawPointSymbol(g,ix,cy,4.5,entry.color,'white',1,entry.symbol||'circle');
    } else {
      const lw=Math.min(entry.lw||1.5,2.5);
      const ln=svgEl('line',{x1:PAD,y1:cy,x2:PAD+20,y2:cy,stroke:entry.color,'stroke-width':lw});
      const da=dasharray(entry.style);
      if(da) ln.setAttribute('stroke-dasharray',da);
      g.appendChild(ln);
    }
    const txt=svgEl('text',{x:PAD+24,y:cy+4,'font-size':11,'font-family':'sans-serif',fill:'#333'});
    txt.textContent=entry.label;
    g.appendChild(txt);
  });
  svg.appendChild(g);
}

// ════════════════════════════════════════════════════════════════
// 3D Legend HTML builder
// ════════════════════════════════════════════════════════════════
function legendSymbolSVG(color,symbol) {
  const cx=7,cy=7,r=4.5;
  switch(symbol) {
    case 'square': {
      const s=r*1.85;
      return `<svg width="14" height="14" style="flex-shrink:0;display:block"><rect x="${cx-s/2}" y="${cy-s/2}" width="${s}" height="${s}" fill="${color}" stroke="white" stroke-width="0.8"/></svg>`;
    }
    case 'cross': {
      const hw=r*0.38;
      const d=`M${cx-hw},${cy-r} L${cx+hw},${cy-r} L${cx+hw},${cy-hw} L${cx+r},${cy-hw} L${cx+r},${cy+hw} L${cx+hw},${cy+hw} L${cx+hw},${cy+r} L${cx-hw},${cy+r} L${cx-hw},${cy+hw} L${cx-r},${cy+hw} L${cx-r},${cy-hw} L${cx-hw},${cy-hw} Z`;
      return `<svg width="14" height="14" style="flex-shrink:0;display:block"><path d="${d}" fill="${color}" stroke="white" stroke-width="0.8"/></svg>`;
    }
    case 'diamond':
      return `<svg width="14" height="14" style="flex-shrink:0;display:block"><polygon points="${cx},${cy-r} ${cx+r},${cy} ${cx},${cy+r} ${cx-r},${cy}" fill="${color}" stroke="white" stroke-width="0.8"/></svg>`;
    case 'triangle': {
      const h=r*1.5,w=r*1.3;
      return `<svg width="14" height="14" style="flex-shrink:0;display:block"><polygon points="${cx},${cy-h*0.7} ${cx+w},${cy+h*0.3} ${cx-w},${cy+h*0.3}" fill="${color}" stroke="white" stroke-width="0.8"/></svg>`;
    }
    default:
      return `<svg width="14" height="14" style="flex-shrink:0;display:block"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="white" stroke-width="0.8"/></svg>`;
  }
}

function buildLegend3D(items) {
  let html=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">`;
  html+=`<strong style="font-size:11px">${t('legendTitle')}</strong>`;
  html+=`<span class="l3d-close" style="cursor:pointer;font-size:13px;color:#999;line-height:1;padding:0 2px">×</span>`;
  html+=`</div>`;
  for(const item of items) {
    html+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">`;
    if(item.type==='circle') {
      html+=legendSymbolSVG(item.color,item.symbol||'circle');
    } else if(item.type==='fill') {
      html+=`<svg width="20" height="10" style="flex-shrink:0"><rect x="0" y="1" width="20" height="8" fill="${item.color}" opacity="0.5"/></svg>`;
    } else {
      const da=dasharray(item.style)||'';
      const daAttr=da?`stroke-dasharray="${da}"`:'';
      const lw=Math.min(item.lw||1,2);
      html+=`<svg width="20" height="10" style="flex-shrink:0"><line x1="0" y1="5" x2="20" y2="5" stroke="${item.color}" stroke-width="${lw}" ${daAttr}/></svg>`;
    }
    html+=`<span>${item.label}</span></div>`;
  }
  return html;
}

// ════════════════════════════════════════════════════════════════
// State
// ════════════════════════════════════════════════════════════════
let legendPos2d  = {x:10,y:10};  // 2D SVG legend position
let legendPos3d  = {x:8,y:8};    // 3D div legend position
let dragLegend2d = null;          // {startMX,startMY,startLX,startLY}
let dragLegend3d = null;
let isDragging2D = false;         // true while a point is dragged (low-res raster)
let svgParams    = {PAD:0,W:0,S:600};

// Side of the square figure, in pixels.
function figureSize() {
  const box=document.querySelector('.cloud-figure');
  return Math.max(240,Math.round(box.clientWidth)-2);
}

// Values of the controls read at every render.
function settings() {
  const highlight=byId('highlight').value;
  return {
    showQ:byId('show-q').checked, qLabel:byId('q-label').value, q:query.value, metric:metric.value,
    highlight, showKnn:highlight==='knn', showMmr:highlight==='mmr', showDpp:highlight==='dpp',
    knnK:kField.value, knnColor:byId('knn-c').value, lambda:lambdaField.value,
    algo:byId('algo').value, alpha:alphaField.value, kSel:kSelField.value, selColor:byId('sel-c').value,
    S:figureSize(), showLeg:byId('show-legend').checked,
  };
}

// Edges of the cube [-1,1]^3, as in the other point-cloud applettes.
function makeCubeFrame() {
  const frame=new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(2,2,2)),
    new THREE.LineBasicMaterial({color:0xcfc8bc}));
  frame.userData.isSceneObj=true;
  return frame;
}

// Legend under the figure, from the entries of the legend of the figure.
function showLegendBelow(items) {
  byId('legend').innerHTML=items.map(item=>{
    let mark;
    if(item.type==='circle') mark=legendSymbolSVG(item.color,item.symbol||'circle');
    else if(item.type==='fill') mark=`<svg width="20" height="10"><rect x="0" y="1" width="20" height="8" fill="${item.color}" opacity="0.5"/></svg>`;
    else {
      const da=dasharray(item.style);
      mark=`<svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="${item.color}" stroke-width="${Math.min(item.lw||1,2.5)}"${da?` stroke-dasharray="${da}"`:''}/></svg>`;
    }
    return `<span class="sel-legend-item">${mark}<span>${item.label}</span></span>`;
  }).join('');
}

// ════════════════════════════════════════════════════════════════
// Non-Euclidean Voronoi — rasterization for 2D
// ════════════════════════════════════════════════════════════════
// RES is passed in: S for final render, ~200 while dragging.
function rasterVoronoi2D(allPts, PAD, W, S, RES) {
  const n = allPts.length;
  const assignments = new Int16Array(RES * RES);
  const step = S / RES;

  // Flatten to typed arrays for cache-efficient inner loops
  const px = new Float32Array(n), py = new Float32Array(n);
  for(let i=0;i<n;i++){px[i]=allPts[i][0]; py[i]=allPts[i][1];}

  const m = activeMetric;
  for(let r=0;r<RES;r++){
    const qy = 1 - 2*((r+0.5)*step - PAD)/W;
    for(let c=0;c<RES;c++){
      const qx = 2*((c+0.5)*step - PAD)/W - 1;
      let best=0, bestD=Infinity;
      if(m==='manhattan'){
        for(let i=0;i<n;i++){const d=Math.abs(qx-px[i])+Math.abs(qy-py[i]);if(d<bestD){bestD=d;best=i;}}
      } else { // chebyshev
        for(let i=0;i<n;i++){const ax=Math.abs(qx-px[i]),ay=Math.abs(qy-py[i]);const d=ax>ay?ax:ay;if(d<bestD){bestD=d;best=i;}}
      }
      assignments[r*RES+c]=best;
    }
  }

  // Extract Delaunay-dual adjacency (pairs of touching cells)
  const adjSet=new Set(), delAdjEdges=[];
  for(let r=0;r<RES;r++){
    for(let c=0;c<RES;c++){
      const cur=assignments[r*RES+c];
      if(c+1<RES){const nb=assignments[r*RES+c+1];if(nb!==cur){const key=Math.min(cur,nb)*10000+Math.max(cur,nb);if(!adjSet.has(key)){adjSet.add(key);delAdjEdges.push([Math.min(cur,nb),Math.max(cur,nb)]);}}}
      if(r+1<RES){const nb=assignments[(r+1)*RES+c];if(nb!==cur){const key=Math.min(cur,nb)*10000+Math.max(cur,nb);if(!adjSet.has(key)){adjSet.add(key);delAdjEdges.push([Math.min(cur,nb),Math.max(cur,nb)]);}}}
    }
  }
  return {rasterAssign:assignments, rasterRES:RES, delAdjEdges};
}

// Merge collinear raster boundary segments into a compact SVG path string
function buildBoundaryPath(rasterAssign, RES, S) {
  const step = S / RES;
  const parts = [];
  // Horizontal boundaries between row r and r+1
  for(let r=0;r<RES-1;r++){
    let start=-1;
    for(let c=0;c<=RES;c++){
      const isBound = c<RES && rasterAssign[r*RES+c]!==rasterAssign[(r+1)*RES+c];
      if(isBound && start===-1) start=c;
      else if(!isBound && start!==-1){parts.push(`M${start*step} ${(r+1)*step}H${c*step}`);start=-1;}
    }
  }
  // Vertical boundaries between col c and c+1
  for(let c=0;c<RES-1;c++){
    let start=-1;
    for(let r=0;r<=RES;r++){
      const isBound = r<RES && rasterAssign[r*RES+c]!==rasterAssign[r*RES+c+1];
      if(isBound && start===-1) start=r;
      else if(!isBound && start!==-1){parts.push(`M${(c+1)*step} ${start*step}V${r*step}`);start=-1;}
    }
  }
  return parts.join('');
}

// ════════════════════════════════════════════════════════════════
// 2D Render
// ════════════════════════════════════════════════════════════════
function render2D() {
  const s=settings();
  const {showQ,qLabel,showKnn,showMmr,showDpp,knnK,knnColor,lambda,algo,alpha,kSel,selColor,S,showLeg}=s;
  activeMetric  = s.metric;
  const [qx,qy] = s.q;
  const fillC   = document.getElementById('fill-cells').checked;
  const showVor = document.getElementById('show-vor').checked;
  const showRng = document.getElementById('show-rng').checked;
  const showGab = document.getElementById('show-gab').checked;
  const showDel = document.getElementById('show-del').checked;

  const VC=document.getElementById('vor-c').value, VS=document.getElementById('vor-s').value, VW=parseFloat(document.getElementById('vor-w').value)||1;
  const RC=document.getElementById('rng-c').value, RS=document.getElementById('rng-s').value, RW=parseFloat(document.getElementById('rng-w').value)||1;
  const GC=document.getElementById('gab-c').value, GS=document.getElementById('gab-s').value, GW=parseFloat(document.getElementById('gab-w').value)||1;
  const DC=document.getElementById('del-c').value, DS=document.getElementById('del-s').value, DW=parseFloat(document.getElementById('del-w').value)||1;
  const PAD=Math.floor(S*0.07), W=S-2*PAD;
  svgParams={PAD,W,S};
  // Map [-1,1] ↔ pixel space: sx(x)=PAD+(x+1)/2*W, sy(y)=PAD+(1-y)/2*W
  const sx=x=>PAD+(x+1)/2*W, sy=y=>PAD+(1-y)/2*W;
  const ix=px=>Math.max(-1,Math.min(1,2*(px-PAD)/W-1));
  const iy=py=>Math.max(-1,Math.min(1,1-2*(py-PAD)/W));

  const pts=cloud.points;
  const n=pts.length;
  const spts=pts.map(([x,y])=>[sx(x),sy(y)]);
  const q=[qx,qy], sqx=sx(qx), sqy=sy(qy);

  // Build allPts/allSpts including q when showQ
  const allPts  = showQ ? [...pts,[qx,qy]]   : pts;
  const allSpts = showQ ? [...spts,[sqx,sqy]] : spts;

  const knnSet=new Set(), selSet=new Set(), statParts=[];
  let warn='';
  if(showQ) {
    if(showKnn) { kNN(pts,q,knnK).forEach(i=>knnSet.add(i)); statParts.push(say('statKnn',{k:knnK,m:knnSet.size})); }
    if(showMmr) { MMR(pts,q,knnK,lambda).forEach(i=>knnSet.add(i)); statParts.push(say('statMmr',{k:knnK,l:num(lambda,2),m:knnSet.size})); }
    if(showDpp) { GreedyDPP(pts,q,knnK).forEach(i=>knnSet.add(i)); statParts.push(say('statDpp',{k:knnK,m:knnSet.size})); }
    if(algo!=='none') {
      let sel;
      sel=RNGScore(pts,q,kSel,alpha);
      sel.forEach(i=>selSet.add(i));
      statParts.push(say('statRng',{a:num(alpha,3),m:sel.length,k:kSel}));
    }
  }
  if((showRng||showGab)&&n>100) warn='  \u26a0 '+t('warnSlow');
  document.getElementById('stats').textContent=(statParts.join('  \u00b7  ')||say('statCorpus',{n}))+warn;

  // Delaunay/Voronoi: Euclidean/Cosine via d3 (exact), Manhattan/Chebyshev via rasterization
  const rngEdges = showRng ? computeRNG(allPts) : [];
  const gabEdges = showGab ? computeGabriel(allPts) : [];
  let del=null, vor=null;
  let rasterAssign=null, rasterRES=0, delAdjEdges=null;
  let cosineDelEdges=null;
  if(activeMetric==='euclidean') {
    del = d3.Delaunay.from(allSpts);
    vor = del.voronoi([0,0,S,S]);
  } else if(activeMetric==='cosine') {
    // Cosine bisector of p,q satisfies x·(p̂-q̂)=0 — same as Euclidean bisector of unit-normalised points
    const normSpts=allPts.map(([x,y])=>{const l=Math.sqrt(x*x+y*y);return l<1e-9?[sx(0),sy(0)]:[sx(x/l),sy(y/l)];});
    del=d3.Delaunay.from(normSpts);
    vor=del.voronoi([0,0,S,S]);
    // Delaunay adjacency drawn between original (non-normalised) positions
    if(showDel){cosineDelEdges=[];for(let i=0;i<allPts.length;i++) for(const j of del.neighbors(i)) if(j>i) cosineDelEdges.push([i,j]);}
  } else if(showVor||showDel||fillC) {
    // Manhattan/Chebyshev: full canvas resolution when static, low-res while dragging
    const fastRES = isDragging2D ? Math.min(200,S) : S;
    ({rasterAssign,rasterRES,delAdjEdges}=rasterVoronoi2D(allPts,PAD,W,S,fastRES));
  }

  const svg=document.getElementById('diagram2d');
  svg.setAttribute('width',S); svg.setAttribute('height',S); svg.setAttribute('xmlns',NS);
  while(svg.firstChild) svg.removeChild(svg.firstChild);

  // Defs for hatch pattern (dual-color cells)
  const defs=svgEl('defs');
  const pat=svgEl('pattern',{id:'hatch-both',patternUnits:'userSpaceOnUse',width:12,height:12,patternTransform:'rotate(45 0 0)'});
  pat.appendChild(svgEl('rect',{x:0,y:0,width:6,height:12,fill:knnColor,'fill-opacity':0.4}));
  pat.appendChild(svgEl('rect',{x:6,y:0,width:6,height:12,fill:selColor,'fill-opacity':0.4}));
  defs.appendChild(pat);
  svg.appendChild(defs);

  // Background rect (click target for add-point)
  svg.appendChild(svgEl('rect',{id:'bg-rect',width:S,height:S,fill:'white'}));

  // Cell fills
  if(fillC) {
    if(vor) {
      const totalPts=allSpts.length;
      for(let i=0;i<totalPts;i++) {
        const pathStr=vor.renderCell(i);
        if(!pathStr) continue;
        let fill,opacity=0.28;
        if(i===n&&showQ) { fill='#2171b5'; opacity=0.22; }
        else if(selSet.has(i)&&knnSet.has(i)) { fill='url(#hatch-both)'; opacity=1; }
        else if(selSet.has(i))  { fill=selColor; }
        else if(knnSet.has(i))  { fill=knnColor; }
        else                    { fill='#d8d8d8'; opacity=0.18; }
        const attrs={d:pathStr,fill,stroke:'none'};
        if(opacity!==1) attrs['fill-opacity']=opacity;
        svg.appendChild(svgEl('path',attrs));
      }
    } else if(rasterAssign) {
      // Canvas-based fills for non-Euclidean metrics
      const canv=document.createElement('canvas');
      canv.width=rasterRES; canv.height=rasterRES;
      const ctx=canv.getContext('2d');
      const imgData=ctx.createImageData(rasterRES,rasterRES);
      function hexRGB(h){const v=parseInt(h.replace('#',''),16);return[(v>>16)&255,(v>>8)&255,v&255];}
      const knnRGB=hexRGB(knnColor), selRGB=hexRGB(selColor);
      const totalPts=allPts.length;
      // null marks dual-color cells — rendered per-pixel with diagonal stripes matching the SVG hatch pattern
      const ptColors=[];
      for(let i=0;i<totalPts;i++){
        if(i===n&&showQ)                      ptColors.push([33,113,181,56]);
        else if(selSet.has(i)&&knnSet.has(i)) ptColors.push(null);
        else if(selSet.has(i))                ptColors.push([...selRGB,71]);
        else if(knnSet.has(i))                ptColors.push([...knnRGB,71]);
        else                                  ptColors.push([216,216,216,46]);
      }
      for(let i=0;i<rasterAssign.length;i++){
        const idx=rasterAssign[i];
        if(idx<0||idx>=ptColors.length) continue;
        let cr,cg,cb,ca;
        if(ptColors[idx]===null) {
          // Diagonal stripe: use screen-space coords so stripe width is constant regardless of rasterRES
          const row=Math.floor(i/rasterRES), col=i%rasterRES;
          const useKnn=Math.floor((col*S/rasterRES+row*S/rasterRES)/12)%2===0;
          [cr,cg,cb]=useKnn?knnRGB:selRGB; ca=102; // ~0.4 opacity, matching SVG hatch fill-opacity
        } else {
          [cr,cg,cb,ca]=ptColors[idx];
        }
        imgData.data[i*4]=cr; imgData.data[i*4+1]=cg; imgData.data[i*4+2]=cb; imgData.data[i*4+3]=ca;
      }
      ctx.putImageData(imgData,0,0);
      svg.appendChild(svgEl('image',{x:0,y:0,width:S,height:S,href:canv.toDataURL()}));
    }
  }

  if(showDel) {
    if(del && activeMetric!=='cosine') {
      const p=svgEl('path',{d:del.render()}); applyEdgeStyle(p,DC,DW,DS); svg.appendChild(p);
    } else if(cosineDelEdges) {
      // Edges connect original positions, not normalised ones
      const pathD=cosineDelEdges.map(([i,j])=>`M${allSpts[i][0]} ${allSpts[i][1]}L${allSpts[j][0]} ${allSpts[j][1]}`).join('');
      if(pathD){const p=svgEl('path',{d:pathD}); applyEdgeStyle(p,DC,DW,DS); svg.appendChild(p);}
    } else if(delAdjEdges) {
      const pathD=delAdjEdges.filter(([i,j])=>i<allSpts.length&&j<allSpts.length)
        .map(([i,j])=>`M${allSpts[i][0]} ${allSpts[i][1]}L${allSpts[j][0]} ${allSpts[j][1]}`).join('');
      if(pathD){const p=svgEl('path',{d:pathD}); applyEdgeStyle(p,DC,DW,DS); svg.appendChild(p);}
    }
  }
  if(showVor) {
    if(vor) {
      const p=svgEl('path',{d:vor.render()}); applyEdgeStyle(p,VC,VW,VS); svg.appendChild(p);
    } else if(rasterAssign) {
      const d=buildBoundaryPath(rasterAssign,rasterRES,S);
      if(d){const p=svgEl('path',{d}); applyEdgeStyle(p,VC,VW,VS); svg.appendChild(p);}
    }
  }

  if(showRng) for(const[i,j] of rngEdges) {
    const ln=svgEl('line',{x1:allSpts[i][0],y1:allSpts[i][1],x2:allSpts[j][0],y2:allSpts[j][1]});
    applyEdgeStyle(ln,RC,RW,RS); svg.appendChild(ln);
  }
  if(showGab) for(const[i,j] of gabEdges) {
    const ln=svgEl('line',{x1:allSpts[i][0],y1:allSpts[i][1],x2:allSpts[j][0],y2:allSpts[j][1]});
    applyEdgeStyle(ln,GC,GW,GS); svg.appendChild(ln);
  }

  const knnSym=document.getElementById('knn-sym').value;
  const selSym=document.getElementById('sel-sym').value;

  // Corpus points
  for(let i=0;i<n;i++) {
    const[cx,cy]=spts[i];
    const both=selSet.has(i)&&knnSet.has(i);
    if(both) {
      // Outer ring (always circle) — thick colored stroke makes dual-selection obvious
      svg.appendChild(svgEl('circle',{cx,cy,r:11,fill:'none',stroke:knnColor,'stroke-width':3.5,'data-idx':i}));
      // Inner sel symbol
      drawPointSymbol(svg,cx,cy,5.5,selColor,'white',1.5,selSym,{'data-idx':i});
    } else if(selSet.has(i)) {
      drawPointSymbol(svg,cx,cy,5.5,selColor,'white',1.5,selSym,{'data-idx':i});
    } else if(knnSet.has(i)) {
      drawPointSymbol(svg,cx,cy,5.5,knnColor,'white',1.5,knnSym,{'data-idx':i});
    } else {
      svg.appendChild(svgEl('circle',{cx,cy,r:5,fill:'#636363',stroke:'white','stroke-width':1.5,'data-idx':i}));
    }
  }

  // Query point
  if(showQ) {
    svg.appendChild(svgEl('circle',{cx:sqx,cy:sqy,r:7,fill:'#2171b5',stroke:'white','stroke-width':2,'data-no-add':'1','data-q':'1',style:'cursor:move'}));
    if(qLabel) {
      const lbl=svgEl('text',{x:sqx+9,y:sqy-6,'font-size':11,'font-weight':'bold','font-family':'sans-serif',fill:'#2171b5'});
      lbl.textContent=qLabel;
      svg.appendChild(lbl);
    }
  }

  // Legend
  {
    const legendEntries=[];
    legendEntries.push({type:'circle',color:'#636363',label:t('legCorpus')});
    if(showQ) legendEntries.push({type:'circle',color:'#2171b5',label:`${t('legQuery')} ${qLabel||'q'}`});
    if(showQ&&showKnn) legendEntries.push({type:'circle',color:knnColor,symbol:knnSym,label:`k-NN (k=${knnK})`});
    if(showQ&&showMmr) legendEntries.push({type:'circle',color:knnColor,symbol:knnSym,label:`MMR (k=${knnK}, λ=${lambda.toFixed(2)})`});
    if(showQ&&showDpp) legendEntries.push({type:'circle',color:knnColor,symbol:knnSym,label:`DPP (k=${knnK})`});
    if(showQ&&algo!=='none') legendEntries.push({type:'circle',color:selColor,symbol:selSym,label:t('legSelected')});
    if(showVor) legendEntries.push({type:'line',color:VC,style:VS,lw:VW,label:t('legVoronoi')});
    if(showRng) legendEntries.push({type:'line',color:RC,style:RS,lw:RW,label:'RNG'});
    if(showGab) legendEntries.push({type:'line',color:GC,style:GS,lw:GW,label:'Gabriel'});
    if(showDel) legendEntries.push({type:'line',color:DC,style:DS,lw:DW,label:'Delaunay'});
    showLegendBelow(legendEntries);
    if(showLeg) drawLegend(svg,legendEntries,legendPos2d.x,legendPos2d.y);
  }
}

// ════════════════════════════════════════════════════════════════
// 3D Render
// ════════════════════════════════════════════════════════════════
function render3D() {
  const s=settings();
  const {showQ,qLabel,showKnn,showMmr,showDpp,knnK,knnColor,lambda,algo,alpha,kSel,selColor,S,showLeg}=s;
  activeMetric = s.metric;
  const showDel=document.getElementById('show-del').checked;
  const showRng=document.getElementById('show-rng').checked;
  const showGab=document.getElementById('show-gab').checked;
  const showVB =document.getElementById('show-vor-bounds').checked;

  const DC=document.getElementById('del-c').value, DW=parseFloat(document.getElementById('del-w').value)||1;
  const RC=document.getElementById('rng-c').value, RW=parseFloat(document.getElementById('rng-w').value)||1;
  const GC=document.getElementById('gab-c').value, GW=parseFloat(document.getElementById('gab-w').value)||1;
  const VBC=document.getElementById('vb-c').value, VBW=parseFloat(document.getElementById('vb-w').value)||0.5;
  const fillDel=document.getElementById('fill-del-3d').checked;
  const fillVor=document.getElementById('fill-vor-3d').checked;
  const DFC=document.getElementById('delf-c').value, DFA=parseFloat(document.getElementById('delf-a').value)||0.12;
  const VFC=document.getElementById('vorf-c').value, VFA=parseFloat(document.getElementById('vorf-a').value)||0.12;
  const axX=document.getElementById('ax-x').value;
  const axY=document.getElementById('ax-y').value;
  const axZ=document.getElementById('ax-z').value;
  renderer.setSize(S,S);
  camera.aspect=1; camera.updateProjectionMatrix();

  const pts=cloud.points;
  const n=pts.length;
  const q=s.q;
  const allPts=showQ?[...pts,q]:pts;

  const knnSet=new Set(),selSet=new Set(),statParts=[],warns=[];
  if(showQ) {
    if(showKnn) { kNN(pts,q,knnK).forEach(i=>knnSet.add(i)); statParts.push(say('statKnn',{k:knnK,m:knnSet.size})); }
    if(showMmr) { MMR(pts,q,knnK,lambda).forEach(i=>knnSet.add(i)); statParts.push(say('statMmr',{k:knnK,l:num(lambda,2),m:knnSet.size})); }
    if(showDpp) { GreedyDPP(pts,q,knnK).forEach(i=>knnSet.add(i)); statParts.push(say('statDpp',{k:knnK,m:knnSet.size})); }
    if(algo!=='none') {
      let sel;
      sel=RNGScore(pts,q,kSel,alpha);
      sel.forEach(i=>selSet.add(i));
      statParts.push(say('statRng',{a:num(alpha,3),m:sel.length,k:kSel}));
    }
  }

  clearScene3D();

  // Axis lines — full [-1,1] range
  scene.add(makeAxisLine(-1,0,0,1,0,0,hexToInt(axX)));
  scene.add(makeAxisLine(0,-1,0,0,1,0,hexToInt(axY)));
  scene.add(makeAxisLine(0,0,-1,0,0,1,hexToInt(axZ)));
  scene.add(makeCubeFrame());

  const knnSym=document.getElementById('knn-sym').value;
  const selSym=document.getElementById('sel-sym').value;

  // Corpus points
  for(let i=0;i<n;i++) {
    const both=selSet.has(i)&&knnSet.has(i);
    if(both) {
      // Sel symbol with a ring in the knn colour around it, as in the 2D figure
      scene.add(makeSymbol3D(pts[i][0],pts[i][1],pts[i][2],0.018,hexToInt(selColor),selSym));
      scene.add(makeRing3D(pts[i][0],pts[i][1],pts[i][2],0.042,knnColor));
    } else if(selSet.has(i)) {
      scene.add(makeSymbol3D(pts[i][0],pts[i][1],pts[i][2],0.018,hexToInt(selColor),selSym));
    } else if(knnSet.has(i)) {
      scene.add(makeSymbol3D(pts[i][0],pts[i][1],pts[i][2],0.018,hexToInt(knnColor),knnSym));
    } else {
      scene.add(makeSphere(pts[i][0],pts[i][1],pts[i][2],0.012,0x636363));
    }
  }
  if(showQ) scene.add(makeSphere(q[0],q[1],q[2],0.025,0x2171b5));

  const skipRngGab=n>80, skipDel=n>150, skipFacets=n>60;
  if(activeMetric!=='euclidean' && (showDel||fillDel||showVB||fillVor)) {
    warns.push(t('warnEuclid'));
  }

  // Delaunay / Voronoï facets (on allPts to include q)
  if(showDel||fillDel||showVB||fillVor) {
    if(skipDel) { warns.push(t('warnDelaunay')); }
    else {
      try {
        const {pureTets,allTets,bwPts}=bowyerWatson3D(allPts);
        if(showDel) {
          const edges=delaunayEdges3D(pureTets);
          const lines=makeLines3D(edges,allPts,hexToInt(DC),DW);
          if(lines) scene.add(lines);
        }
        if(fillDel) {
          const faceMap=new Map();
          for(const[a,b,c,d] of pureTets) for(const f of [[a,b,c],[a,b,d],[a,c,d],[b,c,d]]) {
            const key=[...f].sort((x,y)=>x-y).join(',');
            if(!faceMap.has(key)) faceMap.set(key,f);
          }
          const pos=[];
          for(const[a,b,c] of faceMap.values()) pos.push(allPts[a][0],allPts[a][1],allPts[a][2],allPts[b][0],allPts[b][1],allPts[b][2],allPts[c][0],allPts[c][1],allPts[c][2]);
          const mesh=makeFacetMesh3D(pos,hexToInt(DFC),DFA);
          if(mesh) scene.add(mesh);
        }
        if(showVB||fillVor) {
          if(skipFacets) warns.push(t('warnFacets'));
          else {
            const facets=voronoiFacets3D(bwPts,allTets,allPts.length);
            if(showVB) {
              const segs=voronoiFacetEdges3D(facets);
              const vbLines=makeLineSegments3D(segs,hexToInt(VBC),VBW);
              if(vbLines) scene.add(vbLines);
            }
            if(fillVor) {
              const pos=[];
              for(const{verts} of facets) {
                if(verts.length<3) continue;
                for(let i=1;i<verts.length-1;i++) pos.push(...verts[0],...verts[i],...verts[i+1]);
              }
              const mesh=makeFacetMesh3D(pos,hexToInt(VFC),VFA);
              if(mesh) scene.add(mesh);
            }
          }
        }
      } catch(e) { warns.push(t('warnError')+' '+e.message); }
    }
  }

  if(showRng) {
    if(skipRngGab) warns.push(t('warnRng'));
    else { const edges=computeRNG(allPts); const l=makeLines3D(edges,allPts,hexToInt(RC),RW); if(l) scene.add(l); }
  }
  if(showGab) {
    if(skipRngGab) warns.push(t('warnGabriel'));
    else { const edges=computeGabriel(allPts); const l=makeLines3D(edges,allPts,hexToInt(GC),GW); if(l) scene.add(l); }
  }

  const warnStr=warns.length?'  \u26a0 '+warns.join(' '):'';
  document.getElementById('stats').textContent=(statParts.join('  \u00b7  ')||say('statCorpus',{n}))+warnStr;

  // 3D Legend
  const legend3dEl=document.getElementById('legend3d');
  {
    legend3dEl.style.display=showLeg?'block':'none';
    legend3dEl.style.left=legendPos3d.x+'px';
    legend3dEl.style.top=legendPos3d.y+'px';
    const items=[];
    items.push({type:'circle',color:'#636363',label:t('legCorpus')});
    if(showQ) items.push({type:'circle',color:'#2171b5',label:`${t('legQuery')} ${qLabel||'q'}`});
    if(showQ&&showKnn) items.push({type:'circle',color:knnColor,symbol:knnSym,label:`k-NN (k=${knnK})`});
    if(showQ&&showMmr) items.push({type:'circle',color:knnColor,symbol:knnSym,label:`MMR (k=${knnK}, λ=${lambda.toFixed(2)})`});
    if(showQ&&showDpp) items.push({type:'circle',color:knnColor,symbol:knnSym,label:`DPP (k=${knnK})`});
    if(showQ&&algo!=='none') items.push({type:'circle',color:selColor,symbol:selSym,label:t('legSelected')});
    if(showDel&&!skipDel) items.push({type:'line',color:DC,style:document.getElementById('del-s').value,lw:DW,label:'Delaunay'});
    if(fillDel&&!skipDel) items.push({type:'fill',color:DFC,opacity:DFA,label:t('legDelFill')});
    if(showRng&&!skipRngGab) items.push({type:'line',color:RC,style:document.getElementById('rng-s').value,lw:RW,label:'RNG'});
    if(showGab&&!skipRngGab) items.push({type:'line',color:GC,style:document.getElementById('gab-s').value,lw:GW,label:'Gabriel'});
    if(showVB&&!skipFacets) items.push({type:'line',color:VBC,style:document.getElementById('vb-s').value,lw:VBW,label:t('legVorBounds')});
    if(fillVor&&!skipFacets) items.push({type:'fill',color:VFC,opacity:VFA,label:t('legVorFill')});
    legend3dEl.innerHTML=buildLegend3D(items);
    showLegendBelow(items);
  }
}

// ════════════════════════════════════════════════════════════════
// PNG Download
// ════════════════════════════════════════════════════════════════
function download() {
  const name=`${t('fileName')}-${cloud.dim}d.png`;
  if(cloud.dim===3) { renderer.render(scene,camera); saveCanvasPNG(canvas3d,name); }
  else saveSvgPNG(byId('diagram2d'),name);
}

// ════════════════════════════════════════════════════════════════
// Render Dispatch
// ════════════════════════════════════════════════════════════════
// Shows the figure and the controls of the current dimension and choices,
// then draws. A control is shown only when it applies.
function render() {
  const is3D=cloud.dim===3;
  const highlight=byId('highlight').value, algo=byId('algo').value;
  byId('stage2d').hidden=is3D;
  byId('stage3d').hidden=!is3D;
  for(const id of ['vor-row','fill-row','vor-style-row']) byId(id).hidden=is3D;
  for(const id of ['vor-bounds-row','del-fill-row','vorf-row','vor-bounds-style-row','del-fill-style-row','vorf-style-row','axes-sec']) byId(id).hidden=!is3D;
  query.hidden=!byId('show-q').checked;
  kField.hidden=highlight==='none';
  lambdaField.hidden=highlight!=='mmr';
  alphaField.hidden=algo==='none';
  kSelField.hidden=algo==='none';
  if(!is3D) byId('legend3d').style.display='none';
  if(is3D) render3D(); else render2D();
  byId('hint').textContent=editHint(t,cloud.dim);
}

// ════════════════════════════════════════════════════════════════
// Event Wiring
// ════════════════════════════════════════════════════════════════

// Controls written by hand in the panel: any change redraws the figure.
function onStaticChange(e) { if(e.target.closest('[data-static]')) render(); }
panel.addEventListener('input',onStaticChange);
panel.addEventListener('change',onStaticChange);

function resetAll() {
  panel.querySelectorAll('[data-static] input, [data-static] select').forEach(el=>{
    if(el.type==='checkbox') el.checked=el.defaultChecked;
    else if(el.tagName==='SELECT') Array.from(el.options).forEach(o=>{o.selected=o.defaultSelected;});
    else el.value=el.defaultValue;
  });
  kField.set(DEFAULTS.k);
  lambdaField.set(DEFAULTS.lambda);
  alphaField.set(DEFAULTS.alpha);
  kSelField.set(DEFAULTS.kSel);
  metric.set('euclidean');
  query.reset();
  legendPos2d={x:10,y:10};
  legendPos3d={x:8,y:8};
  camera.position.set(3,2.5,3);
  controls3d.target.set(0,0,0);
  cloud.reset();
}

// ── Editing of the cloud, with the gestures shared by the applettes ──
const svg2d=document.getElementById('diagram2d');
const isQueryShown=()=>byId('show-q').checked;
const onLegend=e=>!!(e.target.closest&&e.target.closest('[data-legend-drag]'));

attachEdit2D(svg2d,{
  toPixel:p=>[svgParams.PAD+(p[0]+1)/2*svgParams.W, svgParams.PAD+(1-p[1])/2*svgParams.W],
  toData:(x,y)=>[2*(x-svgParams.PAD)/svgParams.W-1, 1-2*(y-svgParams.PAD)/svgParams.W],
  cloud, query, isQueryShown,
  ignore:onLegend,
  // Under a raster metric the cells are drawn at low resolution during a drag.
  onEdit:dragging=>{ isDragging2D=dragging; render(); },
});
attachEdit3D(renderer.domElement,camera,controls3d,{cloud,query,isQueryShown,onEdit:()=>render()});

// ── Legend inside the figure: drag and close ──
svg2d.addEventListener('mousedown',e=>{
  if(e.target.dataset.legendClose==='1') return;
  if(onLegend(e)) {
    const r=svg2d.getBoundingClientRect();
    dragLegend2d={startMX:e.clientX-r.left,startMY:e.clientY-r.top,startLX:legendPos2d.x,startLY:legendPos2d.y};
    e.preventDefault();
  }
});

document.addEventListener('mousemove',e=>{
  if(dragLegend2d!==null) {
    const r=svg2d.getBoundingClientRect();
    const mx=e.clientX-r.left, my=e.clientY-r.top;
    legendPos2d.x=dragLegend2d.startLX+(mx-dragLegend2d.startMX);
    legendPos2d.y=dragLegend2d.startLY+(my-dragLegend2d.startMY);
    const lg=document.getElementById('legend-g-2d');
    if(lg) lg.setAttribute('transform',`translate(${legendPos2d.x},${legendPos2d.y})`);
  }
  if(dragLegend3d!==null) {
    const leg=document.getElementById('legend3d');
    legendPos3d.x=dragLegend3d.startLX+(e.clientX-dragLegend3d.startMX);
    legendPos3d.y=dragLegend3d.startLY+(e.clientY-dragLegend3d.startMY);
    leg.style.left=legendPos3d.x+'px';
    leg.style.top=legendPos3d.y+'px';
  }
});

document.addEventListener('mouseup',()=>{
  dragLegend2d=null;
  dragLegend3d=null;
});

svg2d.addEventListener('click',e=>{
  if(e.target.dataset.legendClose==='1') {
    document.getElementById('show-legend').checked=false;
    render();
  }
});

const legend3dEl=document.getElementById('legend3d');
legend3dEl.addEventListener('mousedown',e=>{
  if(e.target.classList.contains('l3d-close')) return;
  dragLegend3d={startMX:e.clientX,startMY:e.clientY,startLX:legendPos3d.x,startLY:legendPos3d.y};
  e.preventDefault();
});
legend3dEl.addEventListener('click',e=>{
  if(e.target.classList.contains('l3d-close')) {
    document.getElementById('show-legend').checked=false;
    legend3dEl.style.display='none';
  }
});

// The figure follows the width of the page.
if('ResizeObserver' in window) {
  let lastWidth=0;
  new ResizeObserver(entries=>{
    const width=entries[0].contentRect.width;
    if(Math.abs(width-lastWidth)>0.5) { lastWidth=width; render(); }
  }).observe(document.querySelector('.cloud-figure'));
}

// Initial render
render();
window.selectionApplet={cloud,query,render};
