// Applet: multiparameter discrete Morse theory. Interface and display.
// The computations are in mdm-core.js.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as MDM from "./mdm-core.js";
import { compile } from "./expr.js";
import { CLOUD_STRINGS, saveCanvasPNG } from "/applets/cloud.js";

const DOI = "https://doi.org/10.12775/TMNA.2025.020";
const DOI_JACT = "https://doi.org/10.1007/s41468-024-00176-7";
const GTS_URL = "https://gts.sourceforge.net/samples.html";

const STRINGS = {
  fr: {
    docTitle: "Théorie de Morse discrète multiparamètre – Guillaume Brouillette",
    title: "Théorie de Morse discrète multiparamètre",
    lead: "Cette applette exécute l'algorithme <span class=\"font-monospace\">GenerateMDM</span> sur un complexe simplicial muni d'une fonction de multifiltration <i>f</i>. Il affiche le champ gradient de la fonction de Morse discrète multiparamètre obtenue, ses simplexes critiques, ses composantes critiques ainsi que l'ensemble de Pareto de <i>f</i>.",
    presetLabel: "Exemples de l'article",
    presetNone: "Choix libre",
    dimLabel: "Dimension",
    dim3: "3D",
    dim2: "2D",
    fileName: "morse-discrete-multiparametre",
    complexLabel: "Complexe simplicial <i>K</i>",
    funcLabel: "Fonction <i>f</i> sur les sommets",
    funcHelp: "Variables <i>x</i>, <i>y</i>, <i>z</i>. Par exemple&nbsp;: <span class=\"font-monospace\">abs(x)</span>, <span class=\"font-monospace\">x^2 + y^2</span>, <span class=\"font-monospace\">sqrt(z)</span>. Un champ vide retire la composante. Le champ <i>f</i><sub>3</sub> apparaît lorsque <i>f</i><sub>2</sub> est rempli.",
    errSyntax: "Expression non valide (position {pos}).",
    errUnknown: "Nom inconnu : {name}.",
    errArity: "Nombre d'arguments incorrect pour {name}.",
    errUndefined: "La fonction n'est pas définie en tout sommet.",
    errEmpty: "La première composante est requise.",
    fallbackUsed: "Expression utilisée :",
    fallbackNone: "La composante est ignorée.",
    gtsSource: "Maillage tiré des fichiers d'exemples de la",
    notComputed: "non calculé, trop de simplexes critiques",
    indexLabel: "Index <i>I</i>",
    viewLabel: "Affichage",
    showArrows: "Champ gradient",
    showEdges: "Arêtes de la triangulation",
    showAxes: "Axes",
    resetView: "Recentrer la vue",
    groupSurfaces: "Surfaces",
    groupGTS: "Bibliothèque GTS",
    groupPlanar: "Complexes plans",
    cSphere: "Sphère (15 parallèles, 20 méridiens)",
    cTorus: "Tore (16 × 20)",
    cIco: "Sphère icosaédrique",
    cOcta: "Sphère octaédrique",
    cCube: "Sphère cubique",
    cPaper: "Carré de la figure 4",
    cSquare: "Carré (grille 10 × 10)",
    cDisc: "Disque",
    cAnnulus: "Couronne",
    iInsertion: "ordre d'insertion des simplexes",
    iInc: "croissant selon",
    iDec: "décroissant selon",
    iRandom: "aléatoire",
    seedLabel: "Germe",
    seedTitle: "Germe du générateur aléatoire. Une autre valeur donne un autre index.",
    vGradient: "Simplexes critiques",
    vCompG: "Composantes critiques (relation ∼g)",
    vCompGp: "Composantes critiques (relation ∼′g)",
    vCompF: "Composantes critiques (relation ∼f)",
    vPareto: "Ensemble de Pareto : simplexes primaires",
    vParetoComp: "Ensemble de Pareto : composantes connexes",
    vFunction: "Fonction",
    computing: "Calcul en cours…",
    loading: "Chargement du jeu de données…",
    loadError: "Le jeu de données n'a pas pu être chargé.",
    done: "Calcul effectué en",
    ms: "ms",
    hint3: "Glisser pour tourner, molette pour zoomer, clic droit pour déplacer.",
    hint2: "Glisser pour déplacer, molette pour zoomer.",
    hint3Touch: "Glisser pour tourner, pincer pour zoomer, glisser à deux doigts pour déplacer.",
    hint2Touch: "Glisser pour déplacer, pincer pour zoomer.",
    statsTitle: "Résultats",
    valuesTitle: "Valeurs de <i>f</i> et de <i>g</i>",
    thDim: "Dimension <i>p</i>",
    thSimplices: "Simplexes",
    thCritical: "Critiques",
    thPercent: "%",
    thBound: "Minimum",
    total: "Total",
    sLevels: "Ensembles de niveau de <i>f</i>",
    sCritCompG: "Composantes critiques de <i>g</i> pour ∼<sub><i>g</i></sub>",
    sCritCompGp: "Composantes critiques de <i>g</i> pour ∼′<sub><i>g</i></sub>",
    sCritCompF: "Composantes critiques de <i>g</i> pour ∼<sub><i>f</i></sub>",
    sParetoComp: "Composantes connexes de l'ensemble de Pareto de <i>f</i>",
    sPerfectYes: "Le champ gradient est parfait relativement à <i>f</i>.",
    sPerfectNo: "Le champ gradient n'est pas parfait relativement à <i>f</i> : il possède des simplexes critiques excédentaires dans {n} composante(s) d'ensembles de niveau.",
    sDelta: "Paramètre δ",
    thSimplex: "Simplexe",
    thI: "<i>I</i>",
    thF: "<i>f</i>",
    thG: "<i>g</i>",
    thStatus: "Statut",
    stCritical: "critique",
    stTail: "apparié avec",
    lCritical: "simplexe critique",
    lArrow: "vecteur du champ gradient",
    lPrimary: "simplexe de Pareto primaire",
    lPareto: "autre simplexe de Pareto",
    lComponents: "une couleur par composante",
    lLow: "valeur minimale",
    lHigh: "valeur maximale",
    notesInputTitle: "Données",
    notesInput: "Le complexe <i>K</i> est un complexe plan (2D) ou une surface triangulée de l'espace (3D). Chaque composante de la fonction est une expression en les coordonnées <i>x</i>, <i>y</i> et <i>z</i> des sommets, écrite avec les opérations <span class=\"font-monospace\">+ - * / ^</span>, les parenthèses et des fonctions usuelles comme <span class=\"font-monospace\">abs</span>, <span class=\"font-monospace\">sqrt</span>, <span class=\"font-monospace\">exp</span>, <span class=\"font-monospace\">ln</span>, <span class=\"font-monospace\">sin</span>, <span class=\"font-monospace\">cos</span>, <span class=\"font-monospace\">min</span> et <span class=\"font-monospace\">max</span>. Lorsqu'une expression n'est pas valide, la dernière expression valide de la même composante est utilisée. La fonction est ensuite étendue à tous les simplexes par le maximum : <i>f</i><sub><i>i</i></sub>(σ) est la plus grande valeur de <i>f</i><sub><i>i</i></sub> sur les sommets de σ. On obtient ainsi une fonction de multifiltration <i>f</i> : <i>K</i> → ℝ<sup><i>k</i></sup>, avec <i>k</i> = 1, 2 ou 3. L'index <i>I</i> ordonne les simplexes et sert à départager ceux qui peuvent être traités au même moment par l'algorithme.",
    notesOutputTitle: "Résultats",
    notesOutput: "L'algorithme <span class=\"font-monospace\">GenerateMDM</span> traite les ensembles de niveau de <i>f</i> un à un. Il produit une fonction de Morse discrète multiparamètre <i>g</i>, qui diffère de <i>f</i> par des multiples d'un paramètre δ arbitrairement petit, ainsi que son champ gradient. Chaque flèche joint un simplexe à la coface avec laquelle il est apparié. Les simplexes qui ne sont pas appariés sont critiques. La colonne « Minimum » du tableau donne, pour chaque dimension <i>p</i>, la somme sur les ensembles de niveau <i>L</i><sub><i>u</i></sub> des rangs de H<sub><i>p</i></sub>(Cl <i>L</i><sub><i>u</i></sub>, Ex <i>L</i><sub><i>u</i></sub>), calculés à coefficients dans ℤ/2. Tout champ gradient compatible avec <i>f</i> possède au moins ce nombre de simplexes critiques de dimension <i>p</i>. Il est dit parfait relativement à <i>f</i> lorsqu'il en possède exactement ce nombre dans chaque ensemble de niveau.",
    notesViews: "L'ensemble de Pareto de <i>f</i> est formé des composantes connexes <i>C</i> d'ensembles de niveau dont l'homologie relative H(Cl <i>C</i>, Ex <i>C</i>) est non nulle. Le simplexe primaire d'une telle composante, lorsqu'il existe, est celui dont l'étoile inférieure est <i>C</i>.",
    notesComponents: `Les composantes critiques regroupent les simplexes critiques de <i>g</i> selon une relation d'équivalence. Pour la relation ∼<sub><i>g</i></sub>, introduite dans <a href="${DOI_JACT}" target="_blank" rel="noopener noreferrer">Brouillette, Allili et Kaczynski (2024)</a>, deux simplexes critiques sont reliés lorsque <i>g</i> y prend la même valeur selon au moins une composante et que l'un est connecté à l'autre par le flot du champ gradient. La relation ∼′<sub><i>g</i></sub> remplace les valeurs de <i>g</i> par celles de <i>f</i> dans la première condition. Pour la relation ∼<sub><i>f</i></sub> (définition 6.1 de l'article cité ci-dessous), deux simplexes critiques sont reliés lorsque <i>f</i> y prend la même valeur selon au moins une composante et que leurs composantes dans leurs ensembles de niveau respectifs sont adjacentes.`,
    notesRefTitle: "Référence",
    notesRef: `Les définitions, l'algorithme et les exemples proviennent de l'article G. Brouillette, <i>Analyzing multifiltering functions using multiparameter discrete Morse theory</i>, Topological Methods in Nonlinear Analysis 66(2), 2025, 597–645, <a href="${DOI}" target="_blank" rel="noopener noreferrer">doi:10.12775/TMNA.2025.020</a>. Les exemples proposés dans le premier menu reprennent des figures de cet article.`,
    notesDataTitle: "Maillages",
    notesData: `Les maillages du groupe « Bibliothèque GTS » sont les fichiers d'exemples de la bibliothèque GTS (GNU Triangulated Surface Library), distribués à l'adresse <a href="${GTS_URL}" target="_blank" rel="noopener noreferrer">gts.sourceforge.net/samples.html</a>. Ils sont repris ici sans modification.`,
  },
  en: {
    docTitle: "Multiparameter discrete Morse theory – Guillaume Brouillette",
    title: "Multiparameter discrete Morse theory",
    lead: "This applet runs the algorithm <span class=\"font-monospace\">GenerateMDM</span> on a simplicial complex endowed with a multifiltering function <i>f</i>. It displays the gradient field of the resulting multiparameter discrete Morse function, its critical simplices, its critical components and the Pareto set of <i>f</i>.",
    presetLabel: "Examples from the paper",
    presetNone: "Free choice",
    dimLabel: "Dimension",
    dim3: "3D",
    dim2: "2D",
    fileName: "multiparameter-discrete-morse",
    complexLabel: "Simplicial complex <i>K</i>",
    funcLabel: "Function <i>f</i> on the vertices",
    funcHelp: "Variables <i>x</i>, <i>y</i>, <i>z</i>. For instance: <span class=\"font-monospace\">abs(x)</span>, <span class=\"font-monospace\">x^2 + y^2</span>, <span class=\"font-monospace\">sqrt(z)</span>. An empty field removes the component. The field <i>f</i><sub>3</sub> appears once <i>f</i><sub>2</sub> is filled.",
    errSyntax: "Invalid expression (position {pos}).",
    errUnknown: "Unknown name: {name}.",
    errArity: "Wrong number of arguments for {name}.",
    errUndefined: "The function is not defined at every vertex.",
    errEmpty: "The first component is required.",
    fallbackUsed: "Expression used:",
    fallbackNone: "The component is ignored.",
    gtsSource: "Mesh taken from the sample files of the",
    notComputed: "not computed, too many critical simplices",
    indexLabel: "Indexing map <i>I</i>",
    viewLabel: "Display",
    showArrows: "Gradient field",
    showEdges: "Edges of the triangulation",
    showAxes: "Axes",
    resetView: "Reset the view",
    groupSurfaces: "Surfaces",
    groupGTS: "GTS library",
    groupPlanar: "Planar complexes",
    cSphere: "Sphere (15 parallels, 20 meridians)",
    cTorus: "Torus (16 × 20)",
    cIco: "Icosahedral sphere",
    cOcta: "Octahedral sphere",
    cCube: "Cube sphere",
    cPaper: "Square of Figure 4",
    cSquare: "Square (10 × 10 grid)",
    cDisc: "Disc",
    cAnnulus: "Annulus",
    iInsertion: "insertion order of the simplices",
    iInc: "increasing along",
    iDec: "decreasing along",
    iRandom: "random",
    seedLabel: "Seed",
    seedTitle: "Seed of the random generator. Another value gives another indexing map.",
    vGradient: "Critical simplices",
    vCompG: "Critical components (relation ∼g)",
    vCompGp: "Critical components (relation ∼′g)",
    vCompF: "Critical components (relation ∼f)",
    vPareto: "Pareto set: primary simplices",
    vParetoComp: "Pareto set: connected components",
    vFunction: "Function",
    computing: "Computing…",
    loading: "Loading the dataset…",
    loadError: "The dataset could not be loaded.",
    done: "Computed in",
    ms: "ms",
    hint3: "Drag to rotate, scroll to zoom, right-click to pan.",
    hint2: "Drag to pan, scroll to zoom.",
    hint3Touch: "Drag to rotate, pinch to zoom, drag with two fingers to pan.",
    hint2Touch: "Drag to pan, pinch to zoom.",
    statsTitle: "Results",
    valuesTitle: "Values of <i>f</i> and <i>g</i>",
    thDim: "Dimension <i>p</i>",
    thSimplices: "Simplices",
    thCritical: "Critical",
    thPercent: "%",
    thBound: "Minimum",
    total: "Total",
    sLevels: "Level sets of <i>f</i>",
    sCritCompG: "Critical components of <i>g</i> for ∼<sub><i>g</i></sub>",
    sCritCompGp: "Critical components of <i>g</i> for ∼′<sub><i>g</i></sub>",
    sCritCompF: "Critical components of <i>g</i> for ∼<sub><i>f</i></sub>",
    sParetoComp: "Connected components of the Pareto set of <i>f</i>",
    sPerfectYes: "The gradient field is perfect relatively to <i>f</i>.",
    sPerfectNo: "The gradient field is not perfect relatively to <i>f</i>: it has critical simplices in excess in {n} component(s) of level sets.",
    sDelta: "Parameter δ",
    thSimplex: "Simplex",
    thI: "<i>I</i>",
    thF: "<i>f</i>",
    thG: "<i>g</i>",
    thStatus: "Status",
    stCritical: "critical",
    stTail: "paired with",
    lCritical: "critical simplex",
    lArrow: "vector of the gradient field",
    lPrimary: "primary Pareto simplex",
    lPareto: "other Pareto simplex",
    lComponents: "one colour per component",
    lLow: "minimal value",
    lHigh: "maximal value",
    notesInputTitle: "Input",
    notesInput: "The complex <i>K</i> is a planar complex (2D) or a triangulated surface in space (3D). Each component of the function is an expression in the coordinates <i>x</i>, <i>y</i> and <i>z</i> of the vertices, written with the operations <span class=\"font-monospace\">+ - * / ^</span>, parentheses and usual functions such as <span class=\"font-monospace\">abs</span>, <span class=\"font-monospace\">sqrt</span>, <span class=\"font-monospace\">exp</span>, <span class=\"font-monospace\">ln</span>, <span class=\"font-monospace\">sin</span>, <span class=\"font-monospace\">cos</span>, <span class=\"font-monospace\">min</span> and <span class=\"font-monospace\">max</span>. When an expression is not valid, the last valid expression of the same component is used. The function is then extended to all simplices by the maximum: <i>f</i><sub><i>i</i></sub>(σ) is the largest value of <i>f</i><sub><i>i</i></sub> on the vertices of σ. This yields a multifiltering function <i>f</i> : <i>K</i> → ℝ<sup><i>k</i></sup>, with <i>k</i> = 1, 2 or 3. The indexing map <i>I</i> orders the simplices and serves as a tiebreaker when several simplices could be processed at the same time by the algorithm.",
    notesOutputTitle: "Output",
    notesOutput: "The algorithm <span class=\"font-monospace\">GenerateMDM</span> processes the level sets of <i>f</i> one by one. It outputs a multiparameter discrete Morse function <i>g</i>, which differs from <i>f</i> by multiples of an arbitrarily small parameter δ, as well as its gradient field. Each arrow joins a simplex to the coface it is paired with. The simplices that are not paired are critical. The column \"Minimum\" of the table gives, for each dimension <i>p</i>, the sum over the level sets <i>L</i><sub><i>u</i></sub> of the ranks of H<sub><i>p</i></sub>(Cl <i>L</i><sub><i>u</i></sub>, Ex <i>L</i><sub><i>u</i></sub>), computed with coefficients in ℤ/2. Any gradient field compatible with <i>f</i> has at least this number of critical simplices of dimension <i>p</i>. It is said to be perfect relatively to <i>f</i> when it has exactly this number in each level set.",
    notesViews: "The Pareto set of <i>f</i> consists of the connected components <i>C</i> of level sets whose relative homology H(Cl <i>C</i>, Ex <i>C</i>) is nonzero. The primary simplex of such a component, when it exists, is the one whose lower star is <i>C</i>.",
    notesComponents: `The critical components group the critical simplices of <i>g</i> according to an equivalence relation. For the relation ∼<sub><i>g</i></sub>, introduced in <a href="${DOI_JACT}" target="_blank" rel="noopener noreferrer">Brouillette, Allili and Kaczynski (2024)</a>, two critical simplices are related when <i>g</i> takes the same value on them for at least one component and one is connected to the other by the flow of the gradient field. The relation ∼′<sub><i>g</i></sub> replaces the values of <i>g</i> by those of <i>f</i> in the first condition. For the relation ∼<sub><i>f</i></sub> (Definition 6.1 of the paper cited below), two critical simplices are related when <i>f</i> takes the same value on them for at least one component and their components in their respective level sets are adjacent.`,
    notesRefTitle: "Reference",
    notesRef: `The definitions, the algorithm and the examples come from the paper G. Brouillette, <i>Analyzing multifiltering functions using multiparameter discrete Morse theory</i>, Topological Methods in Nonlinear Analysis 66(2), 2025, 597–645, <a href="${DOI}" target="_blank" rel="noopener noreferrer">doi:10.12775/TMNA.2025.020</a>. The examples offered in the first menu reproduce figures of this paper.`,
    notesDataTitle: "Meshes",
    notesData: `The meshes of the group "GTS library" are the sample files of the GTS library (GNU Triangulated Surface Library), distributed at <a href="${GTS_URL}" target="_blank" rel="noopener noreferrer">gts.sourceforge.net/samples.html</a>. They are used here without modification.`,
  },
};

const t = Applet.localize(STRINGS);
const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------------------
// Catalogue of complexes, functions, indexing maps and examples
// ---------------------------------------------------------------------------

const COMPLEXES = {
  "3d": [
    { group: "groupSurfaces", id: "sphere", label: () => t("cSphere"), build: () => MDM.regularSphere(15, 20, 1) },
    { group: "groupSurfaces", id: "torus", label: () => t("cTorus"), build: () => MDM.torus(16, 20, 2, 1) },
    { group: "groupSurfaces", id: "ico", label: () => t("cIco"), build: () => MDM.icosahedralSphere(3) },
    { group: "groupSurfaces", id: "octa", label: () => t("cOcta"), build: () => MDM.octahedralSphere(3) },
    { group: "groupSurfaces", id: "cubesphere", label: () => t("cCube"), build: () => MDM.cubeSphere(3) },
    ...["seashell", "head", "tie", "space_shuttle", "x_wing", "space_station", "goblet", "epcot",
      "helix2", "sphere5", "cone", "cube", "icosa", "tetrahedron"]
      .map((name) => ({ group: "groupGTS", id: name, label: () => name, gts: name })),
  ],
  "2d": [
    { group: "groupPlanar", id: "paper", label: () => t("cPaper"), build: () => MDM.paperExample() },
    { group: "groupPlanar", id: "square", label: () => t("cSquare"), build: () => MDM.squareGrid(10) },
    { group: "groupPlanar", id: "disc", label: () => t("cDisc"), build: () => MDM.polarGrid(6, 24, 0) },
    { group: "groupPlanar", id: "annulus", label: () => t("cAnnulus"), build: () => MDM.polarGrid(5, 28, 0.4) },
  ],
};

// Expressions of some vertex maps. FIG4 takes the values of Figure 4 of the
// paper on the four vertices of the square.
const FIG4 = ["1 - x - y + 3xy", "2 - 2x - 2y + 3xy", ""];
const DEFAULT_EXPRS = ["x", "y", ""];

const AXES = ["x", "y", "z"];
const INDEXINGS = [
  { id: "insertion", dims: ["3d", "2d"], label: () => t("iInsertion"), make: (K) => MDM.indexMap(K, "insertion") },
  ...[0, 1, 2].flatMap((axis) => [1, -1].map((sign) => ({
    id: AXES[axis] + (sign > 0 ? "+" : "-"),
    dims: axis === 2 ? ["3d"] : ["3d", "2d"],
    label: () => `${sign > 0 ? t("iInc") : t("iDec")} ${AXES[axis]}`,
    make: (K) => MDM.indexMap(K, "axis", { axis, sign }),
  }))),
  { id: "random", dims: ["3d", "2d"], label: () => t("iRandom"), make: (K) => MDM.indexMap(K, "random", { seed: state.seed }) },
];

// Examples reproducing figures and tables of the paper.
const PRESETS = [
  { id: "fig4", label: "Figure 4", dim: "2d", complex: "paper", exprs: FIG4, index: "insertion", view: "gradient", arrows: true },
  { id: "fig7a", label: "Figure 7 (a)", dim: "3d", complex: "sphere", exprs: ["x", "y", ""], index: "z+", view: "pareto", arrows: false },
  { id: "fig7b", label: "Figure 7 (b)", dim: "3d", complex: "sphere", exprs: ["x", "y", ""], index: "z+", view: "gradient", arrows: true },
  { id: "fig7c", label: "Figure 7 (c)", dim: "3d", complex: "sphere", exprs: ["x", "y", ""], index: "z-", view: "gradient", arrows: true },
  { id: "fig8a", label: "Figure 8 (a)", dim: "3d", complex: "sphere", exprs: ["0", "", ""], index: "x+", view: "gradient", arrows: true },
  { id: "fig8b", label: "Figure 8 (b)", dim: "3d", complex: "sphere", exprs: ["0", "", ""], index: "y+", view: "gradient", arrows: true },
  { id: "fig10", label: "Figure 10", dim: "3d", complex: "sphere", exprs: ["x", "y", ""], index: "insertion", view: "compG", arrows: true },
  { id: "fig12a", label: "Figure 12 (a)", dim: "2d", complex: "paper", exprs: FIG4, index: "insertion", view: "compG", arrows: true },
  { id: "fig12b", label: "Figure 12 (b)", dim: "2d", complex: "paper", exprs: FIG4, index: "insertion", view: "compGp", arrows: true },
  { id: "fig13", label: "Figure 13", dim: "3d", complex: "torus", exprs: ["x", "y", ""], index: "insertion", view: "paretoComp", arrows: false },
  { id: "fig14", label: "Figure 14", dim: "3d", complex: "torus", exprs: ["x", "y", ""], index: "insertion", view: "compGp", arrows: true },
  { id: "fig15a", label: "Figure 15 (a)", dim: "3d", complex: "seashell", exprs: ["y", "z", ""], index: "insertion", view: "paretoComp", arrows: false },
  { id: "fig15b", label: "Figure 15 (b)", dim: "3d", complex: "seashell", exprs: ["y", "z", ""], index: "insertion", view: "compF", arrows: false },
  { id: "fig16a", label: "Figure 16 (a)", dim: "3d", complex: "head", exprs: ["x", "z", ""], index: "insertion", view: "paretoComp", arrows: false },
  { id: "fig16b", label: "Figure 16 (b)", dim: "3d", complex: "head", exprs: ["x", "z", ""], index: "insertion", view: "compF", arrows: false },
  { id: "tab1", label: "Table 1 (space_shuttle)", dim: "3d", complex: "space_shuttle", exprs: ["abs(x)", "abs(y)", ""], index: "insertion", view: "gradient", arrows: false },
  { id: "tab2", label: "Table 2 (torus)", dim: "3d", complex: "torus", exprs: ["0", "", ""], index: "insertion", view: "gradient", arrows: true },
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const DEFAULT_SEED = 2025;
const state = {
  dim: "3d", complex: "sphere", exprs: ["x", "y", ""], index: "insertion", view: "gradient",
  arrows: true, edges: true, axes: true,
  seed: DEFAULT_SEED, // seed of the random indexing map
};
// Last valid expression of each component, used when a field is not valid.
let validExprs = ["x", "y", ""];
let current = null;          // { K, F, I, mdm, an, values, ms }
let startPreset = null;      // example shown when the page opens
const complexCache = new Map();

async function getComplex(dim, id) {
  const key = dim + ":" + id;
  if (complexCache.has(key)) return complexCache.get(key);
  const entry = COMPLEXES[dim].find((c) => c.id === id);
  let K;
  if (entry.gts) {
    setStatus(t("loading"));
    const res = await fetch(`data/${entry.gts}.gts`);
    if (!res.ok) throw new Error("fetch");
    K = MDM.parseGTS(await res.text());
  } else {
    K = entry.build();
  }
  complexCache.set(key, K);
  return K;
}

// Compile an expression and check that it is finite at every vertex of K.
function usable(text, K) {
  const res = compile(text);
  if (res.error) return { error: res.error };
  for (const p of K.points) {
    if (p && !Number.isFinite(res.fn(p[0], p[1], p[2]))) return { error: { code: "undefined" } };
  }
  return { fn: res.fn };
}

// Components of the function for the three fields. A field that is not valid
// falls back on the last valid expression of the same component, then on the
// default one. Returns the components in use and the error of each field.
function resolveFunction(K) {
  const comps = [], errors = [null, null, null];
  for (let i = 0; i < 3; i++) {
    const text = state.exprs[i].trim();
    if (text === "" && i > 0) { validExprs[i] = ""; continue; }
    let res = usable(text, K);
    let expr = text;
    if (res.error) {
      errors[i] = { ...res.error, fallback: "" };
      for (const candidate of [validExprs[i], DEFAULT_EXPRS[i]]) {
        if (candidate === "") continue;
        res = usable(candidate, K);
        if (!res.error) { expr = candidate; errors[i].fallback = candidate; break; }
      }
      if (res.error) continue;
    } else {
      validExprs[i] = text;
    }
    comps.push({ expr, fn: res.fn, slot: i });
  }
  return { comps, errors };
}

function showFunctionErrors(errors) {
  errors.forEach((err, i) => {
    const input = $("f" + i), box = $("f" + i + "err");
    input.classList.toggle("is-invalid", !!err);
    if (!err) { box.textContent = ""; return; }
    const key = { syntax: "errSyntax", unknown: "errUnknown", arity: "errArity", undefined: "errUndefined", empty: "errEmpty" }[err.code];
    let msg = t(key).replace("{pos}", (err.pos || 0) + 1).replace("{name}", err.name || "");
    msg += " " + (err.fallback ? `${t("fallbackUsed")} ${err.fallback}.` : t("fallbackNone"));
    box.textContent = msg;
  });
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

function fillSelect(select, items, selected) {
  select.innerHTML = "";
  let group = null, parent = select;
  for (const item of items) {
    if (item.group && item.group !== group) {
      group = item.group;
      parent = document.createElement("optgroup");
      parent.label = t(group);
      select.appendChild(parent);
    }
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = typeof item.label === "function" ? item.label() : item.label;
    parent.appendChild(opt);
  }
  select.value = selected;
  if (select.value !== selected) select.selectedIndex = 0;
  return select.value;
}

const SUBSCRIPT = ["₁", "₂", "₃"];

function viewItems() {
  const items = [
    { id: "gradient", label: t("vGradient") },
    { id: "compG", label: t("vCompG") },
    { id: "compGp", label: t("vCompGp") },
    { id: "compF", label: t("vCompF") },
    { id: "pareto", label: t("vPareto") },
    { id: "paretoComp", label: t("vParetoComp") },
  ];
  const comps = current ? current.comps : [];
  comps.forEach((c, i) => {
    const expr = c.expr.length > 22 ? c.expr.slice(0, 21) + "…" : c.expr;
    items.push({ id: "f" + i, label: `${t("vFunction")} f${SUBSCRIPT[i]} = ${expr}` });
  });
  return items;
}

// Controls shown only when they apply: the third component once the second
// one is used, and the seed for the random indexing map.
function syncVisibility() {
  $("f2wrap").hidden = $("f1").value.trim() === "" && $("f2").value.trim() === "";
  const random = state.index === "random";
  $("seed-label").hidden = !random;
  $("seed-input").hidden = !random;
}

function syncControls() {
  document.querySelector(`input[name="dim"][value="${state.dim}"]`).checked = true;
  state.complex = fillSelect($("complex"), COMPLEXES[state.dim], state.complex);
  for (let i = 0; i < 3; i++) $("f" + i).value = state.exprs[i];
  state.index = fillSelect($("index"), INDEXINGS.filter((i) => i.dims.includes(state.dim)), state.index);
  state.view = fillSelect($("view"), viewItems(), state.view);
  $("showArrows").checked = state.arrows;
  $("showEdges").checked = state.edges;
  $("showAxes").checked = state.axes;
  $("seed-input").value = String(state.seed);
  syncVisibility();
}

function clearPreset() {
  $("preset").value = "";
}

function initControls() {
  fillSelect($("preset"), [{ id: "", label: t("presetNone") }, ...PRESETS], "");
  syncControls();

  $("preset").addEventListener("change", () => {
    const p = PRESETS.find((x) => x.id === $("preset").value);
    if (!p) return;
    const refit = p.dim !== state.dim || p.complex !== state.complex;
    Object.assign(state, { dim: p.dim, complex: p.complex, exprs: p.exprs.slice(), index: p.index, view: p.view, arrows: p.arrows });
    validExprs = p.exprs.slice();
    syncControls();
    update(refit);
  });
  document.querySelectorAll('input[name="dim"]').forEach((el) => el.addEventListener("change", () => {
    state.dim = el.value;
    state.complex = COMPLEXES[state.dim][0].id;
    clearPreset(); syncControls(); update(true);
  }));
  $("complex").addEventListener("change", () => {
    state.complex = $("complex").value;
    clearPreset(); syncControls(); update(true);
  });
  // Function fields: recompute when a field is left or Enter is pressed, and
  // shortly after the last keystroke.
  let typingTimer = null;
  const applyFunctions = () => {
    clearTimeout(typingTimer);
    const exprs = [0, 1, 2].map((i) => $("f" + i).value);
    if (exprs.every((e, i) => e === state.exprs[i])) return;
    state.exprs = exprs;
    clearPreset(); update(false);
  };
  for (let i = 0; i < 3; i++) {
    $("f" + i).addEventListener("change", applyFunctions);
    $("f" + i).addEventListener("keydown", (ev) => { if (ev.key === "Enter") applyFunctions(); });
    $("f" + i).addEventListener("input", () => {
      syncVisibility();
      clearTimeout(typingTimer);
      typingTimer = setTimeout(applyFunctions, 900);
    });
  }
  $("index").addEventListener("change", () => {
    state.index = $("index").value;
    clearPreset(); syncVisibility(); update(false);
  });
  $("seed-input").addEventListener("change", () => {
    const text = $("seed-input").value.trim();
    const value = Number(text);
    if (text !== "" && Number.isInteger(value) && value >= 0) {
      state.seed = Math.min(value, 999999);
      clearPreset(); update(false);
    }
    $("seed-input").value = String(state.seed);
  });
  $("view").addEventListener("change", () => {
    state.view = $("view").value;
    clearPreset(); draw();
  });
  for (const [id, key] of [["showArrows", "arrows"], ["showEdges", "edges"]]) {
    $(id).addEventListener("change", () => { state[key] = $(id).checked; draw(); });
  }
  $("showAxes").addEventListener("change", () => { state.axes = $("showAxes").checked; requestRender(); });
  $("resetView").addEventListener("click", () => { fitCamera(); requestRender(); });

  // Reset and download, with the labels shared by all the applettes.
  $("resetAll").textContent = CLOUD_STRINGS[Applet.lang].resetLabel;
  $("download").textContent = CLOUD_STRINGS[Applet.lang].downloadLabel;
  $("resetAll").addEventListener("click", resetAll);
  $("download").addEventListener("click", () => {
    if (!camera || !current) return;
    render();
    saveCanvasPNG(renderer.domElement, `${t("fileName")}-${state.dim}.png`);
  });
}

// Back to the example shown when the page opens, with the default options.
function resetAll() {
  Object.assign(state, {
    dim: startPreset.dim, complex: startPreset.complex, exprs: startPreset.exprs.slice(),
    index: startPreset.index, view: startPreset.view, arrows: startPreset.arrows,
    edges: true, axes: true, seed: DEFAULT_SEED,
  });
  validExprs = startPreset.exprs.slice();
  syncControls();
  $("preset").value = startPreset.id;
  update(true);
}

function setStatus(text) {
  $("status").textContent = text;
}

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

// Touch screens get their own hints for moving the figure.
const TOUCH = window.matchMedia("(pointer: coarse)").matches;

let runId = 0;

async function update(refit) {
  const id = ++runId;
  setStatus(t("computing"));
  // A timer, not requestAnimationFrame, so that the computation also runs
  // when the page is in a background tab.
  await new Promise((resolve) => setTimeout(resolve, 30));
  let K;
  try {
    K = await getComplex(state.dim, state.complex);
  } catch (e) {
    setStatus(t("loadError"));
    return;
  }
  if (id !== runId) return;
  setStatus(t("computing"));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const t0 = performance.now();
  const { comps, errors } = resolveFunction(K);
  const values = K.points.map((p) => comps.map((c) => c.fn(p[0], p[1], p[2])));
  const F = MDM.prepareFunction(K, values);
  const I = INDEXINGS.find((x) => x.id === state.index).make(K);
  const mdm = MDM.generateMDM(K, F, I);
  const an = MDM.analyse(K, F, mdm);
  const flow = MDM.flowComponents(K, F, mdm);
  const ms = performance.now() - t0;
  if (id !== runId) return;

  current = { K, F, I, mdm, an, flow, comps, values, ms, dim: state.dim };
  showFunctionErrors(errors);
  if (!flow && (state.view === "compG" || state.view === "compGp")) state.view = "compF";
  state.view = fillSelect($("view"), viewItems(), state.view);
  for (const opt of $("view").options) {
    opt.disabled = !flow && (opt.value === "compG" || opt.value === "compGp");
  }
  const entry = COMPLEXES[state.dim].find((c) => c.id === state.complex);
  $("source").innerHTML = entry.gts
    ? `${t("gtsSource")} <a href="${GTS_URL}" target="_blank" rel="noopener noreferrer">GNU Triangulated Surface Library</a> (${entry.gts}.gts).`
    : "";
  if (refit || !camera) setupCamera();
  draw();
  showResults();
  setStatus(`${t("done")} ${Math.round(ms)} ${t("ms")}. ${t((state.dim === "3d" ? "hint3" : "hint2") + (TOUCH ? "Touch" : ""))}`);
}

// ---------------------------------------------------------------------------
// Display (Three.js)
// ---------------------------------------------------------------------------

const viewport = $("viewport");
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0xffffff);
viewport.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 2.1));
const headlight = new THREE.DirectionalLight(0xffffff, 1.5);
let camera = null, controls = null, content = null;
let bounds = { centre: new THREE.Vector3(), radius: 1 };

// Orientation triad drawn in the lower left corner of the viewport.
const triadScene = new THREE.Scene();
const triadCamera = new THREE.OrthographicCamera(-1.7, 1.7, 1.7, -1.7, -10, 10);
const triadParts = [];
function buildTriad() {
  const cols = ["#c62828", "#2e7d32", "#1565c0"];
  for (let a = 0; a < 3; a++) {
    const group = new THREE.Group();
    const end = [0, 0, 0]; end[a] = 1;
    const tip = [0, 0, 0]; tip[a] = 1.3;
    const c = new THREE.Color(cols[a]);
    group.add(segmentsMesh(new THREE.CylinderGeometry(1, 1, 1, 10), [{ a: [0, 0, 0], b: end, r: 0.045, c }], false));
    group.add(segmentsMesh(new THREE.ConeGeometry(1, 1, 12), [{ a: end, b: tip, r: 0.13, c }], false));
    const label = textSprite(AXES[a], 0.62);
    const lp = [0, 0, 0]; lp[a] = 1.52;
    label.position.fromArray(lp);
    group.add(label);
    triadScene.add(group);
    triadParts.push(group);
  }
}

function render() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, w, h);
  renderer.render(scene, camera);
  if (!state.axes) return;
  if (triadParts.length === 0) buildTriad();
  triadParts[2].visible = current.dim === "3d";
  const size = Math.round(Math.min(120, 0.3 * Math.min(w, h)));
  triadCamera.position.copy(camera.position).sub(controls.target).normalize().multiplyScalar(5);
  triadCamera.quaternion.copy(camera.quaternion);
  triadCamera.updateMatrixWorld();
  renderer.setScissorTest(true);
  renderer.setScissor(0, 0, size, size);
  renderer.setViewport(0, 0, size, size);
  renderer.autoClear = false;
  renderer.clearDepth();
  renderer.render(triadScene, triadCamera);
  renderer.autoClear = true;
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, w, h);
}

let renderQueued = false;
function requestRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    if (camera && current) render();
  });
}

function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  if (w === 0 || h === 0) return;
  renderer.setSize(w, h, false);
  renderer.domElement.style.width = w + "px";
  renderer.domElement.style.height = h + "px";
  if (camera) {
    if (camera.isPerspectiveCamera) {
      camera.aspect = w / h;
    } else {
      // The bounding sphere fits the narrower side of the view.
      const half = (bounds.radius * 1.15) / Math.min(1, w / h);
      camera.left = -half * (w / h); camera.right = half * (w / h);
      camera.top = half; camera.bottom = -half;
    }
    camera.updateProjectionMatrix();
  }
  requestRender();
}
new ResizeObserver(resize).observe(viewport);

function computeBounds(K) {
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  for (const p of K.points) if (p) box.expandByPoint(v.set(p[0], p[1], p[2]));
  const centre = box.getCenter(new THREE.Vector3());
  let radius = 0;
  for (const p of K.points) if (p) radius = Math.max(radius, v.set(p[0], p[1], p[2]).distanceTo(centre));
  bounds = { centre, radius: radius || 1 };
}

function setupCamera() {
  computeBounds(current.K);
  if (controls) controls.dispose();
  if (camera) camera.remove(headlight);
  if (camera) scene.remove(camera);
  if (current.dim === "3d") {
    camera = new THREE.PerspectiveCamera(35, 1, bounds.radius / 100, bounds.radius * 100);
    camera.up.set(0, 0, 1);
  } else {
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -bounds.radius * 10, bounds.radius * 10);
    camera.up.set(0, 1, 0);
  }
  camera.add(headlight);
  headlight.position.set(0.4, 0.6, 1);
  scene.add(camera);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  if (current.dim === "2d") {
    controls.enableRotate = false;
    controls.screenSpacePanning = true;
    controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
    controls.touches.ONE = THREE.TOUCH.PAN;
  }
  controls.addEventListener("change", requestRender);
  resize();
  fitCamera();
}

function fitCamera() {
  if (!camera) return;
  const c = bounds.centre, R = bounds.radius;
  controls.target.copy(c);
  if (camera.isPerspectiveCamera) {
    const dir = new THREE.Vector3(-0.85, -1.6, 0.95).normalize();
    // Distance at which the bounding sphere fits the narrower side of the view.
    const halfV = THREE.MathUtils.degToRad(camera.fov / 2);
    const halfH = Math.atan(Math.tan(halfV) * camera.aspect);
    const distance = (R * 1.17) / Math.sin(Math.min(halfV, halfH));
    camera.position.copy(c).addScaledVector(dir, distance);
  } else {
    camera.position.set(c.x, c.y, c.z + R * 5);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
  }
  controls.update();
}

// --- Colours -----------------------------------------------------------------

const COL = {
  face: "#d9d9d6",
  wire: "#8a8a86",
  critical: "#d32f2f",
  arrow: "#1b1b1b",
  primary: "#1f6fb4",
  pareto: "#d32f2f",
};
const PALETTE = ["#2ca02c", "#d32f2f", "#1f6fb4", "#9467bd", "#ff7f0e", "#17becf",
  "#8c564b", "#e377c2", "#bcbd22", "#3b4cc0", "#f6c343", "#00796b"];
const RAMP = ["#440154", "#3b528b", "#21918c", "#5ec962", "#fde725"]; // viridis

const colourCache = new Map();
function colour(hex) {
  let c = colourCache.get(hex);
  if (!c) { c = new THREE.Color(hex); colourCache.set(hex, c); }
  return c;
}
function tint(hex, amount = 0.5) {
  const key = hex + "|" + amount;
  let c = colourCache.get(key);
  if (!c) { c = new THREE.Color(hex).lerp(new THREE.Color("#ffffff"), amount); colourCache.set(key, c); }
  return c;
}
const rampColours = RAMP.map((h) => new THREE.Color(h));
function ramp(x, out) {
  const s = Math.min(Math.max(x, 0), 1) * (rampColours.length - 1);
  const i = Math.min(Math.floor(s), rampColours.length - 2);
  return out.copy(rampColours[i]).lerp(rampColours[i + 1], s - i);
}

// Colour of each simplex in the current view: null when the simplex is not
// highlighted.
function highlightColours() {
  const { K, mdm, an } = current;
  const n = K.size;
  const out = new Array(n).fill(null);
  const order = (sizes) => {
    // Larger components first, so that they receive the most distinct colours.
    const idx = sizes.map((s, i) => i).sort((a, b) => sizes[b] - sizes[a]);
    const rankOf = new Array(sizes.length);
    idx.forEach((label, pos) => { rankOf[label] = pos; });
    return rankOf;
  };
  if (state.view === "gradient") {
    for (let id = 0; id < n; id++) if (mdm.pair[id] === id) out[id] = COL.critical;
  } else if (state.view === "compF" || state.view === "compG" || state.view === "compGp") {
    const flow = current.flow;
    let labels = null, sizes = null;
    if (state.view === "compF") { labels = an.critLabel; sizes = an.critSizes; }
    else if (flow && state.view === "compG") { labels = flow.gLabel; sizes = flow.gSizes; }
    else if (flow) { labels = flow.gpLabel; sizes = flow.gpSizes; }
    if (labels) {
      const rankOf = order(sizes);
      for (let id = 0; id < n; id++) {
        if (labels[id] >= 0) out[id] = PALETTE[rankOf[labels[id]] % PALETTE.length];
      }
    }
  } else if (state.view === "pareto") {
    for (let id = 0; id < n; id++) {
      if (an.paretoType[id] === 2) out[id] = COL.primary;
      else if (an.paretoType[id] === 1) out[id] = COL.pareto;
    }
  } else if (state.view === "paretoComp") {
    const rankOf = order(an.paretoSizes);
    for (let id = 0; id < n; id++) {
      if (an.paretoLabel[id] >= 0) out[id] = PALETTE[rankOf[an.paretoLabel[id]] % PALETTE.length];
    }
  }
  return out;
}

// --- Geometry helpers ----------------------------------------------------------

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion();
const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpD = new THREE.Vector3(), tmpS = new THREE.Vector3();

// Instanced mesh of unit shapes aligned on the y-axis, one per segment
// (a, b, radius, colour): cylinders from a to b, or cones with apex at b.
function segmentsMesh(geometry, segments, lit) {
  const material = lit
    ? new THREE.MeshLambertMaterial()
    : new THREE.MeshBasicMaterial();
  const mesh = new THREE.InstancedMesh(geometry, material, segments.length);
  segments.forEach((s, i) => {
    tmpA.fromArray(s.a); tmpB.fromArray(s.b);
    tmpD.subVectors(tmpB, tmpA);
    const len = tmpD.length() || 1e-9;
    tmpQ.setFromUnitVectors(Y_AXIS, tmpD.multiplyScalar(1 / len));
    tmpA.add(tmpB).multiplyScalar(0.5);
    tmpM.compose(tmpA, tmpQ, tmpS.set(s.r, len, s.r));
    mesh.setMatrixAt(i, tmpM);
    mesh.setColorAt(i, s.c);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

function spheresMesh(geometry, items, lit) {
  const material = lit ? new THREE.MeshLambertMaterial() : new THREE.MeshBasicMaterial();
  const mesh = new THREE.InstancedMesh(geometry, material, items.length);
  items.forEach((s, i) => {
    tmpM.compose(tmpA.fromArray(s.p), tmpQ.identity(), tmpS.set(s.r, s.r, s.r));
    mesh.setMatrixAt(i, tmpM);
    mesh.setColorAt(i, s.c);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

function textSprite(text, size) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.font = "italic 44px Georgia, serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#333";
  ctx.fillText(text, 32, 34);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false }));
  sprite.scale.set(size, size, size);
  return sprite;
}

function disposeContent() {
  if (!content) return;
  content.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      if (o.material.map) o.material.map.dispose();
      o.material.dispose();
    }
  });
  scene.remove(content);
  content = null;
}

// --- Drawing -------------------------------------------------------------------

function draw() {
  if (!current) return;
  const { K, F, mdm } = current;
  const lit = current.dim === "3d";
  const n = K.size;
  disposeContent();
  content = new THREE.Group();
  scene.add(content);

  const highlight = highlightColours();
  const funcView = state.view.startsWith("f") && state.view.length === 2 ? Number(state.view[1]) : -1;

  // Sizes relative to the mesh.
  let edgeSum = 0, edgeCount = 0;
  const triangles = [], edges = [], vertices = [];
  for (let id = 0; id < n; id++) {
    const vs = K.simplices[id];
    if (vs.length === 3) triangles.push(id);
    else if (vs.length === 2) {
      edges.push(id);
      const a = K.points[vs[0]], b = K.points[vs[1]];
      edgeSum += Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); edgeCount++;
    } else vertices.push(id);
  }
  const R = bounds.radius;
  const meanEdge = edgeCount ? edgeSum / edgeCount : R;
  const rVertex = Math.min(Math.max(0.11 * meanEdge, 0.004 * R), 0.035 * R);
  const rEdge = 0.5 * rVertex;
  const rShaft = 0.2 * rVertex;

  // Triangles.
  if (triangles.length > 0) {
    const pos = new Float32Array(triangles.length * 9);
    const col = new Float32Array(triangles.length * 9);
    const c = new THREE.Color();
    const base = colour(COL.face);
    let lo = 0, span = 1;
    if (funcView >= 0) {
      const vals = F.values[funcView];
      lo = vals[0]; span = (vals[vals.length - 1] - vals[0]) || 1;
    }
    triangles.forEach((id, ti) => {
      const vs = K.simplices[id];
      for (let j = 0; j < 3; j++) {
        const p = K.points[vs[j]];
        pos.set(p, ti * 9 + j * 3);
        if (funcView >= 0) ramp((current.values[vs[j]][funcView] - lo) / span, c);
        else if (highlight[id]) c.copy(tint(highlight[id], 0.45));
        else c.copy(base);
        col[ti * 9 + j * 3] = c.r; col[ti * 9 + j * 3 + 1] = c.g; col[ti * 9 + j * 3 + 2] = c.b;
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const matOpts = {
      vertexColors: true, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
    };
    const mat = lit
      ? new THREE.MeshLambertMaterial({ ...matOpts, flatShading: true })
      : new THREE.MeshBasicMaterial(matOpts);
    content.add(new THREE.Mesh(geo, mat));
  }

  // Edges of the triangulation.
  if (state.edges && edges.length > 0) {
    const pos = new Float32Array(edges.length * 6);
    edges.forEach((id, ei) => {
      const vs = K.simplices[id];
      pos.set(K.points[vs[0]], ei * 6);
      pos.set(K.points[vs[1]], ei * 6 + 3);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const opacity = funcView >= 0 ? 0.35 : 0.8;
    content.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: COL.wire, transparent: true, opacity })));
  }

  // Highlighted edges and vertices.
  const unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 8, 1, false);
  const unitSphere = new THREE.SphereGeometry(1, 12, 8);
  const tubeSegs = [];
  for (const id of edges) {
    if (!highlight[id]) continue;
    const vs = K.simplices[id];
    tubeSegs.push({ a: K.points[vs[0]], b: K.points[vs[1]], r: rEdge, c: colour(highlight[id]) });
  }
  if (tubeSegs.length > 0) content.add(segmentsMesh(unitCylinder, tubeSegs, lit));
  const balls = [];
  for (const id of vertices) {
    if (!highlight[id]) continue;
    balls.push({ p: K.points[K.simplices[id][0]], r: rVertex, c: colour(highlight[id]) });
  }
  if (balls.length > 0) content.add(spheresMesh(unitSphere, balls, lit));

  // Gradient field: one arrow from the barycentre of each tail to the
  // barycentre of the coface it is paired with.
  if (state.arrows) {
    const shafts = [], heads = [];
    const black = colour(COL.arrow);
    const headLen0 = 1.9 * rVertex, headRad0 = 0.62 * rVertex;
    for (let id = 0; id < n; id++) {
      if (!mdm.isTail[id]) continue;
      const a = K.barycentre(id), b = K.barycentre(mdm.pair[id]);
      const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      if (len === 0) continue;
      const scale = Math.min(1, (0.55 * len) / headLen0);
      const headLen = headLen0 * scale;
      const k = (len - headLen) / len;
      const m = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
      shafts.push({ a, b: m, r: rShaft * Math.max(scale, 0.6), c: black });
      heads.push({ a: m, b, r: headRad0 * scale, c: black });
    }
    if (shafts.length > 0) {
      content.add(segmentsMesh(unitCylinder, shafts, false));
      content.add(segmentsMesh(new THREE.ConeGeometry(1, 1, 10, 1, false), heads, false));
    }
  }

  drawLegend(funcView);
  requestRender();
}

function drawLegend(funcView) {
  const items = [];
  const sw = (c) => `<span class="swatch" style="background:${c}"></span>`;
  if (funcView >= 0) {
    items.push(`<span><span class="swatch" style="width:5em;background:linear-gradient(90deg,${RAMP.join(",")})"></span>${t("lLow")} → ${t("lHigh")}</span>`);
  } else if (state.view === "gradient") {
    items.push(`<span>${sw(COL.critical)}${t("lCritical")}</span>`);
  } else if (state.view === "pareto") {
    items.push(`<span>${sw(COL.primary)}${t("lPrimary")}</span>`);
    items.push(`<span>${sw(COL.pareto)}${t("lPareto")}</span>`);
  } else {
    items.push(`<span>${PALETTE.slice(0, 5).map(sw).join("")}${t("lComponents")}</span>`);
  }
  if (state.arrows) items.push(`<span>${sw(COL.arrow)}${t("lArrow")}</span>`);
  $("legend").innerHTML = items.join("");
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

function num(x) {
  // Compact decimal, comma in French.
  const s = String(Math.round(x * 1000) / 1000);
  return Applet.lang === "fr" ? s.replace(".", ",") : s;
}

function showResults() {
  const { K, F, I, mdm, an } = current;
  const n = K.size;
  const count = K.countByDim();
  const crit = [0, 0, 0];
  for (let id = 0; id < n; id++) if (mdm.pair[id] === id) crit[K.dimOf(id)]++;
  const pct = (a, b) => (b > 0 ? Applet.fmt((100 * a) / b, 1) : "–");

  let html = `<thead><tr><th>${t("thDim")}</th><th>${t("thSimplices")}</th><th>${t("thCritical")}</th><th>${t("thPercent")}</th><th>${t("thBound")}</th></tr></thead><tbody>`;
  for (let p = 0; p < 3; p++) {
    html += `<tr><td>${p}</td><td>${count[p]}</td><td>${crit[p]}</td><td>${pct(crit[p], count[p])}</td><td>${an.betti[p]}</td></tr>`;
  }
  const sum = (a) => a[0] + a[1] + a[2];
  html += `<tr class="fw-bold"><td>${t("total")}</td><td>${n}</td><td>${sum(crit)}</td><td>${pct(sum(crit), n)}</td><td>${sum(an.betti)}</td></tr></tbody>`;
  $("stats").innerHTML = html;

  const perfect = an.nonPerfect === 0
    ? t("sPerfectYes")
    : t("sPerfectNo").replace("{n}", an.nonPerfect);
  $("summary").innerHTML = [
    `${t("sLevels")}${Applet.lang === "fr" ? "&nbsp;:" : ":"} ${F.levels.length}`,
    `${t("sCritCompG")}${Applet.lang === "fr" ? "&nbsp;:" : ":"} ${current.flow ? current.flow.gSizes.length : t("notComputed")}`,
    `${t("sCritCompGp")}${Applet.lang === "fr" ? "&nbsp;:" : ":"} ${current.flow ? current.flow.gpSizes.length : t("notComputed")}`,
    `${t("sCritCompF")}${Applet.lang === "fr" ? "&nbsp;:" : ":"} ${an.critSizes.length}`,
    `${t("sParetoComp")}${Applet.lang === "fr" ? "&nbsp;:" : ":"} ${an.paretoSizes.length}`,
    perfect,
  ].map((s) => `<li>${s}</li>`).join("");

  // Values of f and g, for small complexes only.
  const block = $("valuesBlock");
  if (n > 40) { block.hidden = true; return; }
  block.hidden = false;
  const name = (id) => {
    const vs = K.simplices[id];
    return vs.length === 1 ? `v<sub>${vs[0]}</sub>` : `{${vs.map((v) => `v<sub>${v}</sub>`).join(", ")}}`;
  };
  const fOf = (id) => {
    const parts = [];
    for (let i = 0; i < F.k; i++) parts.push(num(F.values[i][F.rank[i][id]]));
    return F.k > 1 ? `(${parts.join(Applet.lang === "fr" ? "; " : ", ")})` : parts[0];
  };
  const gOf = (id) => {
    const c = mdm.gCount[id];
    let first = num(F.values[0][mdm.gRank[id]]);
    if (c === 1) first += " + δ";
    else if (c > 1) first += ` + ${c}δ`;
    const parts = [first];
    for (let i = 1; i < F.k; i++) parts.push(num(F.values[i][F.rank[i][id]]));
    return F.k > 1 ? `(${parts.join(Applet.lang === "fr" ? "; " : ", ")})` : parts[0];
  };
  const ids = Array.from({ length: n }, (_, id) => id).sort((a, b) => I[a] - I[b]);
  let rows = `<thead><tr><th>${t("thSimplex")}</th><th>${t("thI")}</th><th>${t("thF")}</th><th>${t("thG")}</th><th>${t("thStatus")}</th></tr></thead><tbody>`;
  for (const id of ids) {
    const status = mdm.pair[id] === id
      ? `<span style="color:${COL.critical}">${t("stCritical")}</span>`
      : `${t("stTail")} ${name(mdm.pair[id])}`;
    rows += `<tr><td>${name(id)}</td><td>${I[id]}</td><td>${fOf(id)}</td><td>${gOf(id)}</td><td style="text-align:left">${status}</td></tr>`;
  }
  $("values").innerHTML = rows + "</tbody>";
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

// The link ?example=fig14 opens the applet on an example of the paper.
const wanted = new URLSearchParams(window.location.search).get("example");
startPreset = PRESETS.find((p) => p.id === wanted) || PRESETS.find((p) => p.id === "fig10");
Object.assign(state, {
  dim: startPreset.dim, complex: startPreset.complex, exprs: startPreset.exprs.slice(),
  index: startPreset.index, view: startPreset.view, arrows: startPreset.arrows,
});
validExprs = startPreset.exprs.slice();
initControls();
$("preset").value = startPreset.id;
update(true);

// Access for tests from the browser console.
window.mdmApplet = { MDM, compile, state, get current() { return current; }, update, draw, render, renderer };
