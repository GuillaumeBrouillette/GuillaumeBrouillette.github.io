// Persistence diagram of a point cloud.
//
// Web port of the desktop applet persistence_vis_gudhi.py: the Vietoris–Rips
// complex of a point cloud at an adjustable radius r, with the barcode and the
// Betti curves of the cloud, in 2D or in 3D. The persistence diagram shows the
// same intervals as the barcode. Persistent homology is computed here (the
// original relies on GUDHI), over Z/2, in dimensions 0 and 1 for a cloud of
// the plane and in dimensions 0, 1 and 2 for a cloud of space.
// The cloud, its controls and the editing gestures come from the module
// shared by the point-cloud applettes (/applets/cloud.js).
//
// Sections: 1. strings, 2. persistent homology, 3. 2D drawing, 4. 3D drawing,
// 5. page wiring.

import {
  CLOUD_STRINGS, withCloudStrings, editHint, CloudData, CloudView3D, numberField, actionButtons,
  attachEdit2D, attachEdit3D, formatNumber, saveCanvasesPNG,
} from "/applets/cloud.js";

// ---------------------------------------------------------------------------
// 1. Strings
// ---------------------------------------------------------------------------

const STRINGS = withCloudStrings({
  fr: {
    docTitle: "Diagramme de persistance d'un nuage de points – Guillaume Brouillette",
    title: "Diagramme de persistance d'un nuage de points",
    lead: "Cette applette construit le complexe de Vietoris-Rips d'un nuage de points du plan ou de l'espace à une échelle <i>r</i> réglable. Le diagramme de persistance, le code-barres et les courbes de Betti du nuage sont tracés à côté. Le nombre de points se règle dans le panneau et le nuage se modifie directement dans la figure.",
    radiusLabel: "Rayon <i>r</i>",
    radiusAria: "Rayon r",
    capComplex: "Complexe de Vietoris-Rips à l'échelle <i>r</i>",
    capDiagram: "Diagramme de persistance",
    capBarcode: "Code-barres",
    capBetti0: "Nombre de Betti <i>b</i><sub>0</sub> selon <i>r</i>",
    capBetti1: "Nombre de Betti <i>b</i><sub>1</sub> selon <i>r</i>",
    capBetti2: "Nombre de Betti <i>b</i><sub>2</sub> selon <i>r</i>",
    ariaComplex: "Complexe de Vietoris-Rips du nuage de points à l'échelle courante",
    ariaDiagram: "Diagramme de persistance du nuage de points",
    ariaBarcode: "Code-barres du nuage de points",
    ariaBetti0: "Courbe du nombre de Betti b0 selon le rayon",
    ariaBetti1: "Courbe du nombre de Betti b1 selon le rayon",
    ariaBetti2: "Courbe du nombre de Betti b2 selon le rayon",
    legendH0: "H<sub>0</sub>&nbsp;: composantes connexes",
    legendH1: "H<sub>1</sub>&nbsp;: cycles",
    legendH2: "H<sub>2</sub>&nbsp;: cavités",
    legendScale: "échelle courante",
    axisBirth: "naissance",
    axisDeath: "mort",
    status2: "Rayon <i>r</i> = {r}. Le complexe compte {v}, {e} et {f}. Nombres de Betti&nbsp;: <i>b</i><sub>0</sub> = {b0} et <i>b</i><sub>1</sub> = {b1}.",
    status3: "Rayon <i>r</i> = {r}. Le complexe compte {v}, {e}, {f} et {g}. Nombres de Betti&nbsp;: <i>b</i><sub>0</sub> = {b0}, <i>b</i><sub>1</sub> = {b1} et <i>b</i><sub>2</sub> = {b2}.",
    vertexOne: "sommet",
    vertexMany: "sommets",
    edgeOne: "arête",
    edgeMany: "arêtes",
    triangleOne: "triangle",
    triangleMany: "triangles",
    tetraOne: "tétraèdre",
    tetraMany: "tétraèdres",
    fileName: "diagramme-de-persistance",
    notesComplexTitle: "Complexe de Vietoris-Rips",
    notesComplex: "Un disque de rayon <i>r</i> est centré en chaque point du nuage. Deux points sont reliés par une arête lorsque leurs disques se rencontrent, c'est-à-dire lorsque leur distance est d'au plus 2<i>r</i>. Trois points forment un triangle plein lorsqu'ils sont reliés deux à deux. Le complexe grossit avec <i>r</i> et le calcul s'arrête à <i>r</i> = 1.",
    notesComplex3d: "En 3D, les disques deviennent des boules de rayon <i>r</i>, qui ne sont pas tracées. Les arêtes et les triangles suivent la même règle et quatre points reliés deux à deux forment un tétraèdre plein. Les triangles sont tracés en transparence.",
    notesReadTitle: "Lecture du diagramme",
    notesRead1: "L'homologie persistante suit les classes d'homologie du complexe lorsque <i>r</i> augmente. Chaque point (naissance, mort) du diagramme de persistance représente une classe. Sa première coordonnée est l'échelle à laquelle la classe apparaît et sa seconde coordonnée est l'échelle à laquelle elle disparaît. Sa hauteur au-dessus de la diagonale est donc la durée de vie de la classe&nbsp;: un point éloigné de la diagonale correspond à une structure présente sur une large plage d'échelles et un point proche de la diagonale correspond le plus souvent à du bruit.",
    notesRead2: "Les points de H<sub>0</sub> représentent les composantes connexes. Elles naissent toutes à <i>r</i> = 0 et l'une d'elles meurt chaque fois que deux composantes fusionnent. Les points de H<sub>1</sub> représentent les cycles qui entourent un trou. Un cycle naît lorsqu'une arête le referme et meurt lorsque des triangles le remplissent. En 3D, les points de H<sub>2</sub> représentent les surfaces fermées qui entourent une cavité. Une telle surface naît lorsqu'un triangle la referme et meurt lorsque des tétraèdres remplissent la cavité. Les classes encore présentes à <i>r</i> = 1 sont placées sur la ligne marquée ∞.",
    notesRead3: "La zone orangée du diagramme contient les classes présentes à l'échelle courante, soit celles dont la naissance est d'au plus <i>r</i> et dont la mort dépasse <i>r</i>. Leur nombre en dimension 0 et en dimension 1 donne les nombres de Betti <i>b</i><sub>0</sub> et <i>b</i><sub>1</sub> du complexe affiché. En 3D, leur nombre en dimension 2 donne le nombre de Betti <i>b</i><sub>2</sub>. Le code-barres présente la même information que le diagramme&nbsp;: chaque barre s'étend de la naissance à la mort d'une classe.",
    notesRead4: "L'homologie est calculée à coefficients dans ℤ/2ℤ. En 2D, le complexe s'arrête aux triangles et l'homologie est calculée en dimensions 0 et 1. En 3D, il s'arrête aux tétraèdres et l'homologie est calculée en dimensions 0, 1 et 2.",
    notesCloudData: CLOUD_STRINGS.fr.notesCloudData.replace("placent les points sur des courbes, remplacées en 3D par une sphère, deux sphères concentriques et deux arcs situés dans des plans perpendiculaires.", "placent les points sur des courbes. En 3D, le cercle devient une sphère et les lunes, deux arcs situés dans des plans perpendiculaires. Les cercles concentriques ne sont offerts qu'en 2D, car le nombre de points ne suffit pas à échantillonner deux sphères."),
    notesCloudUpdate: "Le diagramme de persistance, le code-barres et les courbes de Betti sont recalculés après chaque modification du nuage. Lorsque ce calcul est trop long pour suivre le déplacement d'un point, seul le complexe est retracé pendant le déplacement et les autres figures sont mises à jour à la fin.",
  },
  en: {
    docTitle: "Persistence diagram of a point cloud – Guillaume Brouillette",
    title: "Persistence diagram of a point cloud",
    lead: "This applet builds the Vietoris–Rips complex of a point cloud in the plane or in space at an adjustable scale <i>r</i>. The persistence diagram, the barcode and the Betti curves of the cloud are plotted next to it. The number of points is set in the panel and the cloud can be edited directly in the figure.",
    radiusLabel: "Radius <i>r</i>",
    radiusAria: "Radius r",
    capComplex: "Vietoris–Rips complex at scale <i>r</i>",
    capDiagram: "Persistence diagram",
    capBarcode: "Barcode",
    capBetti0: "Betti number <i>b</i><sub>0</sub> against <i>r</i>",
    capBetti1: "Betti number <i>b</i><sub>1</sub> against <i>r</i>",
    capBetti2: "Betti number <i>b</i><sub>2</sub> against <i>r</i>",
    ariaComplex: "Vietoris–Rips complex of the point cloud at the current scale",
    ariaDiagram: "Persistence diagram of the point cloud",
    ariaBarcode: "Barcode of the point cloud",
    ariaBetti0: "Curve of the Betti number b0 against the radius",
    ariaBetti1: "Curve of the Betti number b1 against the radius",
    ariaBetti2: "Curve of the Betti number b2 against the radius",
    legendH0: "H<sub>0</sub>: connected components",
    legendH1: "H<sub>1</sub>: cycles",
    legendH2: "H<sub>2</sub>: cavities",
    legendScale: "current scale",
    axisBirth: "birth",
    axisDeath: "death",
    status2: "Radius <i>r</i> = {r}. The complex has {v}, {e} and {f}. Betti numbers: <i>b</i><sub>0</sub> = {b0} and <i>b</i><sub>1</sub> = {b1}.",
    status3: "Radius <i>r</i> = {r}. The complex has {v}, {e}, {f} and {g}. Betti numbers: <i>b</i><sub>0</sub> = {b0}, <i>b</i><sub>1</sub> = {b1} and <i>b</i><sub>2</sub> = {b2}.",
    vertexOne: "vertex",
    vertexMany: "vertices",
    edgeOne: "edge",
    edgeMany: "edges",
    triangleOne: "triangle",
    triangleMany: "triangles",
    tetraOne: "tetrahedron",
    tetraMany: "tetrahedra",
    fileName: "persistence-diagram",
    notesComplexTitle: "Vietoris–Rips complex",
    notesComplex: "A disc of radius <i>r</i> is centred at each point of the cloud. Two points are joined by an edge when their discs meet, that is, when their distance is at most 2<i>r</i>. Three points span a filled triangle when they are pairwise joined. The complex grows with <i>r</i> and the computation stops at <i>r</i> = 1.",
    notesComplex3d: "In 3D, the discs become balls of radius <i>r</i>, which are not drawn. The edges and the triangles follow the same rule and four points that are pairwise joined span a filled tetrahedron. The triangles are drawn as translucent faces.",
    notesReadTitle: "Reading the diagram",
    notesRead1: "Persistent homology tracks the homology classes of the complex as <i>r</i> increases. Each point (birth, death) of the persistence diagram represents a class. Its first coordinate is the scale at which the class appears and its second coordinate is the scale at which it disappears. Its height above the diagonal is therefore the lifetime of the class: a point far from the diagonal corresponds to a structure present over a wide range of scales and a point close to the diagonal most often corresponds to noise.",
    notesRead2: "The points of H<sub>0</sub> represent connected components. They are all born at <i>r</i> = 0 and one of them dies each time two components merge. The points of H<sub>1</sub> represent cycles that enclose a hole. A cycle is born when an edge closes it and dies when triangles fill it. In 3D, the points of H<sub>2</sub> represent closed surfaces that enclose a cavity. Such a surface is born when a triangle closes it and dies when tetrahedra fill the cavity. Classes still present at <i>r</i> = 1 are placed on the line marked ∞.",
    notesRead3: "The orange region of the diagram contains the classes present at the current scale, namely those born at or before <i>r</i> that die after <i>r</i>. Their numbers in dimension 0 and in dimension 1 are the Betti numbers <i>b</i><sub>0</sub> and <i>b</i><sub>1</sub> of the displayed complex. In 3D, their number in dimension 2 is the Betti number <i>b</i><sub>2</sub>. The barcode shows the same information as the diagram: each bar extends from the birth to the death of a class.",
    notesRead4: "Homology is computed with coefficients in ℤ/2ℤ. In 2D, the complex stops at triangles and homology is computed in dimensions 0 and 1. In 3D, it stops at tetrahedra and homology is computed in dimensions 0, 1 and 2.",
    notesCloudData: CLOUD_STRINGS.en.notesCloudData.replace("place the points on curves, replaced in 3D by a sphere, two concentric spheres and two arcs lying in perpendicular planes.", "place the points on curves. In 3D, the circle becomes a sphere and the moons become two arcs lying in perpendicular planes. The concentric circles are offered in 2D only, since the number of points is too small to sample two spheres."),
    notesCloudUpdate: "The persistence diagram, the barcode and the Betti curves are recomputed after each edit of the cloud. When this computation is too long to follow the dragging of a point, only the complex is redrawn during the drag and the other figures are updated at the end.",
  },
});

// ---------------------------------------------------------------------------
// 2. Persistent homology of the Vietoris–Rips filtration
// ---------------------------------------------------------------------------

const MAX_RADIUS = 1; // largest radius of the slider
const DEFAULT_RADIUS = 0.2;
const RADIUS_STEPS = 1000; // the slider moves by MAX_RADIUS / RADIUS_STEPS

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// Simplices of one dimension in the order of the filtration. Each simplex is
// given by its vertices, in increasing order, and by the rank of its longest
// edge among the edges sorted by length. The simplices are sorted by that
// rank, then by order of creation, with a counting sort. In the result, the
// simplex of rank i has the vertices vertices[size * i], ...,
// vertices[size * i + size - 1] and the filtration value values[i].
function sortedLevel(size, vertices, longest, lengths) {
  const count = longest.length;
  const next = new Uint32Array(lengths.length + 1);
  for (let i = 0; i < count; i++) next[longest[i] + 1]++;
  for (let r = 0; r < lengths.length; r++) next[r + 1] += next[r];
  const level = { size, count, vertices: new Uint8Array(size * count), values: new Float64Array(count) };
  for (let i = 0; i < count; i++) {
    const rank = next[longest[i]]++;
    level.values[rank] = lengths[longest[i]];
    for (let s = 0; s < size; s++) level.vertices[size * rank + s] = vertices[size * i + s];
  }
  return level;
}

// Vietoris–Rips filtration of a point cloud up to the dimension top: 2 stops
// at the triangles and 3 at the tetrahedra. A simplex enters the filtration
// at its diameter, the largest distance between two of its vertices.
// Simplices of diameter greater than maxEdge are left out. The result lists
// the simplices of each dimension in the order of the filtration: levels[d]
// holds those of dimension d (see sortedLevel).
function ripsFiltration(points, maxEdge, top) {
  const n = points.length;
  const dim = points[0].length;

  // Edges sorted by length. rank[i * n + j] is the position of the edge
  // {i, j} in that order, or -1 when the edge is longer than maxEdge.
  const edges = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let s = 0;
      for (let c = 0; c < dim; c++) s += (points[i][c] - points[j][c]) ** 2;
      const length = Math.sqrt(s);
      if (length <= maxEdge) edges.push({ i, j, length });
    }
  }
  edges.sort((a, b) => a.length - b.length);
  const lengths = new Float64Array(edges.length);
  const rank = new Int32Array(n * n).fill(-1);
  const levels = [
    { size: 1, count: n, vertices: Uint8Array.from({ length: n }, (_, i) => i), values: new Float64Array(n) },
    { size: 2, count: edges.length, vertices: new Uint8Array(2 * edges.length), values: lengths },
  ];
  edges.forEach(({ i, j, length }, r) => {
    lengths[r] = length;
    rank[i * n + j] = r;
    rank[j * n + i] = r;
    levels[1].vertices[2 * r] = i;
    levels[1].vertices[2 * r + 1] = j;
  });

  // Triangles and tetrahedra, each with the rank of its longest edge.
  const triangles = { vertices: [], longest: [] };
  const tetrahedra = { vertices: [], longest: [] };
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const rij = rank[i * n + j];
      if (rij < 0) continue;
      for (let k = j + 1; k < n; k++) {
        const rik = rank[i * n + k];
        const rjk = rank[j * n + k];
        if (rik < 0 || rjk < 0) continue;
        const rijk = Math.max(rij, rik, rjk);
        triangles.vertices.push(i, j, k);
        triangles.longest.push(rijk);
        if (top < 3) continue;
        for (let l = k + 1; l < n; l++) {
          const ril = rank[i * n + l];
          const rjl = rank[j * n + l];
          const rkl = rank[k * n + l];
          if (ril < 0 || rjl < 0 || rkl < 0) continue;
          tetrahedra.vertices.push(i, j, k, l);
          tetrahedra.longest.push(Math.max(rijk, ril, rjl, rkl));
        }
      }
    }
  }
  levels.push(sortedLevel(3, triangles.vertices, triangles.longest, lengths));
  if (top >= 3) levels.push(sortedLevel(4, tetrahedra.vertices, tetrahedra.longest, lengths));
  return levels;
}

// Number of simplices of a level whose filtration value is at most limit.
function countUpTo(level, limit) {
  let lo = 0;
  let hi = level.count;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (level.values[mid] <= limit) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Coboundary matrix over Z/2 between two consecutive dimensions. Column i
// lists, in increasing order, the ranks of the simplices of the level cofaces
// that have the simplex of rank i of the level faces as a face.
function coboundaryColumns(faces, cofaces, n) {
  // A simplex with the vertices v0 < v1 < ... gets the key (v0 n + v1) n + ...
  const rankOf = new Int32Array(Math.pow(n, faces.size));
  for (let i = 0; i < faces.count; i++) {
    let key = 0;
    for (let s = 0; s < faces.size; s++) key = key * n + faces.vertices[faces.size * i + s];
    rankOf[key] = i;
  }

  const columns = Array.from({ length: faces.count }, () => []);
  const size = cofaces.size;
  for (let r = 0; r < cofaces.count; r++) {
    for (let omitted = 0; omitted < size; omitted++) {
      let key = 0;
      for (let s = 0; s < size; s++) {
        if (s !== omitted) key = key * n + cofaces.vertices[size * r + s];
      }
      columns[rankOf[key]].push(r);
    }
  }
  return columns;
}

// Sum of two columns over Z/2: symmetric difference of two increasing lists.
function addColumns(a, b) {
  const sum = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; }
    else if (a[i] < b[j]) sum.push(a[i++]);
    else sum.push(b[j++]);
  }
  while (i < a.length) sum.push(a[i++]);
  while (j < b.length) sum.push(b[j++]);
  return sum;
}

// Persistence pairs between the simplices of two consecutive dimensions, by
// reduction of the coboundary matrix (persistent cohomology, which gives the
// same intervals as homology). Columns are processed from the last simplex of
// the filtration to the first. While the first entry of the current column,
// its earliest coface, is also the first entry of a column reduced before,
// that column is added to it. A simplex whose reduced column starts at the
// coface c creates a class that dies when c enters. A simplex whose reduced
// column is zero creates a class that never dies. The simplices flagged in
// paired kill a class of the dimension below: they create none and their
// columns are skipped. This order of work never reduces the columns of the
// simplices of the top dimension, which are by far the most numerous.
// Calls found(birth, death) for each class and returns owner, where
// owner[c] is the rank of the simplex whose class the coface c kills, or -1.
function reduceCoboundary(faces, cofaces, n, paired, found) {
  const columns = coboundaryColumns(faces, cofaces, n);
  const owner = new Int32Array(cofaces.count).fill(-1);
  for (let j = faces.count - 1; j >= 0; j--) {
    if (paired && paired[j] >= 0) continue;
    let column = columns[j];
    while (column.length > 0) {
      const other = owner[column[0]];
      if (other < 0) break;
      column = addColumns(column, columns[other]);
    }
    columns[j] = column;
    if (column.length > 0) {
      owner[column[0]] = j;
      found(faces.values[j], cofaces.values[column[0]]);
    } else {
      found(faces.values[j], Infinity);
    }
  }
  return owner;
}

// Persistence intervals of a point cloud in the dimensions 0 to top - 1, in
// units of the filtration (distance between points). Intervals of length zero
// are dropped. The result is sorted like the output of GUDHI: by decreasing
// dimension, then by decreasing length. topOwner tells which simplices of the
// top dimension kill a class (see reduceCoboundary).
function ripsPersistence(points, maxEdge, top) {
  const levels = ripsFiltration(points, maxEdge, top);
  const intervals = [];
  let owner = null;
  for (let d = 0; d < top; d++) {
    owner = reduceCoboundary(levels[d], levels[d + 1], points.length, owner, (birth, death) => {
      if (death > birth) intervals.push({ dim: d, birth, death });
    });
  }

  intervals.sort((a, b) => {
    if (a.dim !== b.dim) return b.dim - a.dim;
    const la = a.death - a.birth;
    const lb = b.death - b.birth;
    return la > lb ? -1 : la < lb ? 1 : 0;
  });
  return { levels, intervals, topOwner: owner };
}

// Betti number in a given dimension at filtration value t: number of
// intervals [birth, death) that contain t.
function bettiNumber(intervals, dim, t) {
  let count = 0;
  for (const interval of intervals) {
    if (interval.dim === dim && interval.birth <= t && t < interval.death) count++;
  }
  return count;
}

// Everything that depends only on the point cloud. A cloud of the plane gives
// a complex of dimension 2 and a cloud of space a complex of dimension 3.
// Intervals are converted from distances to radii: an edge of length d enters
// at r = d/2.
function buildModel(points) {
  const top = points[0].length;
  const { levels, intervals, topOwner } = ripsPersistence(points, 2 * MAX_RADIUS, top);
  const inRadius = intervals.map(({ dim, birth, death }) => ({ dim, birth: birth / 2, death: death / 2 }));

  // Betti curves at the values of the slider.
  const betti = [];
  for (let dim = 0; dim < top; dim++) {
    betti.push(Array.from({ length: RADIUS_STEPS + 1 }, (_, i) =>
      bettiNumber(inRadius, dim, (i * MAX_RADIUS) / RADIUS_STEPS)));
  }
  return { levels, intervals: inRadius, betti, topOwner };
}

// ---------------------------------------------------------------------------
// 3. 2D drawing
// ---------------------------------------------------------------------------

const COLOURS = {
  // First three colours of the Set1 palette, for H0, H1 and H2.
  h: ["rgb(228, 26, 28)", "rgb(55, 126, 184)", "rgb(77, 175, 74)"],
  scale: "rgb(255, 165, 0)",
  scaleFill: "rgba(255, 165, 0, 0.12)",
  ballFill: "rgba(0, 0, 255, 0.04)",
  ballStroke: "rgba(0, 0, 255, 0.2)",
  triangle: "rgba(255, 140, 0, 0.51)",
  edge: "rgb(165, 42, 42)",
  point: "#000",
  axis: "#8e8c84",
  guide: "#c9c5bb",
  text: "#3e3f3a",
};

const FONT_SIZE = 12;
const VIEW_HALF = 1.08; // the figure of the complex shows [-1.08, 1.08]^2
let fontFamily = "sans-serif";
const font = (italic = false) => `${italic ? "italic " : ""}${FONT_SIZE}px ${fontFamily}`;

// Sizes the bitmap of a canvas to its displayed size and returns a context
// whose unit is the CSS pixel. The height is set first when it is given.
function prepareCanvas(canvas, height = null) {
  const dpr = window.devicePixelRatio || 1;
  if (height !== null) canvas.style.height = `${height}px`;
  const w = Math.max(1, canvas.clientWidth);
  const h = Math.max(1, canvas.clientHeight);
  const bw = Math.max(1, Math.round(w * dpr));
  const bh = Math.max(1, Math.round(h * dpr));
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(bw / w, 0, 0, bh / h, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

// Affine maps from data coordinates to the rectangle rect of the canvas.
function makeScales(rect, xRange, yRange) {
  return {
    X: (x) => rect.x + ((x - xRange[0]) / (xRange[1] - xRange[0])) * rect.w,
    Y: (y) => rect.y + rect.h - ((y - yRange[0]) / (yRange[1] - yRange[0])) * rect.h,
  };
}

// Tick step among 1, 2 and 5 times a power of ten giving at most maxTicks intervals.
function niceStep(span, maxTicks) {
  const raw = span / Math.max(1, maxTicks);
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / power;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * power;
}

// Multiples of step inside [min, max], with their labels.
function makeTicks(min, max, step) {
  const digits = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  const ticks = [];
  for (let i = Math.ceil(min / step - 1e-9); i * step <= max + 1e-9; i++) {
    ticks.push({ value: i * step, label: formatNumber(i * step, digits) });
  }
  return ticks;
}

// Left and bottom axes of a plot, with ticks and optional axis labels.
function drawAxes(ctx, rect, scales, options) {
  const { xTicks = [], yTicks = [], xLabel, yLabel, yLabelOffset = 30, italicLabels = false } = options;
  const bottom = rect.y + rect.h;
  ctx.save();
  ctx.strokeStyle = COLOURS.axis;
  ctx.fillStyle = COLOURS.text;
  ctx.lineWidth = 1;
  ctx.font = font();

  ctx.beginPath();
  ctx.moveTo(rect.x + 0.5, rect.y);
  ctx.lineTo(rect.x + 0.5, bottom + 0.5);
  ctx.lineTo(rect.x + rect.w, bottom + 0.5);
  for (const tick of xTicks) {
    const x = Math.round(scales.X(tick.value)) + 0.5;
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, bottom + 4);
  }
  for (const tick of yTicks) {
    const y = Math.round(scales.Y(tick.value)) + 0.5;
    ctx.moveTo(rect.x, y);
    ctx.lineTo(rect.x - 4, y);
  }
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const tick of xTicks) ctx.fillText(tick.label, scales.X(tick.value), bottom + 6);
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const tick of yTicks) ctx.fillText(tick.label, rect.x - 7, scales.Y(tick.value));

  ctx.font = font(italicLabels);
  if (xLabel) {
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(xLabel, rect.x + rect.w / 2, bottom + 22);
  }
  if (yLabel) {
    ctx.save();
    ctx.translate(rect.x - yLabelOffset, rect.y + rect.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

// Vertical line marking the current radius.
function drawRadiusLine(ctx, rect, x) {
  ctx.save();
  ctx.strokeStyle = COLOURS.scale;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, rect.y);
  ctx.lineTo(x, rect.y + rect.h);
  ctx.stroke();
  ctx.restore();
}

// Maps between data coordinates and the largest square that fits in a canvas
// of size w by h, with margins for the axes. The same view as in the other
// point-cloud applettes.
function makeView(w, h) {
  const side = Math.max(1, Math.min(w - 50, h - 34));
  const rect = { x: 42 + (w - 50 - side) / 2, y: 8 + (h - 34 - side) / 2, w: side, h: side };
  const unit = side / (2 * VIEW_HALF);
  const scales = makeScales(rect, [-VIEW_HALF, VIEW_HALF], [-VIEW_HALF, VIEW_HALF]);
  return {
    rect,
    unit,
    X: scales.X,
    Y: scales.Y,
    dataX: (px) => (px - rect.x) / unit - VIEW_HALF,
    dataY: (py) => VIEW_HALF - (py - rect.y) / unit,
  };
}

// Point cloud of the plane, discs of radius r and Vietoris–Rips complex at
// radius r: the simplices of the levels whose diameter is at most 2r.
// Returns the view, used to convert pointer positions.
function drawComplex2D(canvas, points, levels, radius) {
  const { ctx, w, h } = prepareCanvas(canvas);
  const view = makeView(w, h);
  const { rect, X, Y, unit } = view;

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  if (radius > 0) {
    ctx.fillStyle = COLOURS.ballFill;
    ctx.strokeStyle = COLOURS.ballStroke;
    ctx.lineWidth = 1;
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(X(p[0]), Y(p[1]), radius * unit, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }

  const [, edges, triangles] = levels;
  ctx.fillStyle = COLOURS.triangle;
  for (let i = 0, end = countUpTo(triangles, 2 * radius); i < end; i++) {
    const a = points[triangles.vertices[3 * i]];
    const b = points[triangles.vertices[3 * i + 1]];
    const c = points[triangles.vertices[3 * i + 2]];
    ctx.beginPath();
    ctx.moveTo(X(a[0]), Y(a[1]));
    ctx.lineTo(X(b[0]), Y(b[1]));
    ctx.lineTo(X(c[0]), Y(c[1]));
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = COLOURS.edge;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0, end = countUpTo(edges, 2 * radius); i < end; i++) {
    const a = points[edges.vertices[2 * i]];
    const b = points[edges.vertices[2 * i + 1]];
    ctx.moveTo(X(a[0]), Y(a[1]));
    ctx.lineTo(X(b[0]), Y(b[1]));
  }
  ctx.stroke();

  ctx.fillStyle = COLOURS.point;
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(X(p[0]), Y(p[1]), 4, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.restore();

  const ticks = makeTicks(-1, 1, 0.5);
  drawAxes(ctx, rect, view, { xTicks: ticks, yTicks: ticks });
  return view;
}

// Persistence diagram in units of the radius. Classes that never die are
// placed on a dashed line above the plot. The region birth <= r < death,
// which contains the classes alive at the current radius, is shaded.
function drawDiagram(canvas, model, radius, height, t) {
  const { ctx, w, h } = prepareCanvas(canvas, height);
  const infinityGap = 24; // room between the value MAX_RADIUS and the line of infinite classes
  const left = 50;
  const top = 14;
  const side = Math.max(60, Math.min(w - left - 14, h - top - 42));
  const size = side - infinityGap; // length of the axes from 0 to MAX_RADIUS
  const x0 = Math.max(left, (w - size) / 2 + 10);
  const rect = { x: x0, y: top + infinityGap, w: size, h: size };
  const scales = makeScales(rect, [0, MAX_RADIUS], [0, MAX_RADIUS]);
  const { X, Y } = scales;
  const yInfinity = top;

  // Classes alive at the current radius.
  ctx.fillStyle = COLOURS.scaleFill;
  ctx.fillRect(X(0), yInfinity - 8, X(radius) - X(0), Y(radius) - yInfinity + 8);

  // Diagonal and line of the classes that never die.
  ctx.strokeStyle = COLOURS.guide;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X(0), Y(0));
  ctx.lineTo(X(MAX_RADIUS), Y(MAX_RADIUS));
  ctx.stroke();
  ctx.save();
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(X(0), yInfinity + 0.5);
  ctx.lineTo(X(MAX_RADIUS), yInfinity + 0.5);
  ctx.stroke();
  ctx.restore();

  // Boundary of the shaded region: birth = r and death = r.
  ctx.strokeStyle = COLOURS.scale;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(X(0), Y(radius));
  ctx.lineTo(X(radius), Y(radius));
  ctx.lineTo(X(radius), yInfinity - 8);
  ctx.stroke();

  const ticks = makeTicks(0, MAX_RADIUS, 0.2);
  drawAxes(ctx, { x: rect.x, y: yInfinity - 8, w: rect.w, h: rect.h + infinityGap + 8 }, scales, {
    xTicks: ticks,
    yTicks: ticks,
    xLabel: t("axisBirth"),
    yLabel: t("axisDeath"),
  });
  ctx.fillStyle = COLOURS.text;
  ctx.font = `${FONT_SIZE + 2}px ${fontFamily}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("∞", rect.x - 7, yInfinity);

  // One point per class, coloured by dimension.
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#fff";
  for (const interval of model.intervals) {
    ctx.fillStyle = COLOURS.h[interval.dim];
    ctx.beginPath();
    ctx.arc(X(interval.birth), Number.isFinite(interval.death) ? Y(interval.death) : yInfinity, 4.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }
}

// Barcode in units of the radius: one bar per class, from birth to death.
// Bars of the classes that never die stop at the largest radius. The bars get
// thinner when there are many of them, so that they stay apart.
function drawBarcode(canvas, model, radius, height) {
  const { ctx, w, h } = prepareCanvas(canvas, height);
  const rect = { x: 14, y: 8, w: w - 28, h: h - 48 };
  const scales = makeScales(rect, [0, MAX_RADIUS], [0, 1]);
  const { X } = scales;

  const rows = model.intervals.length;
  ctx.lineWidth = clamp((0.6 * rect.h) / Math.max(1, rows), 1, 3);
  model.intervals.forEach((interval, row) => {
    const y = rect.y + rect.h - ((row + 0.5) * rect.h) / rows;
    ctx.strokeStyle = COLOURS.h[interval.dim];
    ctx.beginPath();
    ctx.moveTo(X(interval.birth), y);
    ctx.lineTo(X(Math.min(interval.death, MAX_RADIUS)), y);
    ctx.stroke();
  });

  drawRadiusLine(ctx, rect, X(radius));
  drawAxes(ctx, rect, scales, {
    xTicks: makeTicks(0, MAX_RADIUS, 0.2),
    xLabel: "r",
    italicLabels: true,
  });
}

// Betti curve: step function r -> b(r), sampled at the values of the slider.
function drawBettiCurve(canvas, values, radius, height, colour, label) {
  const { ctx, w, h } = prepareCanvas(canvas, height);
  const rect = { x: 46, y: 8, w: w - 60, h: h - 48 };
  const top = Math.max(...values) + 1;
  const scales = makeScales(rect, [0, MAX_RADIUS], [0, top]);
  const { X, Y } = scales;

  const step = MAX_RADIUS / (values.length - 1);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(X(0), Y(values[0]));
  values.forEach((value, i) => {
    ctx.lineTo(X(i * step), Y(value));
    if (i < values.length - 1) ctx.lineTo(X((i + 1) * step), Y(value));
  });
  ctx.stroke();

  drawRadiusLine(ctx, rect, X(radius));
  const yStep = Math.max(1, niceStep(top, rect.h / 28));
  drawAxes(ctx, rect, scales, {
    xTicks: makeTicks(0, MAX_RADIUS, 0.2),
    yTicks: makeTicks(0, top, yStep),
    xLabel: "r",
    yLabel: label,
    yLabelOffset: 26,
    italicLabels: true,
  });
}

// ---------------------------------------------------------------------------
// 4. 3D drawing
// ---------------------------------------------------------------------------

// Point cloud of space and Vietoris–Rips complex at radius r, with the
// colours of the 2D figure. The triangles are translucent and the balls of
// radius r are not drawn.
function drawComplex3D(view3d, points, levels, radius) {
  const [, edges, triangles] = levels;
  const segments = [];
  for (let i = 0, end = countUpTo(edges, 2 * radius); i < end; i++) {
    segments.push([points[edges.vertices[2 * i]], points[edges.vertices[2 * i + 1]]]);
  }
  const faces = [];
  for (let i = 0, end = countUpTo(triangles, 2 * radius); i < end; i++) {
    faces.push([
      points[triangles.vertices[3 * i]],
      points[triangles.vertices[3 * i + 1]],
      points[triangles.vertices[3 * i + 2]],
    ]);
  }
  view3d.clear();
  view3d.addTriangles(faces, 0xff8c00, 0.18);
  view3d.addSegments(segments, 0xa52a2a);
  view3d.addPoints(points, 0.03, 0x000000);
}

// ---------------------------------------------------------------------------
// 5. Page wiring
// ---------------------------------------------------------------------------

const t = Applet.localize(STRINGS);
fontFamily = getComputedStyle(document.body).fontFamily || fontFamily;

const panel = document.getElementById("panel");
const figure = document.getElementById("figure-complex");
const holder3d = document.getElementById("view3d");
const legendH2 = document.getElementById("legend-h2");
const status = document.getElementById("status");
const hint = document.getElementById("hint");
const canvases = {
  complex: document.getElementById("canvas-complex"),
  diagram: document.getElementById("canvas-diagram"),
  barcode: document.getElementById("canvas-barcode"),
  betti: [0, 1, 2].map((dim) => document.getElementById(`canvas-betti${dim}`)),
};
canvases.complex.setAttribute("aria-label", t("ariaComplex"));
canvases.diagram.setAttribute("aria-label", t("ariaDiagram"));
canvases.barcode.setAttribute("aria-label", t("ariaBarcode"));
canvases.betti.forEach((canvas, dim) => canvas.setAttribute("aria-label", t(`ariaBetti${dim}`)));

// A drag follows the pointer with a full computation only when the last one
// took less than this many milliseconds.
let liveLimit = 40;

let model = null; // persistence of the cloud
let stale = true; // the cloud changed since the model was computed
let dragging = false; // a point is being dragged
let lastMs = 0; // duration of the last full computation
let view2d = null;
let view3d = null; // created at the first use of the 3D mode

const cloud = new CloudData(panel, t, {
  defaults: { dim: 2, dataset: "circle", seed: 42, n: 20, noise: 0.1 },
  n: { min: 4, max: 60, max3d: 40 },
  // Two spheres cannot be recognised with so few points.
  hide3d: ["circles"],
  onChange: () => onEdit(false),
});
const radiusField = numberField(panel, {
  id: "radius-input", label: t("radiusLabel"), aria: t("radiusAria"),
  min: 0, max: MAX_RADIUS, step: MAX_RADIUS / RADIUS_STEPS, digits: 3, value: DEFAULT_RADIUS,
  onChange: requestDraw,
});
actionButtons(panel, t, {
  onReset() {
    radiusField.set(DEFAULT_RADIUS);
    if (view3d) view3d.resetCamera();
    cloud.reset();
  },
  // One image of the figures shown: the complex, the diagram, the barcode
  // and the Betti curves.
  onDownload() {
    const is3d = cloud.dim === 3;
    const complex = is3d ? view3d.snapshot() : canvases.complex;
    const curves = canvases.betti.slice(0, cloud.dim);
    saveCanvasesPNG([complex, canvases.diagram, canvases.barcode, ...curves], `${t("fileName")}-${cloud.dim}d.png`);
  },
});

// Called after every change of the cloud. isDragging is true while a point is
// being dragged.
function onEdit(isDragging) {
  stale = true;
  dragging = isDragging;
  requestDraw();
}

const count = (n, one, many) => {
  const plural = Applet.lang === "fr" ? n >= 2 : n !== 1;
  return `${n} ${t(plural ? many : one)}`;
};

function updateStatus(radius) {
  const present = model.levels.map((level) => countUpTo(level, 2 * radius));
  const values = {
    r: Applet.fmt(radius, 3),
    v: count(present[0], "vertexOne", "vertexMany"),
    e: count(present[1], "edgeOne", "edgeMany"),
    f: count(present[2], "triangleOne", "triangleMany"),
    g: count(present[3] || 0, "tetraOne", "tetraMany"),
    b0: bettiNumber(model.intervals, 0, radius),
    b1: bettiNumber(model.intervals, 1, radius),
    b2: bettiNumber(model.intervals, 2, radius),
  };
  status.innerHTML = t(`status${cloud.dim}`).replace(/\{(\w+)\}/g, (_, name) => values[name]);
}

// The barcode and the Betti curves share a row: three plots in 2D and four
// in 3D, where the curve of b2 is added.
function arrangePlots(is3d) {
  canvases.barcode.closest("figure").className = is3d ? "col-12 col-xl-3 mb-0" : "col-12 col-xl-4 mb-0";
  canvases.betti.forEach((canvas, dim) => {
    const frame = canvas.closest("figure");
    frame.className = is3d ? "col-sm-4 col-xl-3 mb-0" : "col-sm-6 col-xl-4 mb-0";
    frame.hidden = dim >= cloud.dim;
  });
  legendH2.hidden = !is3d;
}

function draw() {
  const is3d = cloud.dim === 3;
  const radius = radiusField.value;

  // During a drag that the computation cannot follow, only the complex at the
  // current radius is rebuilt. The other figures wait for the end of the drag.
  if (stale && !(dragging && lastMs >= liveLimit)) {
    const start = performance.now();
    model = buildModel(cloud.points);
    lastMs = performance.now() - start;
    stale = false;
  }
  const levels = stale ? ripsFiltration(cloud.points, 2 * radius, 2) : model.levels;

  arrangePlots(is3d);
  canvases.complex.hidden = is3d;
  holder3d.hidden = !is3d;
  if (is3d) {
    if (!view3d) {
      view3d = new CloudView3D(holder3d);
      attachEdit3D(view3d.dom, view3d.camera, view3d.controls, { cloud, query: null, onEdit });
    }
    view3d.active = true;
    view3d.resize();
    drawComplex3D(view3d, cloud.points, levels, radius);
  } else {
    if (view3d) view3d.active = false;
    view2d = drawComplex2D(canvases.complex, cloud.points, levels, radius);
  }
  hint.textContent = editHint(t, cloud.dim);
  if (stale) return;

  // The diagram is as tall as the figure of the complex beside it.
  const tall = Math.max(240, figure.clientHeight);
  const short = 200;
  drawDiagram(canvases.diagram, model, radius, tall, t);
  drawBarcode(canvases.barcode, model, radius, short);
  model.betti.forEach((values, dim) => {
    drawBettiCurve(canvases.betti[dim], values, radius, short, COLOURS.h[dim], `b${"₀₁₂"[dim]}`);
  });
  updateStatus(radius);
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

attachEdit2D(canvases.complex, {
  toPixel: (p) => [view2d.X(p[0]), view2d.Y(p[1])],
  toData: (x, y) => [view2d.dataX(x), view2d.dataY(y)],
  cloud,
  query: null,
  onEdit,
});

// The layout is observed rather than the stage, which has no box of its own
// on narrow screens.
window.addEventListener("resize", requestDraw);
if ("ResizeObserver" in window) {
  let lastWidth = 0;
  new ResizeObserver((entries) => {
    const width = entries[0].contentRect.width;
    if (Math.abs(width - lastWidth) > 0.5) {
      lastWidth = width;
      requestDraw();
    }
  }).observe(document.querySelector(".applet-layout"));
}

draw();

// Handle for inspection from the console.
window.persistenceApplet = {
  cloud,
  radiusField,
  draw,
  ripsPersistence,
  get model() { return model; },
  get view3d() { return view3d; },
  get stale() { return stale; },
  get lastMs() { return lastMs; },
  get liveLimit() { return liveLimit; },
  set liveLimit(ms) { liveLimit = ms; },
};
