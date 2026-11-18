// Shared code of the point-cloud applettes: nearest neighbours, persistence
// and neighbour selection. The three pages build the same controls from this
// module and follow the same gestures, in 2D and in 3D.
//
// Conventions shared by the three applettes
//   - The points live in the square [-1, 1]^2 or in the cube [-1, 1]^3.
//   - The panel lists, in this order: dimension, dataset and seed, parameters
//     of the dataset, number of points, then the controls of the applette.
//   - A control is shown only when it applies to the current choice.
//   - Dragging a point moves it, a click on empty space adds a point, and a
//     double-click or a right-click on a point removes it. In 3D, dragging on
//     empty space rotates the view.
//
// Sections: 1. strings, 2. random numbers and datasets, 3. distances,
// 4. controls, 5. cloud and query point, 6. gestures, 7. 3D view, 8. images.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export { THREE };

// ---------------------------------------------------------------------------
// 1. Strings
// ---------------------------------------------------------------------------

export const CLOUD_STRINGS = {
  fr: {
    dimLabel: "Dimension",
    dim2: "2D",
    dim3: "3D",
    datasetLabel: "Jeu de données",
    dsUniform: "Uniforme",
    dsNormal: "Normale",
    dsClusters: "Amas",
    dsCircle: "Cercle",
    dsSphere: "Sphère",
    dsCircles: "Cercles concentriques",
    dsSpheres: "Sphères concentriques",
    dsMoons: "Lunes",
    seedLabel: "Germe",
    seedTitle: "Germe du générateur aléatoire. Une autre valeur donne un autre échantillon.",
    sigmaLabel: "Écart-type σ",
    clustersLabel: "Nombre d'amas",
    noiseLabel: "Bruit",
    nLabel: "Nombre de points <i>n</i>",
    nAria: "Nombre de points n",
    metricLabel: "Distance",
    mEuclidean: "Euclidienne",
    mManhattan: "Manhattan",
    mChebyshev: "Tchebychev",
    mCosine: "Cosinus",
    queryLabel: "Point requête",
    resetLabel: "Réinitialiser",
    downloadLabel: "Télécharger l'image (PNG)",
    hintMouse2d: "Glisser un point pour le déplacer. Un clic dans la figure ajoute un point. Un double-clic ou un clic du bouton droit sur un point le retire.",
    hintMouse3d: "Glisser un point pour le déplacer et glisser ailleurs pour tourner la vue. Un clic dans la figure ajoute un point. Un double-clic ou un clic du bouton droit sur un point le retire.",
    hintTouch2d: "Glisser un point pour le déplacer. Un toucher dans la figure ajoute un point. Deux touchers de suite sur un point le retirent.",
    hintTouch3d: "Glisser un point pour le déplacer et glisser ailleurs pour tourner la vue. Un toucher dans la figure ajoute un point. Deux touchers de suite sur un point le retirent.",
    notesCloudTitle: "Nuage de points",
    notesCloudData: "Les points sont tirés dans le carré [−1,&nbsp;1]² en 2D et dans le cube [−1,&nbsp;1]³ en 3D. Le jeu de données « Uniforme » remplit ce domaine, « Normale » suit une loi normale centrée à l'origine d'écart-type σ et « Amas » réunit des amas gaussiens dont les centres sont tirés au hasard. Les jeux « Cercle », « Cercles concentriques » et « Lunes » placent les points sur des courbes, remplacées en 3D par une sphère, deux sphères concentriques et deux arcs situés dans des plans perpendiculaires. Le paramètre de bruit règle la dispersion des amas et l'écart des points à ces courbes. Le germe détermine l'échantillon tiré&nbsp;: les mêmes réglages donnent toujours le même nuage.",
    notesCloudEdit: "Le nuage se modifie directement dans la figure. Glisser un point le déplace, un clic dans la figure ajoute un point et un double-clic ou un clic du bouton droit sur un point le retire. En 3D, un point se déplace dans le plan qui fait face à l'observateur et un point ajouté est placé dans le plan parallèle qui passe par l'origine. Pour un cercle ou une sphère sans bruit, les points déplacés ou ajoutés restent sur le cercle ou sur la sphère. Un changement de jeu de données, de germe, de paramètre ou de nombre de points tire un nouveau nuage et efface ces modifications.",
  },
  en: {
    dimLabel: "Dimension",
    dim2: "2D",
    dim3: "3D",
    datasetLabel: "Dataset",
    dsUniform: "Uniform",
    dsNormal: "Normal",
    dsClusters: "Clusters",
    dsCircle: "Circle",
    dsSphere: "Sphere",
    dsCircles: "Concentric circles",
    dsSpheres: "Concentric spheres",
    dsMoons: "Moons",
    seedLabel: "Seed",
    seedTitle: "Seed of the random generator. Another value gives another sample.",
    sigmaLabel: "Standard deviation σ",
    clustersLabel: "Number of clusters",
    noiseLabel: "Noise",
    nLabel: "Number of points <i>n</i>",
    nAria: "Number of points n",
    metricLabel: "Distance",
    mEuclidean: "Euclidean",
    mManhattan: "Manhattan",
    mChebyshev: "Chebyshev",
    mCosine: "Cosine",
    queryLabel: "Query point",
    resetLabel: "Reset",
    downloadLabel: "Download the image (PNG)",
    hintMouse2d: "Drag a point to move it. A click in the figure adds a point. A double-click or a right-click on a point removes it.",
    hintMouse3d: "Drag a point to move it and drag elsewhere to rotate the view. A click in the figure adds a point. A double-click or a right-click on a point removes it.",
    hintTouch2d: "Drag a point to move it. A tap in the figure adds a point. Two taps in a row on a point remove it.",
    hintTouch3d: "Drag a point to move it and drag elsewhere to rotate the view. A tap in the figure adds a point. Two taps in a row on a point remove it.",
    notesCloudTitle: "Point cloud",
    notesCloudData: "The points are drawn in the square [−1,&nbsp;1]² in 2D and in the cube [−1,&nbsp;1]³ in 3D. The dataset \"Uniform\" fills this domain, \"Normal\" follows a normal distribution centred at the origin with standard deviation σ and \"Clusters\" gathers Gaussian clusters whose centres are drawn at random. The datasets \"Circle\", \"Concentric circles\" and \"Moons\" place the points on curves, replaced in 3D by a sphere, two concentric spheres and two arcs lying in perpendicular planes. The noise parameter sets the spread of the clusters and the deviation of the points from these curves. The seed determines the sample drawn: the same settings always give the same cloud.",
    notesCloudEdit: "The cloud can be edited directly in the figure. Dragging a point moves it, a click in the figure adds a point and a double-click or a right-click on a point removes it. In 3D, a point moves in the plane that faces the viewer and an added point is placed in the parallel plane through the origin. For a circle or a sphere without noise, the points moved or added stay on the circle or on the sphere. A change of dataset, seed, parameter or number of points draws a new cloud and discards these edits.",
  },
};

// Strings of an applette on top of the shared ones.
export function withCloudStrings(strings) {
  return {
    fr: Object.assign({}, CLOUD_STRINGS.fr, strings.fr),
    en: Object.assign({}, CLOUD_STRINGS.en, strings.en),
  };
}

// Line of help under the figure, for the pointer and the dimension in use.
export function editHint(t, dim) {
  const touch = window.matchMedia("(pointer: coarse)").matches;
  return t(`hint${touch ? "Touch" : "Mouse"}${dim}d`);
}

// ---------------------------------------------------------------------------
// 2. Random numbers and datasets
// ---------------------------------------------------------------------------

// Seeded generator (mulberry32) with uniform and normal deviates.
export function makeRng(seed) {
  let state = seed >>> 0;

  // Uniform deviate in [0, 1).
  function uniform() {
    state = (state + 0x6d2b79f5) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }

  // Standard normal deviate (Box–Muller transform).
  function normal() {
    const u = 1 - uniform();
    const v = uniform();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  return { uniform, normal };
}

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

export const SHAPE_RADIUS = 0.8; // radius of the circle and of the sphere
const NOISE_SCALE = 0.25; // standard deviation of the noise when the parameter is 1

// Parameters used by each dataset. The panel shows only these.
export const DATASET_PARAMS = {
  uniform: [],
  normal: ["sigma"],
  clusters: ["clusters", "noise"],
  circle: ["noise"],
  circles: ["noise"],
  moons: ["noise"],
};
export const DATASET_IDS = Object.keys(DATASET_PARAMS);

// Vector of independent standard normal coordinates.
function gaussian(dim, rng) {
  const v = [];
  for (let i = 0; i < dim; i++) v.push(rng.normal());
  return v;
}

// Uniform direction on the unit circle (dim 2) or on the unit sphere (dim 3).
function direction(dim, rng) {
  for (;;) {
    const v = gaussian(dim, rng);
    const length = Math.hypot(...v);
    if (length > 1e-9) return v.map((x) => x / length);
  }
}

const GENERATORS = {
  uniform(dim, n, rng) {
    const points = [];
    for (let i = 0; i < n; i++) {
      const p = [];
      for (let c = 0; c < dim; c++) p.push(2 * rng.uniform() - 1);
      points.push(p);
    }
    return points;
  },

  normal(dim, n, rng, params) {
    const points = [];
    for (let i = 0; i < n; i++) points.push(gaussian(dim, rng).map((x) => params.sigma * x));
    return points;
  },

  // Gaussian clusters of standard deviation 0.03 + 0.25 noise. The points are
  // shared as evenly as possible between the clusters.
  clusters(dim, n, rng, params) {
    const count = Math.max(1, Math.min(params.clusters, n));
    const std = 0.03 + NOISE_SCALE * params.noise;
    const centres = [];
    for (let c = 0; c < count; c++) {
      const centre = [];
      for (let i = 0; i < dim; i++) centre.push(0.7 * (2 * rng.uniform() - 1));
      centres.push(centre);
    }
    const points = [];
    centres.forEach((centre, c) => {
      const size = Math.floor(n / count) + (c < n % count ? 1 : 0);
      for (let i = 0; i < size; i++) {
        const g = gaussian(dim, rng);
        points.push(centre.map((x, j) => x + std * g[j]));
      }
    });
    return points;
  },

  // Uniform points on the circle or on the sphere of radius SHAPE_RADIUS.
  circle(dim, n, rng) {
    const points = [];
    for (let i = 0; i < n; i++) points.push(direction(dim, rng).map((x) => SHAPE_RADIUS * x));
    return points;
  },

  // Half of the points on the radius SHAPE_RADIUS and half on its half.
  circles(dim, n, rng) {
    const outer = Math.ceil(n / 2);
    const points = [];
    for (let i = 0; i < n; i++) {
      const radius = i < outer ? SHAPE_RADIUS : SHAPE_RADIUS / 2;
      points.push(direction(dim, rng).map((x) => radius * x));
    }
    return points;
  },

  // Two interleaved half circles. In 3D the second one lies in the plane
  // perpendicular to the first.
  moons(dim, n, rng) {
    const first = Math.ceil(n / 2);
    const scale = 0.55;
    const points = [];
    for (let i = 0; i < n; i++) {
      const angle = Math.PI * rng.uniform();
      let p;
      if (i < first) p = [Math.cos(angle) - 0.5, Math.sin(angle) - 0.25, 0];
      else if (dim === 2) p = [0.5 - Math.cos(angle), 0.25 - Math.sin(angle), 0];
      else p = [0.5 - Math.cos(angle), 0.25, 0.5 - Math.sin(angle)];
      points.push(p.slice(0, dim).map((x) => scale * x));
    }
    return points;
  },
};

// Dataset of n points of dimension dim, inside [-1, 1]^dim.
// params = { sigma, clusters, noise }.
export function generateDataset(id, dim, n, seed, params) {
  const rng = makeRng(seed);
  let points = GENERATORS[id](dim, n, rng, params);
  const usesNoise = DATASET_PARAMS[id].includes("noise") && id !== "clusters";
  if (usesNoise && params.noise > 0) {
    const std = NOISE_SCALE * params.noise;
    points = points.map((p) => {
      const g = gaussian(dim, rng);
      return p.map((x, i) => x + std * g[i]);
    });
  }
  return points.map((p) => p.map((x) => clamp(x, -1, 1)));
}

// ---------------------------------------------------------------------------
// 3. Distances
// ---------------------------------------------------------------------------

export const METRIC_IDS = ["euclidean", "manhattan", "chebyshev", "cosine"];

export const DISTANCES = {
  euclidean(p, q) {
    let s = 0;
    for (let i = 0; i < p.length; i++) s += (p[i] - q[i]) ** 2;
    return Math.sqrt(s);
  },
  manhattan(p, q) {
    let s = 0;
    for (let i = 0; i < p.length; i++) s += Math.abs(p[i] - q[i]);
    return s;
  },
  chebyshev(p, q) {
    let m = 0;
    for (let i = 0; i < p.length; i++) m = Math.max(m, Math.abs(p[i] - q[i]));
    return m;
  },
  // 1 - cos(angle between p and q seen from the origin). The distance from
  // the origin to any point is set to 1.
  cosine(p, q) {
    let dot = 0;
    let np = 0;
    let nq = 0;
    for (let i = 0; i < p.length; i++) {
      dot += p[i] * q[i];
      np += p[i] * p[i];
      nq += q[i] * q[i];
    }
    const denom = Math.sqrt(np) * Math.sqrt(nq);
    return denom < 1e-12 ? 1 : 1 - dot / denom;
  },
};

// ---------------------------------------------------------------------------
// 4. Controls
// ---------------------------------------------------------------------------

// Reads a decimal number typed with a comma or a point. Returns null if invalid.
export function parseDecimal(text) {
  const cleaned = String(text).trim().replace(",", ".").replace("−", "-");
  if (cleaned === "") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function element(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

// Number with a fixed number of decimals, with a true minus sign and without
// a negative zero. The decimal separator follows the language.
export function formatNumber(x, digits) {
  const text = Applet.fmt(x, digits);
  if (!text.startsWith("-")) return text;
  return /[1-9]/.test(text) ? `−${text.slice(1)}` : text.slice(1);
}

// Labelled number: a text box, with a slider beside it unless slider is false.
// The slider acts while it moves. The text box acts when the entry is
// confirmed, and an invalid entry is replaced by the current value.
export function numberField(host, options) {
  const { id, label, aria, min, max, step = 1, integer = false, digits = 2, slider = true, onChange } = options;
  let range = { min, max };
  let value = clamp(options.value, min, max);

  const group = element(`
    <div class="control-group">
      <label class="form-label" for="${id}">${label}</label>
      <div class="d-flex align-items-center gap-2">
        <input type="text" inputmode="${integer ? "numeric" : "decimal"}" size="5" autocomplete="off"
               class="form-control form-control-sm w-auto flex-shrink-0" id="${id}">
        ${slider ? `<input type="range" class="form-range" min="${min}" max="${max}" step="${step}">` : ""}
      </div>
    </div>`);
  host.appendChild(group);
  const box = group.querySelector("input[type=text]");
  const bar = group.querySelector("input[type=range]");
  if (bar) bar.setAttribute("aria-label", aria || label.replace(/<[^>]+>/g, ""));

  const round = (x) => (integer ? Math.round(x) : Math.round(x / step) * step);
  function show() {
    box.value = integer ? String(value) : Applet.fmt(value, digits);
    if (bar) bar.value = String(value);
  }
  function assign(x, notify) {
    const next = clamp(round(x), range.min, range.max);
    const changed = next !== value;
    value = next;
    show();
    if (changed && notify && onChange) onChange(value);
  }

  if (bar) bar.addEventListener("input", () => assign(Number(bar.value), true));
  box.addEventListener("change", () => {
    const typed = parseDecimal(box.value);
    if (typed === null || (integer && !Number.isInteger(typed))) show();
    else assign(typed, true);
  });
  show();

  return {
    group,
    get value() {
      return value;
    },
    // Sets the value without calling onChange.
    set(x) {
      assign(x, false);
    },
    // Shows a number that may lie outside the range, without changing the range.
    display(x) {
      value = x;
      box.value = integer ? String(x) : Applet.fmt(x, digits);
      if (bar) bar.value = String(clamp(x, range.min, range.max));
    },
    setRange(lo, hi) {
      range = { min: lo, max: hi };
      if (bar) {
        bar.min = String(lo);
        bar.max = String(hi);
      }
      assign(value, false);
    },
    set hidden(flag) {
      group.hidden = flag;
    },
  };
}

// Menu of the four distances, in the same order in every applette.
export function metricSelect(host, t, { value = "euclidean", onChange }) {
  const group = element(`
    <div class="control-group">
      <label class="form-label" for="metric">${t("metricLabel")}</label>
      <select class="form-select form-select-sm" id="metric">
        <option value="euclidean">${t("mEuclidean")}</option>
        <option value="manhattan">${t("mManhattan")}</option>
        <option value="chebyshev">${t("mChebyshev")}</option>
        <option value="cosine">${t("mCosine")}</option>
      </select>
    </div>`);
  host.appendChild(group);
  const select = group.querySelector("select");
  select.value = value;
  select.addEventListener("change", () => onChange(select.value));
  return {
    get value() {
      return select.value;
    },
    set(v) {
      select.value = v;
    },
  };
}

// Reset and download buttons, at the bottom of the panel.
export function actionButtons(host, t, { onReset, onDownload }) {
  const group = element(`
    <div class="control-group d-grid gap-2">
      <button type="button" class="btn btn-sm btn-outline-secondary" data-action="reset">${t("resetLabel")}</button>
      <button type="button" class="btn btn-sm btn-outline-secondary" data-action="download">${t("downloadLabel")}</button>
    </div>`);
  host.appendChild(group);
  group.querySelector("[data-action=reset]").addEventListener("click", onReset);
  group.querySelector("[data-action=download]").addEventListener("click", onDownload);
  return group;
}

// ---------------------------------------------------------------------------
// 5. Cloud and query point
// ---------------------------------------------------------------------------

// The point cloud of an applette and the controls that define it: dimension,
// dataset, seed, parameters of the dataset and number of points.
//
// options.defaults = { dim, dataset, seed, n, sigma, clusters, noise }
// options.n = { min, max, max3d }   bounds of the number of points
// options.onChange(reason)          reason is "data" (new cloud), "dim" (new
//                                   dimension, hence new cloud) or "reset"
export class CloudData {
  constructor(host, t, options) {
    this.t = t;
    this.onChange = options.onChange || (() => {});
    this.limits = Object.assign({ min: 4, max: 200, max3d: null }, options.n);
    this.defaults = Object.assign(
      { dim: 2, dataset: "uniform", seed: 1, n: 50, sigma: 0.4, clusters: 4, noise: 0.1 },
      options.defaults
    );
    this.state = Object.assign({}, this.defaults);
    this.points = [];
    this.build(host);
    this.sync();
    this.generate();
  }

  get dim() {
    return this.state.dim;
  }

  get maxPoints() {
    return this.state.dim === 3 && this.limits.max3d ? this.limits.max3d : this.limits.max;
  }

  // True when the points lie exactly on the circle or on the sphere.
  get onShape() {
    return this.state.dataset === "circle" && this.state.noise === 0;
  }

  build(host) {
    const t = this.t;
    const dimGroup = element(`
      <div class="control-group">
        <span class="form-label d-block">${t("dimLabel")}</span>
        <div class="btn-group btn-group-sm w-100" role="group">
          <input type="radio" class="btn-check" name="cloud-dim" id="cloud-dim2" value="2">
          <label class="btn btn-outline-primary" for="cloud-dim2">${t("dim2")}</label>
          <input type="radio" class="btn-check" name="cloud-dim" id="cloud-dim3" value="3">
          <label class="btn btn-outline-primary" for="cloud-dim3">${t("dim3")}</label>
        </div>
      </div>`);
    host.appendChild(dimGroup);
    this.dimInputs = Array.from(dimGroup.querySelectorAll("input"));
    this.dimInputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (!input.checked) return;
        this.state.dim = Number(input.value);
        this.sync();
        this.generate();
        this.onChange("dim");
      });
    });

    const dataGroup = element(`
      <div class="control-group">
        <label class="form-label" for="cloud-dataset">${t("datasetLabel")}</label>
        <div class="input-group input-group-sm">
          <select class="form-select" id="cloud-dataset">
            ${DATASET_IDS.map((id) => `<option value="${id}"></option>`).join("")}
          </select>
          <label class="input-group-text" for="cloud-seed">${t("seedLabel")}</label>
          <input type="text" inputmode="numeric" autocomplete="off" class="form-control applet-seed"
                 id="cloud-seed" title="${t("seedTitle")}">
        </div>
      </div>`);
    host.appendChild(dataGroup);
    this.datasetSelect = dataGroup.querySelector("select");
    this.seedInput = dataGroup.querySelector("#cloud-seed");
    this.datasetSelect.addEventListener("change", () => {
      this.state.dataset = this.datasetSelect.value;
      this.sync();
      this.regenerate();
    });
    this.seedInput.addEventListener("change", () => {
      const typed = parseDecimal(this.seedInput.value);
      if (typed !== null && Number.isInteger(typed) && typed >= 0) {
        this.state.seed = Math.min(typed, 999999);
        this.regenerate();
      }
      this.sync();
    });

    const param = (key, extra) =>
      numberField(host, Object.assign({
        id: `cloud-${key}`,
        label: t(`${key}Label`),
        value: this.state[key],
        onChange: (value) => {
          this.state[key] = value;
          this.regenerate();
        },
      }, extra));
    this.fields = {
      sigma: param("sigma", { min: 0.05, max: 1, step: 0.05 }),
      clusters: param("clusters", { min: 1, max: 12, integer: true, slider: false }),
      noise: param("noise", { min: 0, max: 1, step: 0.01 }),
      n: param("n", { min: this.limits.min, max: this.maxPoints, integer: true, aria: t("nAria") }),
    };
  }

  // Brings the controls in line with the state.
  sync() {
    const { state, t } = this;
    this.dimInputs.forEach((input) => {
      input.checked = Number(input.value) === state.dim;
    });
    const names = {
      uniform: "dsUniform",
      normal: "dsNormal",
      clusters: "dsClusters",
      circle: state.dim === 3 ? "dsSphere" : "dsCircle",
      circles: state.dim === 3 ? "dsSpheres" : "dsCircles",
      moons: "dsMoons",
    };
    Array.from(this.datasetSelect.options).forEach((option) => {
      option.textContent = t(names[option.value]);
    });
    this.datasetSelect.value = state.dataset;
    this.seedInput.value = String(state.seed);
    const used = DATASET_PARAMS[state.dataset];
    for (const key of ["sigma", "clusters", "noise"]) {
      this.fields[key].set(state[key]);
      this.fields[key].hidden = !used.includes(key);
    }
    this.fields.n.setRange(this.limits.min, this.maxPoints);
    state.n = clamp(state.n, this.limits.min, this.maxPoints);
    this.fields.n.set(state.n);
  }

  generate() {
    const { dataset, dim, n, seed, sigma, clusters, noise } = this.state;
    this.points = generateDataset(dataset, dim, n, seed, { sigma, clusters, noise });
  }

  regenerate() {
    this.generate();
    this.onChange("data");
  }

  reset() {
    this.state = Object.assign({}, this.defaults);
    this.sync();
    this.generate();
    this.onChange("reset");
  }

  // Position allowed for a point at p: inside the domain, and on the circle
  // or on the sphere when the dataset lies exactly on it.
  constrain(p) {
    const dim = this.state.dim;
    let q = [];
    for (let i = 0; i < dim; i++) q.push(clamp(p[i] || 0, -1, 1));
    if (this.onShape) {
      const length = Math.hypot(...q);
      q = length > 1e-9 ? q.map((x) => (SHAPE_RADIUS * x) / length) : [SHAPE_RADIUS, 0, 0].slice(0, dim);
    }
    return q;
  }

  move(index, p) {
    this.points[index] = this.constrain(p);
  }

  // Adds a point. Returns false when the cloud is full.
  add(p) {
    if (this.points.length >= this.maxPoints) return false;
    this.points.push(this.constrain(p));
    this.showCount();
    return true;
  }

  // Removes a point. Returns false when the cloud is at its smallest size.
  remove(index) {
    if (this.points.length <= this.limits.min) return false;
    this.points.splice(index, 1);
    this.showCount();
    return true;
  }

  // After an edit the number of points follows the cloud, without a new draw.
  showCount() {
    this.state.n = this.points.length;
    this.fields.n.display(this.points.length);
  }
}

// Coordinates of the query point, as small boxes in one row. The value is
// always a position allowed by the cloud (see CloudData.constrain).
export class QueryControl {
  constructor(host, t, cloud, options = {}) {
    this.cloud = cloud;
    this.onChange = options.onChange || (() => {});
    this.defaults = options.value || [0.35, 0.25, 0.15];
    this.raw = this.defaults.slice();

    this.group = element(`
      <div class="control-group">
        <span class="form-label d-block">${t("queryLabel")}</span>
        <div class="input-group input-group-sm">
          ${["x", "y", "z"].map((axis) => `
            <label class="input-group-text px-2" for="query-${axis}"><i>${axis}</i></label>
            <input type="text" inputmode="decimal" autocomplete="off" class="form-control px-1" id="query-${axis}">`).join("")}
        </div>
      </div>`);
    host.appendChild(this.group);
    this.inputs = Array.from(this.group.querySelectorAll("input"));
    this.labels = Array.from(this.group.querySelectorAll("label"));
    this.inputs.forEach((input, i) => {
      input.addEventListener("change", () => {
        const typed = parseDecimal(input.value);
        if (typed !== null) {
          this.raw[i] = typed;
          this.sync();
          this.onChange();
        } else {
          this.sync();
        }
      });
    });
    this.sync();
  }

  get value() {
    return this.cloud.constrain(this.raw);
  }

  // Moves the query point, without calling onChange.
  set(p) {
    for (let i = 0; i < p.length; i++) this.raw[i] = p[i];
    this.sync();
  }

  // Back to the default position. The caller then resets the cloud, whose
  // change brings the boxes up to date (sync).
  reset() {
    this.raw = this.defaults.slice();
  }

  // Shows the allowed position and hides z in 2D.
  sync() {
    const q = this.value;
    for (let i = 0; i < q.length; i++) this.raw[i] = q[i];
    this.inputs.forEach((input, i) => {
      input.value = formatNumber(this.raw[i], 2);
      const hidden = i >= this.cloud.dim;
      input.hidden = hidden;
      this.labels[i].hidden = hidden;
    });
  }

  set hidden(flag) {
    this.group.hidden = flag;
  }
}

// ---------------------------------------------------------------------------
// 6. Gestures
// ---------------------------------------------------------------------------

const TAP_SLOP = 5; // pixels a pointer may move during a click
const DOUBLE_MS = 400; // longest delay between the two clicks of a double-click

// Pointer logic shared by the 2D and the 3D figures. The handler h provides
//   hit(x, y, radius)         target under the pointer: { kind: "query" },
//                             { kind: "point", index } or null
//   dragStart(target)         optional
//   dragMove(target, x, y)
//   dragEnd(target)           optional
//   tapEmpty(x, y)            click on empty space
//   remove(index)             double-click or right-click on a point
//   capture(flag)             optional, true while a target is held
//   ignore(event)             optional, true for a press that is not for the cloud
// Coordinates are in pixels from the top left corner of dom.
function attachGestures(dom, h) {
  let drag = null; // { target, id, x0, y0, moved }
  let down = null; // press on empty space: { id, x0, y0, time }
  let held = false; // right button held on a target
  let lastTap = null; // { index, time }

  const position = (event) => {
    const box = dom.getBoundingClientRect();
    return [event.clientX - box.left - dom.clientLeft, event.clientY - box.top - dom.clientTop];
  };
  const reach = (event) => (event.pointerType === "touch" ? 20 : 10);
  const release = () => {
    if (h.capture) h.capture(false);
  };

  // A finger that lands on a point drags it. Elsewhere it scrolls the page.
  dom.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) return;
    const [x, y] = position(event.touches[0]);
    if (h.hit(x, y, 20)) event.preventDefault();
  }, { passive: false });

  dom.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || (h.ignore && h.ignore(event))) return;
    const [x, y] = position(event);
    const target = h.hit(x, y, reach(event));
    if (target && event.button === 0) {
      if (h.capture) h.capture(true);
      drag = { target, id: event.pointerId, x0: x, y0: y, moved: false };
      if (h.dragStart) h.dragStart(target);
      try {
        dom.setPointerCapture(event.pointerId);
      } catch (error) {
        // Without capture the drag stops at the edge of the figure.
      }
    } else if (target && event.button === 2) {
      if (h.capture) h.capture(true);
      held = true;
    } else if (!target && event.button === 0) {
      down = { id: event.pointerId, x0: x, y0: y, time: performance.now() };
    }
  }, true);

  dom.addEventListener("pointermove", (event) => {
    const [x, y] = position(event);
    if (drag && event.pointerId === drag.id) {
      if (!drag.moved && Math.hypot(x - drag.x0, y - drag.y0) > TAP_SLOP) drag.moved = true;
      if (drag.moved) h.dragMove(drag.target, x, y);
    } else if (!drag && event.pointerType === "mouse" && event.buttons === 0) {
      dom.style.cursor = h.hit(x, y, reach(event)) ? "move" : "crosshair";
    }
  });

  dom.addEventListener("pointerup", (event) => {
    const [x, y] = position(event);
    const now = performance.now();
    if (drag && event.pointerId === drag.id) {
      const { target, moved } = drag;
      drag = null;
      release();
      if (moved) {
        lastTap = null;
        if (h.dragEnd) h.dragEnd(target);
      } else if (target.kind === "point") {
        if (lastTap && lastTap.index === target.index && now - lastTap.time < DOUBLE_MS) {
          lastTap = null;
          h.remove(target.index);
        } else {
          lastTap = { index: target.index, time: now };
        }
      }
    } else if (down && event.pointerId === down.id) {
      const still = Math.hypot(x - down.x0, y - down.y0) <= TAP_SLOP && now - down.time < 600;
      down = null;
      if (still) {
        lastTap = null;
        h.tapEmpty(x, y);
      }
    }
    if (held) {
      held = false;
      release();
    }
  });

  dom.addEventListener("pointercancel", () => {
    if (drag && drag.moved && h.dragEnd) h.dragEnd(drag.target);
    drag = null;
    down = null;
    held = false;
    release();
  });

  dom.addEventListener("contextmenu", (event) => {
    const [x, y] = position(event);
    const target = h.hit(x, y, 10);
    if (target) event.preventDefault();
    if (target && target.kind === "point") {
      lastTap = null;
      h.remove(target.index);
    }
  });
}

// Editing of the cloud in a 2D figure.
//   toPixel(p) and toData(x, y)   maps between data and pixels of dom
//   cloud                         CloudData
//   query                         QueryControl, or null. isQueryShown() may
//                                 hide it.
//   ignore(event)                 optional, true for a press on something
//                                 drawn over the cloud, such as a legend
//   onEdit(dragging)              called after every change. dragging is true
//                                 while a point is being dragged.
export function attachEdit2D(dom, { toPixel, toData, cloud, query = null, isQueryShown = () => true, ignore, onEdit }) {
  attachGestures(dom, {
    ignore,
    hit(x, y, radius) {
      if (cloud.dim !== 2) return null;
      if (query && isQueryShown()) {
        const [qx, qy] = toPixel(query.value);
        if (Math.hypot(x - qx, y - qy) <= radius + 2) return { kind: "query" };
      }
      let best = -1;
      let bestDistance = radius;
      cloud.points.forEach((p, index) => {
        const [px, py] = toPixel(p);
        const d = Math.hypot(x - px, y - py);
        if (d <= bestDistance) {
          best = index;
          bestDistance = d;
        }
      });
      return best >= 0 ? { kind: "point", index: best } : null;
    },
    dragMove(target, x, y) {
      const p = toData(x, y);
      if (target.kind === "query") query.set(p);
      else cloud.move(target.index, p);
      onEdit(true);
    },
    dragEnd() {
      onEdit(false);
    },
    tapEmpty(x, y) {
      if (cloud.dim !== 2) return;
      const p = toData(x, y);
      if (Math.abs(p[0]) > 1.05 || Math.abs(p[1]) > 1.05) return;
      if (cloud.add(p)) onEdit(false);
    },
    remove(index) {
      if (cloud.remove(index)) onEdit(false);
    },
  });
}

// Editing of the cloud in a 3D figure drawn with the given camera and orbit
// controls. A dragged point moves in the plane through it that faces the
// viewer. A point added by a click lies in the parallel plane through the
// origin, and the click is ignored when that position is outside the cube.
export function attachEdit3D(dom, camera, controls, { cloud, query = null, isQueryShown = () => true, onEdit }) {
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane();
  const normal = new THREE.Vector3();
  const anchor = new THREE.Vector3();
  const v = new THREE.Vector3();
  const ndc = new THREE.Vector2();

  // Pixel position of a data point, or null when it is behind the camera.
  function toPixel(p) {
    v.set(p[0], p[1], p[2]).project(camera);
    if (v.z > 1) return null;
    return [((v.x + 1) / 2) * dom.clientWidth, ((1 - v.y) / 2) * dom.clientHeight];
  }

  // Point under the pixel (x, y) in the plane through `through` facing the camera.
  function onPlane(x, y, through) {
    ndc.set((x / dom.clientWidth) * 2 - 1, 1 - (y / dom.clientHeight) * 2);
    camera.updateMatrixWorld();
    raycaster.setFromCamera(ndc, camera);
    camera.getWorldDirection(normal);
    plane.setFromNormalAndCoplanarPoint(normal, through);
    const found = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
    return found ? [found.x, found.y, found.z] : null;
  }

  const current = (target) => (target.kind === "query" ? query.value : cloud.points[target.index]);

  attachGestures(dom, {
    hit(x, y, radius) {
      if (cloud.dim !== 3) return null;
      camera.updateMatrixWorld();
      if (query && isQueryShown()) {
        const q = toPixel(query.value);
        if (q && Math.hypot(x - q[0], y - q[1]) <= radius + 2) return { kind: "query" };
      }
      let best = -1;
      let bestDistance = radius;
      cloud.points.forEach((p, index) => {
        const s = toPixel(p);
        if (!s) return;
        const d = Math.hypot(x - s[0], y - s[1]);
        if (d <= bestDistance) {
          best = index;
          bestDistance = d;
        }
      });
      return best >= 0 ? { kind: "point", index: best } : null;
    },
    capture(flag) {
      controls.enabled = !flag;
    },
    dragStart(target) {
      const p = current(target);
      anchor.set(p[0], p[1], p[2]);
    },
    dragMove(target, x, y) {
      const p = onPlane(x, y, anchor);
      if (!p) return;
      if (target.kind === "query") query.set(p);
      else cloud.move(target.index, p);
      onEdit(true);
    },
    dragEnd() {
      onEdit(false);
    },
    tapEmpty(x, y) {
      if (cloud.dim !== 3) return;
      const p = onPlane(x, y, controls.target);
      if (!p || p.some((c) => Math.abs(c) > 1)) return;
      if (cloud.add(p)) onEdit(false);
    },
    remove(index) {
      if (cloud.remove(index)) onEdit(false);
    },
  });
}

// ---------------------------------------------------------------------------
// 7. 3D view
// ---------------------------------------------------------------------------

export const AXIS_COLOURS = [0xff4444, 0x44bb44, 0x4488ff]; // x, y, z

// Axes of the cube [-1, 1]^3 and its edges, as in every 3D point-cloud figure.
export function makeFrame(colours = AXIS_COLOURS) {
  const frame = new THREE.Group();
  const ends = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  ends.forEach(([x, y, z], i) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-x, -y, -z),
      new THREE.Vector3(x, y, z),
    ]);
    frame.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: colours[i] })));
  });
  const box = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 2, 2)),
    new THREE.LineBasicMaterial({ color: 0xcfc8bc })
  );
  frame.add(box);
  return frame;
}

// Three.js view of the cube [-1, 1]^3 inside a container element, with the
// same camera, lights and orbit controls in every applette. The content is
// rebuilt at every drawing: clear(), then the add* methods.
export class CloudView3D {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setClearColor(0xffffff);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.dom = this.renderer.domElement;
    this.dom.style.display = "block";
    container.appendChild(this.dom);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
    this.controls = new OrbitControls(this.camera, this.dom);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.resetCamera();

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const light = new THREE.DirectionalLight(0xffffff, 0.5);
    light.position.set(2, 3, 2);
    this.scene.add(light);
    this.scene.add(makeFrame());
    this.content = new THREE.Group();
    this.scene.add(this.content);

    // The loop runs only while the view is shown.
    this.active = false;
    const loop = () => {
      requestAnimationFrame(loop);
      if (!this.active) return;
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  resetCamera() {
    this.camera.position.set(3, 2.5, 3);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  // Fits the drawing buffer to the container.
  resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  clear() {
    for (const object of this.content.children.slice()) {
      this.content.remove(object);
      if (object.geometry) object.geometry.dispose();
      if (object.material) object.material.dispose();
    }
  }

  // Balls of the given radius at the points.
  addPoints(points, radius, colour, opacity = 1) {
    if (!points.length) return null;
    const material = new THREE.MeshLambertMaterial({ color: colour, transparent: opacity < 1, opacity });
    const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(radius, 16, 12), material, points.length);
    const matrix = new THREE.Matrix4();
    points.forEach((p, i) => {
      matrix.makeTranslation(p[0], p[1], p[2]);
      mesh.setMatrixAt(i, matrix);
    });
    this.content.add(mesh);
    return mesh;
  }

  // Segments given as pairs of points [[p, q], ...].
  addSegments(segments, colour, opacity = 1) {
    if (!segments.length) return null;
    const positions = [];
    for (const [p, q] of segments) positions.push(p[0], p[1], p[2], q[0], q[1], q[2]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({ color: colour, transparent: opacity < 1, opacity });
    const lines = new THREE.LineSegments(geometry, material);
    this.content.add(lines);
    return lines;
  }

  // Translucent triangles given as triples of points [[p, q, r], ...].
  addTriangles(triangles, colour, opacity) {
    if (!triangles.length) return null;
    const positions = [];
    for (const triangle of triangles) for (const p of triangle) positions.push(p[0], p[1], p[2]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.MeshBasicMaterial({
      color: colour, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    this.content.add(mesh);
    return mesh;
  }

  // Translucent solid with a wire outline, centred at p.
  addSolid(geometry, p, colour, opacity) {
    const material = new THREE.MeshBasicMaterial({
      color: colour, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(p[0], p[1], p[2]);
    this.content.add(mesh);
    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry, 20),
      new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity: Math.min(1, 3 * opacity) })
    );
    outline.position.copy(mesh.position);
    this.content.add(outline);
    return mesh;
  }

  // Canvas holding the current image.
  snapshot() {
    this.renderer.render(this.scene, this.camera);
    return this.dom;
  }
}

// ---------------------------------------------------------------------------
// 8. Images
// ---------------------------------------------------------------------------

function saveBlob(blob, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 60000);
}

export function saveCanvasPNG(canvas, filename) {
  canvas.toBlob((blob) => {
    if (blob) saveBlob(blob, filename);
  }, "image/png");
}

// Image of an SVG element, at twice its size on screen.
export function saveSvgPNG(svg, filename) {
  const width = svg.clientWidth || Number(svg.getAttribute("width")) || 600;
  const height = svg.clientHeight || Number(svg.getAttribute("height")) || 600;
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", width);
  clone.setAttribute("height", height);
  const text = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([text], { type: "image/svg+xml;charset=utf-8" }));
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 2 * width;
    canvas.height = 2 * height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    saveCanvasPNG(canvas, filename);
  };
  image.onerror = () => URL.revokeObjectURL(url);
  image.src = url;
}

// One image of several canvases, placed as they are on the page. Hidden
// canvases are left out.
export function saveCanvasesPNG(canvases, filename) {
  const shown = canvases.filter((canvas) => canvas.offsetParent !== null && canvas.clientWidth > 0);
  if (!shown.length) return;
  const boxes = shown.map((canvas) => canvas.getBoundingClientRect());
  const left = Math.min(...boxes.map((b) => b.left));
  const top = Math.min(...boxes.map((b) => b.top));
  const right = Math.max(...boxes.map((b) => b.right));
  const bottom = Math.max(...boxes.map((b) => b.bottom));
  const scale = 2;
  const out = document.createElement("canvas");
  out.width = Math.round((right - left) * scale);
  out.height = Math.round((bottom - top) * scale);
  const ctx = out.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  shown.forEach((canvas, i) => {
    const b = boxes[i];
    ctx.drawImage(canvas, (b.left - left) * scale, (b.top - top) * scale, b.width * scale, b.height * scale);
  });
  saveCanvasPNG(out, filename);
}
