// Two simulated players used only for balance checks:
//  - randomStrategy: any legal move, uniformly (measures "pure luck").
//  - greedyStrategy: simple, readable heuristics (a stand-in for a thoughtful human).
import {
  RULES, ROWS, COLS, RIVER, RIVERSIDE, isNetwork, enterCost, roadCost, enter,
  cloneFuture, mainNetwork, finalResult, cheapestRoadsToRow, links,
} from './engine.mjs';

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

// Network adjacency: bridges link only sideways (see engine `links`).
const neighbors = links;

/** Random legal road: grow one cell at a time from the network. */
function randomRoad(future, row, steps, rng) {
  const f = cloneFuture(future);
  const path = [];
  let budget = steps;
  for (;;) {
    const frontier = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const k = enterCost(f.cells[r][c]);
        if (k !== null && k <= budget && neighbors(r, c).some(([nr, nc]) => isNetwork(f.cells[nr][nc]))) {
          frontier.push([r, c, k]);
        }
      }
    }
    if (!frontier.length) break;
    const [r, c, k] = pick(rng, frontier);
    f.cells[r][c] = 'r';
    path.push([r, c]);
    budget -= k;
  }
  return path.some(([r]) => r === row) ? path : null;
}

/** Cheapest route from a set of source cells; returns {dist, prev}. */
function dijkstra(future, sources) {
  const dist = Array.from({ length: ROWS }, () => Array(COLS).fill(Infinity));
  const prev = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const queue = [];
  for (const [r, c] of sources) { dist[r][c] = 0; queue.push([0, r, c]); }
  while (queue.length) {
    queue.sort((a, b) => a[0] - b[0]);
    const [d, r, c] = queue.shift();
    if (d > dist[r][c]) continue;
    for (const [nr, nc] of neighbors(r, c)) {
      const sym = future.cells[nr][nc];
      let k = isNetwork(sym) ? 0 : enterCost(sym);
      if (k === null) continue;
      if (d + k < dist[nr][nc]) {
        dist[nr][nc] = d + k;
        prev[nr][nc] = [r, c];
        queue.push([d + k, nr, nc]);
      }
    }
  }
  return { dist, prev };
}

function evaluate(future) {
  const res = finalResult(future);
  const main = mainNetwork(future);
  if (!main.cells.length) return res.score - 20;
  const inMain = new Set(main.cells.map(([r, c]) => `${r},${c}`));
  const { dist } = dijkstra(future, main.cells);
  let nextTown = 12;
  let cross = main.crossed ? 0 : 12;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (future.cells[r][c] === 'T' && !inMain.has(`${r},${c}`)) nextTown = Math.min(nextTown, dist[r][c]);
      const otherBank = main.west ? c > RIVER : c < RIVER;
      if (!main.crossed && otherBank) cross = Math.min(cross, dist[r][c]);
    }
  }
  return res.score - 0.8 * nextTown - 0.8 * cross;
}

/** Road candidates for the greedy player: random samples + routes toward goals. */
function roadCandidates(future, row, steps, rng) {
  // Exact cheapest roads into the row guarantee a candidate whenever one is legal.
  const out = [...cheapestRoadsToRow(future, row, steps)];
  for (let i = 0; i < 25; i++) {
    const p = randomRoad(future, row, steps, rng);
    if (p) out.push(p);
  }
  const main = mainNetwork(future);
  const sources = main.cells.length ? main.cells : [];
  if (sources.length) {
    const { dist, prev } = dijkstra(future, sources);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (dist[r][c] === Infinity || dist[r][c] === 0) continue;
        const route = [];
        for (let cur = [r, c]; cur && dist[cur[0]][cur[1]] > 0; cur = prev[cur[0]][cur[1]]) route.unshift(cur);
        const usable = route.filter(([rr, cc]) => enterCost(future.cells[rr][cc]) !== null);
        for (let n = usable.length; n > 0; n--) {
          const p = usable.slice(0, n);
          if (roadCost(future, p, row, steps) !== null) { out.push(p); break; }
        }
      }
    }
  }
  return out.filter((p) => roadCost(future, p, row, steps) !== null);
}

export function randomStrategy(rng) {
  return {
    choosePast: (past, options) => pick(rng, options),
    chooseExtra: (past, opts) => pick(rng, opts),
    chooseExtraRow: (f, rows) => pick(rng, rows),
    chooseExtraCell: (f, cells) => pick(rng, cells),
    chooseFuture(future, ctx) {
      // The engine only passes assignments that have a legal road.
      const c = pick(rng, ctx);
      for (let i = 0; i < 30; i++) {
        const path = randomRoad(future, c.row, c.steps, rng);
        if (path) return { rowDie: c.rowDie, path };
      }
      return { rowDie: c.rowDie, path: pick(rng, cheapestRoadsToRow(future, c.row, c.steps)) };
    },
  };
}

function pastBuildValue(past, build) {
  const { row, col, type } = build;
  const cells = past.cells;
  const leveed = RIVERSIDE.some((c) => cells[row][c] === 'L');
  let intactBridges = 0;
  for (let r = 0; r < ROWS; r++) if (cells[r][RIVER] === 'B' && !past.flooded[r][RIVER]) intactBridges += 1;
  if (type === 'B') return (intactBridges === 0 ? 6 : intactBridges === 1 ? 2.5 : 0.5) + (leveed ? 1 : 0);
  if (type === 'L') {
    const worth = cells[row][RIVER] === 'B' || RIVERSIDE.some((c) => cells[row][c] === 'S');
    return worth && !leveed ? 4 : 1;
  }
  let v = 4;
  const riverside = RIVERSIDE.includes(col);
  if (riverside && !leveed) v -= intactBridges === 0 && !cells[row][RIVER] ? -0.5 : 1.5;
  const west = col < RIVER;
  let w = 0;
  let e = 0;
  for (const r of cells) r.forEach((s, c) => { if (s === 'S') { if (c < RIVER) w++; else e++; } });
  if ((west && w <= e) || (!west && e <= w)) v += 1.5;
  // Prefer towns a short road apart: easier to link in the Future.
  const near = cells.some((r2, ri) => r2.some((s, ci) => s === 'S' && Math.abs(ri - row) + Math.abs(ci - col) <= 3));
  if (near) v += 0.5;
  return v;
}

function waterPenalty(past, waterDie) {
  const crosses = RULES.past.floodThresholds.some((t) => past.water < t && past.water + waterDie >= t);
  return 0.15 * waterDie + (crosses ? 2.5 : 0);
}

export function greedyStrategy(rng) {
  const bestBy = (items, score) => items.reduce((a, b) => (score(b) > score(a) ? b : a));
  return {
    choosePast: (past, options) =>
      bestBy(options, (o) => pastBuildValue(past, o.build) - waterPenalty(past, o.waterDie) + rng() * 0.01),
    chooseExtra: (past, opts) => bestBy(opts, (b) => pastBuildValue(past, b)),
    chooseExtraRow: (future, rows) => bestBy(rows, (r) => {
      const f = cloneFuture(future);
      f.cells[r][RIVER] = 'NB';
      return evaluate(f);
    }),
    chooseExtraCell: (future, cells) => bestBy(cells, ([r, c]) => {
      const f = cloneFuture(future);
      enter(f, r, c);
      return evaluate(f);
    }),
    chooseFuture(future, ctx) {
      const moves = [];
      for (const c of ctx) {
        for (const path of roadCandidates(future, c.row, c.steps, rng)) {
          const f = cloneFuture(future);
          for (const [r, col] of path) enter(f, r, col);
          moves.push({ move: { rowDie: c.rowDie, path }, value: evaluate(f) });
        }
      }
      if (!moves.length) return null;
      return bestBy(moves, (m) => m.value).move;
    },
  };
}
