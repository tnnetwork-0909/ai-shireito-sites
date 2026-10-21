// Reference rules engine for Riverkeepers. Pure functions over plain objects so
// tests and the balance simulator can replay any game from a seed.
import { readFileSync } from 'node:fs';

export const RULES = JSON.parse(
  readFileSync(new URL('../rules.json', import.meta.url), 'utf8')
);

export const ROWS = RULES.grid.rows;
export const COLS = RULES.grid.columns.length;
export const RIVER = RULES.grid.columns.indexOf(RULES.grid.riverColumn);
export const RIVERSIDE = RULES.grid.riversideColumns.map((c) => RULES.grid.columns.indexOf(c));
const LAND_COLS = [...Array(COLS).keys()].filter((c) => c !== RIVER);

export function cellName(row, col) {
  return `${RULES.grid.columns[col]}${row + 1}`;
}

export function makeRng(seed) {
  // mulberry32: tiny deterministic PRNG, good enough for dice.
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rollDie = (rng) => 1 + Math.floor(rng() * 6);

function neighbors(row, col) {
  return [
    [row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1],
  ].filter(([r, c]) => r >= 0 && r < ROWS && c >= 0 && c < COLS);
}

// Network links follow cell sides, but a river cell (bridge) links only sideways
// to C and E of its own row: Bridges stacked in column D never join each other.
export function links(row, col) {
  return neighbors(row, col).filter(([r, c]) => r === row || (c !== RIVER && col !== RIVER));
}

const grid = (fill) => Array.from({ length: ROWS }, () => Array(COLS).fill(fill));

/* ---------------- PAST ERA ---------------- */

export function newPast() {
  return {
    cells: grid(null), // null | 'S' settlement | 'L' levee | 'B' bridge
    flooded: grid(false), // flood zone (on a bridge cell: bridge is ruined)
    water: 0,
    floods: 0,
    hardship: 0,
    turn: 0,
  };
}

const bridgeCount = (past) => past.cells.reduce((n, row) => n + (row[RIVER] === 'B' ? 1 : 0), 0);

export function legalPastBuilds(past, row) {
  const out = [];
  const cells = past.cells[row];
  for (const col of LAND_COLS) {
    if (cells[col] || past.flooded[row][col]) continue;
    const touchesSettlement = neighbors(row, col).some(([r, c]) => past.cells[r][c] === 'S');
    if (!touchesSettlement) out.push({ type: 'S', row, col });
    if (RIVERSIDE.includes(col)) out.push({ type: 'L', row, col });
  }
  const bankHolder = RIVERSIDE.some((c) => cells[c] === 'S' || cells[c] === 'L');
  if (!cells[RIVER] && bankHolder && bridgeCount(past) < RULES.past.maxBridges) {
    out.push({ type: 'B', row, col: RIVER });
  }
  return out;
}

export function applyPastBuild(past, build) {
  if (!legalPastBuilds(past, build.row).some((b) => b.type === build.type && b.col === build.col)) {
    throw new Error(`Illegal past build ${build.type} at ${cellName(build.row, build.col)}`);
  }
  past.cells[build.row][build.col] = build.type;
}

export function applyFlood(past, row) {
  past.floods += 1;
  const leveed = RIVERSIDE.some((c) => past.cells[row][c] === 'L');
  for (const col of RIVERSIDE) {
    if (past.cells[row][col] !== 'L') past.flooded[row][col] = true;
  }
  if (past.cells[row][RIVER] === 'B' && !leveed) past.flooded[row][RIVER] = true;
}

export function addWater(past, amount, rng) {
  const before = past.water;
  past.water = Math.min(RULES.past.waterTrackLength, before + amount);
  for (const t of RULES.past.floodThresholds) {
    if (before < t && past.water >= t) applyFlood(past, rollDie(rng) - 1);
  }
}

/**
 * One Past turn. `strategy.choosePast(past, options)` gets every legal
 * {rowDie, waterDie, build|null} and returns one; `strategy.chooseExtra`
 * picks builds granted by events.
 */
export function playPastTurn(past, rng, strategy) {
  past.turn += 1;
  const d1 = rollDie(rng);
  const d2 = rollDie(rng);
  const pairs = d1 === d2 ? [[d1, d2]] : [[d1, d2], [d2, d1]];
  const options = [];
  for (const [rowDie, waterDie] of pairs) {
    for (const build of legalPastBuilds(past, rowDie - 1)) options.push({ rowDie, waterDie, build });
  }
  let choice;
  if (options.length === 0) {
    past.hardship += 1;
    choice = { rowDie: pairs[0][0], waterDie: Math.min(d1, d2), build: null };
  } else {
    choice = strategy.choosePast(past, options);
    applyPastBuild(past, choice.build);
  }
  let water = choice.waterDie;
  let event = null;
  if (d1 === d2) {
    const eventRule = RULES.pastEvents[rollDie(rng)];
    event = eventRule.id;
    resolvePastEvent(past, eventRule, rng, strategy);
    water = water * (eventRule.waterDieMultiplier ?? 1) + (eventRule.waterBonus ?? 0);
  }
  addWater(past, water, rng);
  return { dice: [d1, d2], choice, event };
}

function resolvePastEvent(past, eventRule, rng, strategy) {
  past.hardship += eventRule.hardship ?? 0;
  for (let i = 0; i < (eventRule.immediateFloods ?? 0); i++) applyFlood(past, rollDie(rng) - 1);
  if (eventRule.id === 'good-harvest' || eventRule.id === 'ferryman') {
    const type = eventRule.id === 'good-harvest' ? 'S' : 'B';
    for (let i = 0; i < eventRule.extraBuilds; i++) {
      const opts = [];
      for (let r = 0; r < ROWS; r++) opts.push(...legalPastBuilds(past, r).filter((b) => b.type === type));
      if (!opts.length) break;
      applyPastBuild(past, strategy.chooseExtra(past, opts));
    }
  }
}

/* ---------------- ERA TRANSITION ---------------- */

// Future sheet symbols: T town, R ruins, M marsh, = embankment, OB old bridge,
// XB broken bridge, NB new bridge, r road, '.' open land, '~' open river.
export function pastToFuture(past) {
  const cells = grid('.');
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const built = past.cells[r][c];
      const wet = past.flooded[r][c];
      if (built === 'S') cells[r][c] = wet ? 'R' : 'T';
      else if (built === 'L') cells[r][c] = '=';
      else if (built === 'B') cells[r][c] = wet ? 'XB' : 'OB';
      else if (c === RIVER) cells[r][c] = '~';
      else cells[r][c] = wet ? 'M' : '.';
    }
  }
  const drowned = !cells.flat().includes('T');
  return { cells, relics: 0, hardship: past.hardship, turn: 0, drowned };
}

/* ---------------- FUTURE ERA ---------------- */

const NETWORK = new Set(['T', 'r', '=', 'OB', 'NB']);
export const isNetwork = (sym) => NETWORK.has(sym);

export function enterCost(sym) {
  const k = RULES.future.enterCost;
  return { '.': k.empty, R: k.ruins, M: k.marsh, XB: k.brokenBridge }[sym] ?? null;
}

const touchesNetwork = (cells, row, col) => links(row, col).some(([r, c]) => isNetwork(cells[r][c]));

export function cloneFuture(f) {
  return { ...f, cells: f.cells.map((row) => row.slice()) };
}

/** Validates an ordered list of [row,col] road cells; returns total cost or null. */
export function roadCost(future, path, chosenRow, steps) {
  const cells = future.cells.map((row) => row.slice());
  let cost = 0;
  let inRow = false;
  for (const [r, c] of path) {
    const k = enterCost(cells[r][c]);
    if (k === null || !touchesNetwork(cells, r, c)) return null;
    cost += k;
    cells[r][c] = 'r';
    if (r === chosenRow) inRow = true;
  }
  return path.length > 0 && inRow && cost <= steps ? cost : null;
}

/**
 * Cheapest road cost from the network to every cell (network cells cost 0).
 * A road is legal for a row iff some enterable cell in that row has dist <= steps,
 * so this decides "is there any legal road?" exactly instead of by sampling.
 */
export function cheapestRoads(future) {
  const dist = grid(Infinity);
  const prev = grid(null);
  const queue = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (isNetwork(future.cells[r][c])) { dist[r][c] = 0; queue.push([0, r, c]); }
    }
  }
  while (queue.length) {
    queue.sort((a, b) => a[0] - b[0]);
    const [d, r, c] = queue.shift();
    if (d > dist[r][c]) continue;
    for (const [nr, nc] of links(r, c)) {
      const sym = future.cells[nr][nc];
      const k = isNetwork(sym) ? 0 : enterCost(sym);
      if (k === null || d + k >= dist[nr][nc]) continue;
      dist[nr][nc] = d + k;
      prev[nr][nc] = [r, c];
      queue.push([d + k, nr, nc]);
    }
  }
  return { dist, prev };
}

/** One cheapest legal road per reachable cell of `row` (ordered from the network outward). */
export function cheapestRoadsToRow(future, row, steps) {
  const { dist, prev } = cheapestRoads(future);
  const out = [];
  for (let c = 0; c < COLS; c++) {
    if (enterCost(future.cells[row][c]) === null || dist[row][c] > steps) continue;
    const path = [];
    for (let cur = [row, c]; cur && dist[cur[0]][cur[1]] > 0; cur = prev[cur[0]][cur[1]]) {
      if (!isNetwork(future.cells[cur[0]][cur[1]])) path.unshift(cur);
    }
    out.push(path);
  }
  return out;
}

export const hasLegalRoad = (future, row, steps) => cheapestRoadsToRow(future, row, steps).length > 0;

export function enter(future, row, col) {
  const sym = future.cells[row][col];
  if (sym === 'R') future.relics += 1;
  future.cells[row][col] = sym === 'XB' ? 'OB' : 'r';
}

// Only the Traveling Mason event builds bridges in the Future, so crossings
// mostly come from Past choices (the core hook of the game).
export function canBuildNewBridge(future, row) {
  return future.cells[row][RIVER] === '~' && RIVERSIDE.some((c) => isNetwork(future.cells[row][c]));
}

export function stepsFor(die) {
  return RULES.future.stepsByDie[String(die)];
}

/**
 * One Future turn. `strategy.chooseFuture(future, ctx)` returns
 * {rowDie, path} (a road) or null when no legal road exists.
 */
export function playFutureTurn(future, rng, strategy) {
  future.turn += 1;
  const d1 = rollDie(rng);
  const d2 = rollDie(rng);
  let event = null;
  let eventRule = null;
  if (d1 === d2) {
    eventRule = RULES.futureEvents[rollDie(rng)];
    event = eventRule.id;
    future.relics += eventRule.relics ?? 0;
    for (let i = 0; i < (eventRule.floodRows ?? 0); i++) lateFlood(future, rollDie(rng) - 1);
    if (event === 'traveling-mason') {
      for (let i = 0; i < eventRule.newBridges; i++) {
        const rows = [...Array(ROWS).keys()].filter((r) => canBuildNewBridge(future, r));
        if (!rows.length) break;
        future.cells[strategy.chooseExtraRow(future, rows)][RIVER] = 'NB';
      }
    }
    if (event === 'founders-road') {
      for (let i = 0; i < eventRule.freeRoadCells; i++) {
        const opts = [];
        for (let r = 0; r < ROWS; r++) {
          for (const c of LAND_COLS) {
            if (enterCost(future.cells[r][c]) !== null &&
                neighbors(r, c).some(([nr, nc]) => future.cells[nr][nc] === 'T')) opts.push([r, c]);
          }
        }
        if (!opts.length) break;
        const [r, c] = strategy.chooseExtraCell(future, opts);
        enter(future, r, c);
      }
    }
  }
  const pairs = d1 === d2 ? [[d1, d2]] : [[d1, d2], [d2, d1]];
  const ctx = pairs.map(([rowDie, stepDie]) => ({
    rowDie, row: rowDie - 1,
    steps: eventRule?.stepsOverride ?? (stepsFor(stepDie) + (eventRule?.stepsBonus ?? 0)),
  }));
  const legal = ctx.filter((c) => hasLegalRoad(future, c.row, c.steps));
  // Hardship only when the rules say so: no legal road with either assignment.
  const move = legal.length ? strategy.chooseFuture(future, legal) : null;
  if (legal.length && !move) throw new Error('Strategy skipped a legal road');
  if (!move) {
    future.hardship += 1;
  } else {
    const c = ctx.find((x) => x.rowDie === move.rowDie);
    if (roadCost(future, move.path, c.row, c.steps) === null) throw new Error('Illegal road');
    for (const [r, col] of move.path) enter(future, r, col);
  }
  return { dice: [d1, d2], event, move };
}

export function lateFlood(future, row) {
  if (RIVERSIDE.some((c) => future.cells[row][c] === '=')) return;
  for (const c of RIVERSIDE) if (future.cells[row][c] === 'r') future.cells[row][c] = 'M';
}

/* ---------------- END OF GAME ---------------- */

export function components(future) {
  const seen = grid(false);
  const out = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (seen[r][c] || !isNetwork(future.cells[r][c])) continue;
      const comp = { cells: [], towns: 0, west: false, east: false };
      const stack = [[r, c]];
      seen[r][c] = true;
      while (stack.length) {
        const [cr, cc] = stack.pop();
        comp.cells.push([cr, cc]);
        if (future.cells[cr][cc] === 'T') comp.towns += 1;
        if (cc < RIVER) comp.west = true;
        if (cc > RIVER) comp.east = true;
        for (const [nr, nc] of links(cr, cc)) {
          if (!seen[nr][nc] && isNetwork(future.cells[nr][nc])) {
            seen[nr][nc] = true;
            stack.push([nr, nc]);
          }
        }
      }
      comp.crossed = comp.west && comp.east;
      out.push(comp);
    }
  }
  return out;
}

/** Main Network = the network scoring the most points (ties don't matter: same score). */
export function mainNetwork(future) {
  const s = RULES.scoring;
  const value = (c) => c.towns * s.perLinkedTown + (c.crossed && c.towns > 0 ? s.crossingBonus : 0);
  let best = { cells: [], towns: 0, crossed: false };
  for (const c of components(future)) if (c.towns > 0 && value(c) > value(best)) best = c;
  return best;
}

export function countTowns(future) {
  return future.cells.flat().filter((s) => s === 'T').length;
}

export function finalResult(future) {
  const s = RULES.scoring;
  if (future.drowned) {
    return { ending: 'drowned-valley', score: 0, towns: 0, crossed: false };
  }
  const main = mainNetwork(future);
  const crossed = main.crossed && main.towns > 0;
  const score =
    main.towns * s.perLinkedTown +
    (crossed ? s.crossingBonus : 0) +
    future.relics * s.perRelic +
    future.hardship * s.perHardship;
  let ending;
  if (crossed && main.towns >= s.unitedMinTowns) ending = 'river-united';
  else if (crossed) ending = 'long-bridge';
  else if (main.towns >= s.twoShoresMinTowns) ending = 'two-shores';
  else ending = 'scattered-hamlets';
  return { ending, score, towns: main.towns, crossed };
}

/** Full game. Returns everything a test or the simulator needs. */
export function playGame(seed, strategy) {
  const rng = makeRng(seed);
  const past = newPast();
  const pastLog = [];
  for (let i = 0; i < RULES.past.turns; i++) pastLog.push(playPastTurn(past, rng, strategy));
  const future = pastToFuture(past);
  const futureLog = [];
  if (!future.drowned) {
    for (let i = 0; i < RULES.future.turns; i++) futureLog.push(playFutureTurn(future, rng, strategy));
  }
  return { past, future, pastLog, futureLog, result: finalResult(future) };
}
