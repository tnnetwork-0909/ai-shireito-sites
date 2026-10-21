// Monte Carlo balance report. Usage: node design/sim/balance.mjs [games]
import { playGame, RULES, ROWS, RIVER } from './engine.mjs';
import { makeRng } from './engine.mjs';
import { fileURLToPath } from 'node:url';
import { randomStrategy, greedyStrategy } from './strategies.mjs';

export function simulate(makeStrategy, games, seedBase = 1) {
  const endings = Object.fromEntries(RULES.endings.map((e) => [e.id, 0]));
  let score = 0;
  let floods = 0;
  let hardship = 0;
  const scores = [];
  // Past -> Future influence: crossing rate split by intact Past bridges.
  const byBridge = { none: [0, 0], some: [0, 0] };
  for (let i = 0; i < games; i++) {
    const seed = seedBase + i;
    const g = playGame(seed, makeStrategy(makeRng(seed ^ 0x9e3779b9)));
    endings[g.result.ending] += 1;
    score += g.result.score;
    scores.push(g.result.score);
    floods += g.past.floods;
    hardship += g.future.hardship;
    let intact = 0;
    for (let r = 0; r < ROWS; r++) if (g.past.cells[r][RIVER] === 'B' && !g.past.flooded[r][RIVER]) intact++;
    const bucket = intact ? byBridge.some : byBridge.none;
    bucket[0] += g.result.crossed ? 1 : 0;
    bucket[1] += 1;
  }
  scores.sort((a, b) => a - b);
  const rate = ([hit, n]) => (n ? hit / n : 0);
  return {
    games,
    meanScore: score / games,
    p10: scores[Math.floor(games * 0.1)],
    p90: scores[Math.floor(games * 0.9)],
    floodsPerGame: floods / games,
    hardshipPerGame: hardship / games,
    endingRates: Object.fromEntries(Object.entries(endings).map(([k, v]) => [k, v / games])),
    crossRateWithPastBridge: rate(byBridge.some),
    crossRateWithoutPastBridge: rate(byBridge.none),
    gamesWithPastBridge: byBridge.some[1],
  };
}

// Path compare via fileURLToPath: the workspace path contains non-ASCII characters.
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const games = Number(process.argv[2] ?? 2000);
  for (const [name, s] of [['random', randomStrategy], ['greedy', greedyStrategy]]) {
    const r = simulate(s, games);
    console.log(`\n== ${name} (${games} games) ==`);
    console.log(JSON.stringify(r, (k, v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v), 2));
  }
}
