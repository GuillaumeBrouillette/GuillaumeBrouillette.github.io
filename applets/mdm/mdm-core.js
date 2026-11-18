// Multiparameter discrete Morse (MDM) theory: computations for the applet.
//
// This module follows
//   G. Brouillette, "Analyzing multifiltering functions using multiparameter
//   discrete Morse theory", Topological Methods in Nonlinear Analysis 66(2),
//   2025, 597–645, doi:10.12775/TMNA.2025.020,
// and the author's Python implementation of the same algorithms. It handles
// simplicial complexes of dimension at most 2.
//
// Contents
//   SimplicialComplex   complex with facets, cofacets and insertion order
//   prepareFunction     max-extension of a vertex map and its level sets
//   indexMap            admissible indexing maps I
//   generateMDM         algorithms GenerateMDM, ExpandMDM and ComputeG
//   analyse             Pareto set, critical components, relative perfectness
//   generators          triangulated surfaces and planar complexes
//   parseGTS            reader for GNU Triangulated Surface files

// ---------------------------------------------------------------------------
// Simplicial complex
// ---------------------------------------------------------------------------

export class SimplicialComplex {
  constructor() {
    this.points = [];    // points[v] = [x, y, z] for the vertex numbered v
    this.simplices = []; // simplices[id] = increasing array of vertex numbers
    this.facets = [];    // facets[id] = ids of the facets of the simplex
    this.cofacets = [];  // cofacets[id] = ids of its cofacets
    this.byKey = new Map();
  }

  setPoint(v, p) {
    this.points[v] = p;
  }

  _add(vs) {
    const key = vs.join(",");
    const found = this.byKey.get(key);
    if (found !== undefined) return found;
    const id = this.simplices.length;
    this.byKey.set(key, id);
    this.simplices.push(vs);
    this.cofacets.push([]);
    const facets = [];
    if (vs.length > 1) {
      // Facets in the order (a,b), (a,c), (b,c) for a triangle (a,b,c).
      for (let k = vs.length - 1; k >= 0; k--) {
        const facet = vs.filter((_, i) => i !== k);
        const fid = this.byKey.get(facet.join(","));
        facets.push(fid);
        this.cofacets[fid].push(id);
      }
    }
    this.facets.push(facets);
    return id;
  }

  // Insert a simplex (increasing array of at most three vertex numbers) and
  // its faces. The faces are inserted first, vertices then edges, so that the
  // insertion order is an admissible indexing map.
  insert(vs) {
    for (const v of vs) this._add([v]);
    if (vs.length >= 2) {
      for (let i = 0; i < vs.length; i++) {
        for (let j = i + 1; j < vs.length; j++) this._add([vs[i], vs[j]]);
      }
    }
    if (vs.length === 3) this._add(vs);
  }

  get size() {
    return this.simplices.length;
  }

  dimOf(id) {
    return this.simplices[id].length - 1;
  }

  countByDim() {
    const n = [0, 0, 0];
    for (const s of this.simplices) n[s.length - 1]++;
    return n;
  }

  idOf(vs) {
    return this.byKey.get(vs.join(","));
  }

  barycentre(id) {
    const vs = this.simplices[id];
    const c = [0, 0, 0];
    for (const v of vs) {
      const p = this.points[v];
      c[0] += p[0]; c[1] += p[1]; c[2] += p[2];
    }
    return [c[0] / vs.length, c[1] / vs.length, c[2] / vs.length];
  }
}

// ---------------------------------------------------------------------------
// Multifiltering function: max-extension of a vertex map
// ---------------------------------------------------------------------------

// vertexValues[v] = [f_1(v), ..., f_k(v)]. The function is extended to every
// simplex by f_i(sigma) = max of f_i over the vertices of sigma. Values of f_i
// closer than a threshold eps_i are identified, as in the reference
// implementation, so that equalities between floating-point values are
// decided consistently. Each f_i is then encoded by the rank of its value
// among the distinct values of f_i, which makes all comparisons exact.
export function prepareFunction(K, vertexValues) {
  const nv = K.points.length;
  const k = vertexValues[0].length;
  const n = K.size;
  const values = [];  // values[i] = increasing distinct values of f_i
  const eps = [];
  const vRank = [];
  for (let i = 0; i < k; i++) {
    const order = Array.from({ length: nv }, (_, v) => v)
      .sort((a, b) => vertexValues[a][i] - vertexValues[b][i]);
    const lo = vertexValues[order[0]][i];
    const hi = vertexValues[order[nv - 1]][i];
    const e = hi > lo ? Math.pow(10, Math.floor(Math.log10(hi - lo)) - 8) : 1;
    const rank = new Int32Array(nv);
    const distinct = [lo];
    for (let j = 1; j < nv; j++) {
      const cur = vertexValues[order[j]][i];
      const prev = vertexValues[order[j - 1]][i];
      if (!(cur - prev < e)) distinct.push(cur);
      rank[order[j]] = distinct.length - 1;
    }
    values.push(distinct);
    eps.push(e);
    vRank.push(rank);
  }

  // Rank of f_i on every simplex.
  const rank = [];
  for (let i = 0; i < k; i++) {
    const r = new Int32Array(n);
    for (let id = 0; id < n; id++) {
      let m = -1;
      for (const v of K.simplices[id]) if (vRank[i][v] > m) m = vRank[i][v];
      r[id] = m;
    }
    rank.push(r);
  }

  // Level sets L_u, in lexicographic order of u. If u' <= u componentwise and
  // u' != u, then L_u' comes before L_u.
  const base = nv + 1;
  const keyOf = (id) => {
    let key = 0;
    for (let i = 0; i < k; i++) key = key * base + rank[i][id];
    return key;
  };
  const groups = new Map();
  for (let id = 0; id < n; id++) {
    const key = keyOf(id);
    const g = groups.get(key);
    if (g) g.push(id); else groups.set(key, [id]);
  }
  const keys = [...groups.keys()].sort((a, b) => a - b);
  const levels = keys.map((key) => groups.get(key));
  const levelOf = new Int32Array(n);
  levels.forEach((L, li) => { for (const id of L) levelOf[id] = li; });

  return { k, values, eps, rank, levels, levelOf };
}

// True when f_i(a) = f_i(b) for some i.
function shareComponent(F, a, b) {
  for (let i = 0; i < F.k; i++) if (F.rank[i][a] === F.rank[i][b]) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Indexing maps
// ---------------------------------------------------------------------------

// Small seeded generator (mulberry32) for reproducible random choices.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Admissible indexing map I: K -> N (alpha < sigma implies I(alpha) < I(sigma)).
//   type "insertion"        order in which the simplices were inserted
//   type "axis"             increasing (sign = 1) or decreasing (sign = -1)
//                           along the coordinate axis: vertices are relabelled
//                           along the axis, each simplex is written with its
//                           labels in decreasing order and the simplices are
//                           sorted lexicographically
//   type "random"           random order within each dimension
export function indexMap(K, type, opts = {}) {
  const n = K.size;
  const I = new Int32Array(n);
  if (type === "insertion") {
    for (let id = 0; id < n; id++) I[id] = id + 1;
    return I;
  }
  if (type === "random") {
    const rnd = seededRandom(opts.seed || 1);
    const byDim = [[], [], []];
    for (let id = 0; id < n; id++) byDim[K.dimOf(id)].push(id);
    let next = 1;
    for (const ids of byDim) {
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      for (const id of ids) I[id] = next++;
    }
    return I;
  }
  // type === "axis"
  const axis = opts.axis || 0;
  const sign = opts.sign || 1;
  const nv = K.points.length;
  const others = [0, 1, 2].filter((a) => a !== axis);
  const order = Array.from({ length: nv }, (_, v) => v).sort((a, b) => {
    const pa = K.points[a], pb = K.points[b];
    let d = sign * (pa[axis] - pb[axis]);
    if (d !== 0) return d;
    for (const o of others) {
      d = pa[o] - pb[o];
      if (d !== 0) return d;
    }
    return a - b;
  });
  const label = new Int32Array(nv);
  order.forEach((v, pos) => { label[v] = pos; });
  const keys = K.simplices.map((vs) => vs.map((v) => label[v]).sort((a, b) => b - a));
  const ids = Array.from({ length: n }, (_, id) => id).sort((a, b) => {
    const ka = keys[a], kb = keys[b];
    const m = Math.min(ka.length, kb.length);
    for (let i = 0; i < m; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
    return ka.length - kb.length;
  });
  ids.forEach((id, pos) => { I[id] = pos + 1; });
  return I;
}

// ---------------------------------------------------------------------------
// GenerateMDM
// ---------------------------------------------------------------------------

class MinHeap {
  constructor() { this.keys = []; this.items = []; }
  get length() { return this.keys.length; }
  push(key, item) {
    const keys = this.keys, items = this.items;
    let i = keys.length;
    keys.push(key); items.push(item);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (keys[p] <= key) break;
      keys[i] = keys[p]; items[i] = items[p];
      i = p;
    }
    keys[i] = key; items[i] = item;
  }
  pop() {
    const keys = this.keys, items = this.items;
    const top = items[0];
    const key = keys.pop(), item = items.pop();
    const n = keys.length;
    if (n > 0) {
      let i = 0;
      for (;;) {
        let c = 2 * i + 1;
        if (c >= n) break;
        if (c + 1 < n && keys[c + 1] < keys[c]) c++;
        if (keys[c] >= key) break;
        keys[i] = keys[c]; items[i] = items[c];
        i = c;
      }
      keys[i] = key; items[i] = item;
    }
    return top;
  }
}

// Algorithm GenerateMDM. Returns the gradient field V and the MDM function g.
//   pair[id]  = id if the simplex is critical, otherwise the simplex it is
//               paired with (tail and head of a vector of V)
//   isTail[id] = 1 if the simplex is the tail of a vector, i.e. V(id) = pair[id]
//   g_i = f_i for i >= 2 and g_1 = f_1 + c * delta, where the integer
//   c = gCount[id] counts the increments made by ComputeG. Since
//   delta < (smallest gap of f_1) / |K|, comparing values of g_1 amounts to
//   comparing the pairs (rank of f_1 value, c) lexicographically.
export function generateMDM(K, F, I) {
  const n = K.size;
  const pair = new Int32Array(n).fill(-1);
  const isTail = new Uint8Array(n);
  const gRank = new Int32Array(n);
  const gCount = new Int32Array(n);
  const processed = new Uint8Array(n);
  const { levelOf } = F;
  const f1 = F.rank[0];

  for (let li = 0; li < F.levels.length; li++) {
    const L = F.levels[li];

    const numUnprocFacets = (s) => {
      let c = 0;
      for (const a of K.facets[s]) if (levelOf[a] === li && !processed[a]) c++;
      return c;
    };
    const unprocFacet = (s) => {
      for (const a of K.facets[s]) if (levelOf[a] === li && !processed[a]) return a;
      return -1;
    };

    // Algorithm ComputeG: value of g_1 on sigma (and on tau when given).
    const computeG = (sigma, tau) => {
      let r = f1[sigma], c = 0;
      const facets = K.facets[sigma];
      if (facets.length > 0) {
        // Maximum of g_1 over the facets of sigma other than tau.
        let mr = -1, mc = -1;
        for (const a of facets) {
          if (a === tau) continue;
          if (gRank[a] > mr || (gRank[a] === mr && gCount[a] > mc)) {
            mr = gRank[a]; mc = gCount[a];
          }
        }
        if (mr >= r) {
          // The maximum is attained by a facet alpha. If g(alpha) = w for a
          // facet alpha in the level set, increase w_1 by delta.
          r = mr; c = mc;
          for (const a of facets) {
            if (a === tau || levelOf[a] !== li) continue;
            if (gRank[a] === mr && gCount[a] === mc) { c = mc + 1; break; }
          }
        }
      }
      return [r, c];
    };

    const pqZero = new MinHeap();
    const pqOne = new MinHeap();
    const addCofacets = (s) => {
      for (const b of K.cofacets[s]) {
        if (levelOf[b] === li && !processed[b] && numUnprocFacets(b) === 1) {
          pqOne.push(I[b], b);
        }
      }
    };

    // Algorithm ExpandMDM on the level set L.
    for (const s of L) {
      const c = numUnprocFacets(s);
      if (c === 0) pqZero.push(I[s], s);
      else if (c === 1) pqOne.push(I[s], s);
    }
    while (pqOne.length > 0 || pqZero.length > 0) {
      while (pqOne.length > 0) {
        const sigma = pqOne.pop();
        if (numUnprocFacets(sigma) === 0) {
          pqZero.push(I[sigma], sigma);
        } else {
          // sigma and its unique unprocessed facet tau are processed as a pair.
          const tau = unprocFacet(sigma);
          const [r, c] = computeG(sigma, tau);
          gRank[sigma] = r; gCount[sigma] = c;
          gRank[tau] = r; gCount[tau] = c;
          pair[tau] = sigma; pair[sigma] = tau; isTail[tau] = 1;
          processed[tau] = 1; processed[sigma] = 1;
          addCofacets(sigma);
          addCofacets(tau);
        }
      }
      if (pqZero.length > 0) {
        const sigma = pqZero.pop();
        if (!processed[sigma]) {
          // sigma is processed as critical.
          const [r, c] = computeG(sigma, -1);
          gRank[sigma] = r; gCount[sigma] = c;
          pair[sigma] = sigma;
          processed[sigma] = 1;
          addCofacets(sigma);
        }
      }
    }
  }

  const delta = Math.min(1, F.eps[0]) / n;
  return { pair, isTail, gRank, gCount, delta };
}

// ---------------------------------------------------------------------------
// Homology with coefficients in Z/2
// ---------------------------------------------------------------------------

class UnionFind {
  constructor(n) {
    this.parent = new Int32Array(n);
    for (let i = 0; i < n; i++) this.parent[i] = i;
  }
  find(x) {
    const p = this.parent;
    while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; }
    return x;
  }
  union(a, b) {
    a = this.find(a); b = this.find(b);
    if (a !== b) this.parent[a] = b;
    return a !== b;
  }
}

// Symmetric difference of two increasing arrays.
function xorSorted(a, b) {
  const out = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; }
    else if (a[i] < b[j]) out.push(a[i++]);
    else out.push(b[j++]);
  }
  while (i < a.length) out.push(a[i++]);
  while (j < b.length) out.push(b[j++]);
  return out;
}

// Rank over Z/2 of a matrix given by its columns (increasing arrays of row
// indices), by the usual column reduction with pivots on the largest index.
function rankZ2(columns) {
  const pivotOf = new Map();
  let rank = 0;
  for (let col of columns) {
    while (col.length > 0) {
      const low = col[col.length - 1];
      const other = pivotOf.get(low);
      if (other === undefined) { pivotOf.set(low, col); rank++; break; }
      col = xorSorted(col, other);
    }
  }
  return rank;
}

// Betti numbers of the relative homology H(Cl C, Ex C) for a set C of
// simplices, given as an array of ids with member(id) telling whether a
// simplex belongs to C. Since Cl C \ Ex C = C, the relative chain complex is
// generated by the simplices of C, with the boundary restricted to C.
function relativeBetti(K, ids, member) {
  const count = [0, 0, 0];
  const local = new Map(); // vertex id -> local index
  const edges = [], triangles = [];
  for (const id of ids) {
    const d = K.dimOf(id);
    count[d]++;
    if (d === 0) local.set(id, local.size);
    else if (d === 1) edges.push(id);
    else triangles.push(id);
  }

  // rank of d_1: an edge of C with its two vertices in C joins them, an edge
  // with one vertex in C kills the class of that vertex.
  let rank1 = 0;
  if (count[0] > 0 && edges.length > 0) {
    const uf = new UnionFind(count[0] + 1);
    const ground = count[0];
    for (const e of edges) {
      const inC = K.facets[e].filter(member);
      if (inC.length === 2) {
        if (uf.union(local.get(inC[0]), local.get(inC[1]))) rank1++;
      } else if (inC.length === 1) {
        if (uf.union(local.get(inC[0]), ground)) rank1++;
      }
    }
  }

  // rank of d_2 by column reduction.
  let rank2 = 0;
  if (triangles.length > 0 && edges.length > 0) {
    const columns = [];
    for (const t of triangles) {
      const col = K.facets[t].filter(member).sort((a, b) => a - b);
      if (col.length > 0) columns.push(col);
    }
    rank2 = rankZ2(columns);
  }

  return [count[0] - rank1, count[1] - rank1 - rank2, count[2] - rank2];
}

// ---------------------------------------------------------------------------
// Pareto set, critical components and relative perfectness
// ---------------------------------------------------------------------------

export function analyse(K, F, mdm) {
  const n = K.size;
  const { levelOf } = F;
  const critical = (id) => mdm.pair[id] === id;

  // Connected components of the level sets. A level set is convex for the
  // face relation, so two of its simplices are connected as soon as they are
  // joined by a chain of facets inside the level set.
  const uf = new UnionFind(n);
  for (let id = 0; id < n; id++) {
    for (const a of K.facets[id]) if (levelOf[a] === levelOf[id]) uf.union(a, id);
  }
  const compIndex = new Map();
  const comps = [];
  const compOf = new Int32Array(n);
  for (let id = 0; id < n; id++) {
    const root = uf.find(id);
    let ci = compIndex.get(root);
    if (ci === undefined) {
      ci = comps.length;
      compIndex.set(root, ci);
      comps.push({ ids: [], betti: null, crit: [0, 0, 0], primary: -1, pareto: false });
    }
    compOf[id] = ci;
    comps[ci].ids.push(id);
    if (critical(id)) comps[ci].crit[K.dimOf(id)]++;
  }

  // Pareto set of f: a simplex is Pareto critical when its component C in its
  // level set has nonzero relative homology H(Cl C, Ex C). The primary simplex
  // of C, when it exists, is the simplex of C whose lower star is C, that is,
  // the intersection of all simplices of C.
  // paretoType: 0 = not in the Pareto set, 1 = Pareto, 2 = primary Pareto.
  const paretoType = new Uint8Array(n);
  let nonPerfect = 0;
  const betti = [0, 0, 0];
  for (let ci = 0; ci < comps.length; ci++) {
    const C = comps[ci];
    C.betti = relativeBetti(K, C.ids, (id) => compOf[id] === ci);
    for (let p = 0; p < 3; p++) betti[p] += C.betti[p];
    if (C.betti[0] !== C.crit[0] || C.betti[1] !== C.crit[1] || C.betti[2] !== C.crit[2]) {
      nonPerfect++;
    }
    if (C.betti[0] + C.betti[1] + C.betti[2] === 0) continue;
    C.pareto = true;
    let common = K.simplices[C.ids[0]];
    for (const id of C.ids) {
      const vs = K.simplices[id];
      common = common.filter((v) => vs.includes(v));
      if (common.length === 0) break;
    }
    if (common.length > 0) {
      const pid = K.idOf(common);
      if (pid !== undefined && compOf[pid] === ci) C.primary = pid;
    }
    for (const id of C.ids) paretoType[id] = id === C.primary ? 2 : 1;
  }

  // Proper faces of a simplex (vertices of an edge, vertices and edges of a
  // triangle).
  const properFaces = (id) => {
    const faces = K.facets[id].slice();
    if (K.dimOf(id) === 2) for (const v of K.simplices[id]) faces.push(K.idOf([v]));
    return faces;
  };

  // Connected components of the Pareto set.
  const ufP = new UnionFind(n);
  for (let id = 0; id < n; id++) {
    if (!paretoType[id]) continue;
    for (const a of properFaces(id)) if (paretoType[a]) ufP.union(a, id);
  }
  const paretoLabel = new Int32Array(n).fill(-1);
  const paretoSizes = relabel(ufP, paretoLabel, (id) => paretoType[id] > 0, n);

  // Critical components of g with respect to ~f (Definition 6.1 of the
  // paper): two critical simplices sigma and tau are related when
  //   (1) f_i(sigma) = f_i(tau) for some i, and
  //   (2) some simplex of the component of sigma in its level set is a face
  //       or a coface of some simplex of the component of tau in its level set,
  // and ~f is the transitive closure of this relation.
  const ufC = new UnionFind(comps.length);
  const hasCritical = comps.map((C) => C.crit[0] + C.crit[1] + C.crit[2] > 0);
  for (let id = 0; id < n; id++) {
    const ci = compOf[id];
    if (!hasCritical[ci]) continue;
    for (const a of properFaces(id)) {
      const cj = compOf[a];
      if (cj !== ci && hasCritical[cj] && shareComponent(F, id, a)) ufC.union(ci, cj);
    }
  }
  const critLabel = new Int32Array(n).fill(-1);
  const rootLabel = new Map();
  const critSizes = [];
  for (let id = 0; id < n; id++) {
    if (!critical(id)) continue;
    const root = ufC.find(compOf[id]);
    let label = rootLabel.get(root);
    if (label === undefined) { label = critSizes.length; rootLabel.set(root, label); critSizes.push(0); }
    critLabel[id] = label;
    critSizes[label]++;
  }

  return {
    compOf, comps, paretoType, paretoLabel, paretoSizes, critLabel, critSizes,
    betti,            // sum over all level sets of the relative Betti numbers
    nonPerfect,       // number of level-set components where g is not perfect
  };
}

// Critical components of g defined with the gradient flow.
//
// For critical simplices sigma and tau, sigma connects to tau when tau can be
// reached from sigma in the flow induced by the gradient field V: one goes
// from a simplex to its proper faces when it is critical, from the tail of a
// vector to its head, and from the head of a vector to its proper faces
// other than its tail. The relation R_g holds between sigma and tau when
//   (1) g_i(sigma) = g_i(tau) for some i, and
//   (2) sigma connects to tau or tau connects to sigma,
// and ~g is its transitive closure (Brouillette, Allili and Kaczynski, 2024;
// Definition 3.5 of the TMNA paper). The relation ~'g replaces (1) by
//   (1') f_i(sigma) = f_i(tau) for some i   (Section 6.3 of the TMNA paper).
//
// Returns null when the complex has too many critical simplices for the
// reachability sets to be stored.
export function flowComponents(K, F, mdm, maxWords = 30e6) {
  const n = K.size;
  const critIds = [];
  const cidx = new Int32Array(n).fill(-1);
  for (let id = 0; id < n; id++) {
    if (mdm.pair[id] === id) { cidx[id] = critIds.length; critIds.push(id); }
  }
  const C = critIds.length;
  const W = Math.max(1, Math.ceil(C / 32));
  if (n * W > maxWords) return null;

  const properFaces = (id) => {
    const faces = K.facets[id].slice();
    if (K.dimOf(id) === 2) for (const v of K.simplices[id]) faces.push(K.idOf([v]));
    return faces;
  };
  // Successors of a simplex in the flow.
  const successors = (id) => {
    if (mdm.pair[id] === id) return properFaces(id);
    if (mdm.isTail[id]) return [mdm.pair[id]];
    return properFaces(id).filter((a) => a !== mdm.pair[id]);
  };

  // reach[id] = set of critical simplices reachable from id, as a bitset.
  // The flow is acyclic, so the sets are computed in post-order.
  const reach = new Uint32Array(n * W);
  const state = new Uint8Array(n); // 0 = new, 1 = open, 2 = done
  const stack = [];
  for (const start of critIds) {
    if (state[start] === 2) continue;
    stack.push(start);
    while (stack.length > 0) {
      const id = stack[stack.length - 1];
      if (state[id] === 0) {
        state[id] = 1;
        for (const a of successors(id)) if (state[a] === 0) stack.push(a);
      } else {
        stack.pop();
        if (state[id] === 2) continue;
        state[id] = 2;
        const base = id * W;
        for (const a of successors(id)) {
          const from = a * W;
          for (let w = 0; w < W; w++) reach[base + w] |= reach[from + w];
        }
        if (cidx[id] >= 0) reach[base + (cidx[id] >>> 5)] |= 1 << (cidx[id] & 31);
      }
    }
  }

  const sameG = (a, b) => {
    if (mdm.gRank[a] === mdm.gRank[b] && mdm.gCount[a] === mdm.gCount[b]) return true;
    for (let i = 1; i < F.k; i++) if (F.rank[i][a] === F.rank[i][b]) return true;
    return false;
  };
  const sameF = (a, b) => {
    for (let i = 0; i < F.k; i++) if (F.rank[i][a] === F.rank[i][b]) return true;
    return false;
  };
  const ufG = new UnionFind(C), ufF = new UnionFind(C);
  for (let i = 0; i < C; i++) {
    const a = critIds[i];
    const base = a * W;
    for (let w = 0; w < W; w++) {
      let bits = reach[base + w];
      while (bits !== 0) {
        const low = bits & -bits;
        const j = (w << 5) + (31 - Math.clz32(low));
        bits ^= low;
        if (j === i) continue;
        const b = critIds[j];
        if (sameG(a, b)) ufG.union(i, j);
        if (sameF(a, b)) ufF.union(i, j);
      }
    }
  }

  const label = (uf) => {
    const labels = new Int32Array(n).fill(-1);
    const rootLabel = new Map();
    const sizes = [];
    for (let i = 0; i < C; i++) {
      const root = uf.find(i);
      let l = rootLabel.get(root);
      if (l === undefined) { l = sizes.length; rootLabel.set(root, l); sizes.push(0); }
      labels[critIds[i]] = l;
      sizes[l]++;
    }
    return { labels, sizes };
  };
  const g = label(ufG), gp = label(ufF);
  return { gLabel: g.labels, gSizes: g.sizes, gpLabel: gp.labels, gpSizes: gp.sizes };
}

// Labels 0, 1, 2, ... for the classes of a union-find restricted to the
// elements selected by keep. Returns the sizes of the classes.
function relabel(uf, labels, keep, n) {
  const rootLabel = new Map();
  const sizes = [];
  for (let id = 0; id < n; id++) {
    if (!keep(id)) continue;
    const root = uf.find(id);
    let label = rootLabel.get(root);
    if (label === undefined) { label = sizes.length; rootLabel.set(root, label); sizes.push(0); }
    labels[id] = label;
    sizes[label]++;
  }
  return sizes;
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const sorted3 = (a, b, c) => [a, b, c].sort((x, y) => x - y);

// Sphere of radius r gridded by m parallels and n meridians, with two poles.
// Same construction and vertex numbering as the reference implementation.
export function regularSphere(m = 15, n = 20, r = 1) {
  const K = new SimplicialComplex();
  for (let k = 0; k < m * n; k++) {
    const i = Math.floor(k / n), j = k % n;
    const theta = ((i + 1) / (m + 1)) * Math.PI, phi = (j / n) * 2 * Math.PI;
    K.setPoint(k, [r * Math.sin(theta) * Math.cos(phi), r * Math.sin(theta) * Math.sin(phi), r * Math.cos(theta)]);
    if (j < n - 1) {
      if (i === 0) K.insert([k, k + 1, m * n]);
      if (i < m - 1) {
        K.insert([k, k + 1, k + n]);
        K.insert([k + 1, k + n, k + n + 1]);
      } else {
        K.insert([k, k + 1, m * n + 1]);
      }
    } else {
      if (i === 0) K.insert([0, k, m * n]);
      if (i < m - 1) {
        K.insert([k - n + 1, k, k + n]);
        K.insert([k - n + 1, k + 1, k + n]);
      } else {
        K.insert([(m - 1) * n, m * n - 1, m * n + 1]);
      }
    }
  }
  K.setPoint(m * n, [0, 0, r]);
  K.setPoint(m * n + 1, [0, 0, -r]);
  return K;
}

// Torus gridded by m points around the tube and n points around the z-axis.
// Same construction and vertex numbering as the reference implementation.
export function torus(m = 16, n = 20, R = 2, r = 1) {
  const K = new SimplicialComplex();
  for (let k = 0; k < m * n; k++) {
    const i = Math.floor(k / n), j = k % n;
    const theta = (i / m) * 2 * Math.PI, phi = (j / n) * 2 * Math.PI;
    K.setPoint(k, [(R + r * Math.cos(theta)) * Math.cos(phi), (R + r * Math.cos(theta)) * Math.sin(phi), r * Math.sin(theta)]);
    if (i < m - 1) {
      if (j < n - 1) {
        K.insert([k, k + 1, k + n]);
        K.insert([k + 1, k + n, k + n + 1]);
      } else {
        K.insert([k - n + 1, k, k + n]);
        K.insert([k - n + 1, k + 1, k + n]);
      }
    } else if (j < n - 1) {
      K.insert([j, k, k + 1]);
      K.insert([j, j + 1, k + 1]);
    } else {
      K.insert([n - 1, (m - 1) * n, m * n - 1]);
      K.insert([0, n - 1, (m - 1) * n]);
    }
  }
  return K;
}

// Sphere obtained from a polyhedron by repeated midpoint subdivision, the new
// vertices being projected on the unit sphere.
function subdividedSphere(points, triangles, levels) {
  const pts = points.map((p) => normalise(p));
  let tris = triangles.map((t) => t.slice());
  for (let l = 0; l < levels; l++) {
    const mid = new Map();
    const midpoint = (a, b) => {
      const key = a < b ? a + "," + b : b + "," + a;
      let m = mid.get(key);
      if (m === undefined) {
        m = pts.length;
        pts.push(normalise([pts[a][0] + pts[b][0], pts[a][1] + pts[b][1], pts[a][2] + pts[b][2]]));
        mid.set(key, m);
      }
      return m;
    };
    const next = [];
    for (const [a, b, c] of tris) {
      const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
      next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    tris = next;
  }
  const K = new SimplicialComplex();
  pts.forEach((p, v) => K.setPoint(v, p));
  for (const [a, b, c] of tris) K.insert(sorted3(a, b, c));
  return K;
}

function normalise(p) {
  const l = Math.hypot(p[0], p[1], p[2]);
  return [p[0] / l, p[1] / l, p[2] / l];
}

export function icosahedralSphere(levels = 2) {
  const t = (1 + Math.sqrt(5)) / 2;
  const points = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ];
  const triangles = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  return subdividedSphere(points, triangles, levels);
}

export function octahedralSphere(levels = 3) {
  const points = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const triangles = [
    [0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4],
    [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5],
  ];
  return subdividedSphere(points, triangles, levels);
}

export function cubeSphere(levels = 3) {
  const points = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
  ];
  const triangles = [
    [0, 1, 2], [0, 2, 3], [4, 6, 5], [4, 7, 6],
    [0, 5, 1], [0, 4, 5], [1, 6, 2], [1, 5, 6],
    [2, 7, 3], [2, 6, 7], [3, 4, 0], [3, 7, 4],
  ];
  return subdividedSphere(points, triangles, levels);
}

// --- Planar complexes ------------------------------------------------------

// The complex of Figure 4 of the paper: a square split in two triangles, with
// the indexing map of the figure (v0, ..., v3, e4, ..., e8, t9, t10).
export function paperExample() {
  const K = new SimplicialComplex();
  K.setPoint(0, [0, 1, 0]);
  K.setPoint(1, [0, 0, 0]);
  K.setPoint(2, [1, 0, 0]);
  K.setPoint(3, [1, 1, 0]);
  for (const v of [0, 1, 2, 3]) K.insert([v]);
  for (const e of [[0, 1], [1, 2], [2, 3], [0, 3], [1, 3]]) K.insert(e);
  K.insert([0, 1, 3]);
  K.insert([1, 2, 3]);
  // Vertex map of the figure, extended to the other simplices by the maximum.
  K.vertexValues = [[0, 0], [1, 2], [0, 0], [2, 1]];
  return K;
}

// Square [-1, 1]^2 gridded by n x n cells, each split along a diagonal.
export function squareGrid(n = 10) {
  const K = new SimplicialComplex();
  const at = (i, j) => i * (n + 1) + j;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= n; j++) K.setPoint(at(i, j), [-1 + (2 * j) / n, 1 - (2 * i) / n, 0]);
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      K.insert(sorted3(at(i, j), at(i, j + 1), at(i + 1, j)));
      K.insert(sorted3(at(i, j + 1), at(i + 1, j), at(i + 1, j + 1)));
    }
  }
  return K;
}

// Disc (inner = 0) or annulus (inner > 0) of outer radius 1, gridded by m
// rings and n sectors.
export function polarGrid(m = 6, n = 24, inner = 0) {
  const K = new SimplicialComplex();
  const rings = inner > 0 ? m + 1 : m; // number of circles of vertices
  const radius = (i) => (inner > 0 ? inner + ((1 - inner) * i) / m : (i + 1) / m);
  const at = (i, j) => i * n + ((j % n) + n) % n;
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < n; j++) {
      // A small rotation avoids vertices with equal coordinates.
      const phi = ((j + 0.31) / n) * 2 * Math.PI;
      K.setPoint(at(i, j), [radius(i) * Math.cos(phi), radius(i) * Math.sin(phi), 0]);
    }
  }
  const centre = rings * n;
  if (inner === 0) K.setPoint(centre, [0, 0, 0]);
  for (let j = 0; j < n; j++) {
    if (inner === 0) K.insert(sorted3(at(0, j), at(0, j + 1), centre));
    for (let i = 0; i < rings - 1; i++) {
      K.insert(sorted3(at(i, j), at(i, j + 1), at(i + 1, j)));
      K.insert(sorted3(at(i, j + 1), at(i + 1, j), at(i + 1, j + 1)));
    }
  }
  return K;
}

// ---------------------------------------------------------------------------
// GNU Triangulated Surface (GTS) files
// ---------------------------------------------------------------------------

// A GTS file lists the numbers of vertices, edges and triangles, then the
// coordinates of the vertices, the edges as pairs of vertices and the
// triangles as triples of edges (indices start at 1). The simplices are
// inserted in the order of the file, as in the reference implementation.
export function parseGTS(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0 && !/^\s*[#!]/.test(l));
  const [nv, ne, nt] = lines[0].trim().split(/\s+/).slice(0, 3).map(Number);
  const K = new SimplicialComplex();
  for (let i = 0; i < nv; i++) {
    const p = lines[1 + i].trim().split(/\s+/).map(Number);
    K.setPoint(i, [p[0], p[1], p[2]]);
    K.insert([i]);
  }
  const edges = [];
  for (let i = 0; i < ne; i++) {
    const e = lines[1 + nv + i].trim().split(/\s+/).map((x) => Number(x) - 1).sort((a, b) => a - b);
    edges.push(e);
    K.insert(e);
  }
  for (let i = 0; i < nt; i++) {
    const es = lines[1 + nv + ne + i].trim().split(/\s+/).slice(0, 3).map((x) => edges[Number(x) - 1]);
    const vs = [...new Set([...es[0], ...es[1], ...es[2]])].sort((a, b) => a - b);
    if (vs.length === 3) K.insert(vs);
  }
  return K;
}
