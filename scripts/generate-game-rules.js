/**
 * Auto-generate GAME_RULES.md from source-of-truth constants.
 *
 * Run: `npm run rules:generate`
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function extractConstNumber(source, constName, fallback) {
  const re = new RegExp(`const\\s+${constName}\\s*=\\s*([0-9]+(?:\\.[0-9]+)?)`, 'm');
  const m = source.match(re);
  return m ? Number(m[1]) : fallback;
}

function extractExportedConstObject(source, objectName) {
  const re = new RegExp(`export\\s+const\\s+${objectName}\\s*=\\s*\\{([\\s\\S]*?)\\}\\s+as\\s+const;`, 'm');
  const m = source.match(re);
  return m ? m[1] : null;
}

function extractArrayFromObjectBody(body, key) {
  const re = new RegExp(`${key}\\s*:\\s*\\[([^\\]]+)\\]`, 'm');
  const m = body.match(re);
  if (!m) return null;
  return m[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s));
}

function extractNumberFromObjectBody(body, key, fallback) {
  const re = new RegExp(`${key}\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)`, 'm');
  const m = body.match(re);
  return m ? Number(m[1]) : fallback;
}

function main() {
  const scoringService = read('frontend/src/services/scoringService.ts');
  const simonTurnLogic = read('src/backend/utils/simonTurnLogic.ts');
  const challengeLogic = read('frontend/src/gameLogic/challengeLogic.ts');
  const gameRulesPath = path.join(repoRoot, 'GAME_RULES.md');

  // Solo scoring (frontend)
  const SOLO_POINTS_PER_TAP = extractConstNumber(scoringService, 'POINTS_PER_TAP', 10);
  const SOLO_ROUND_MULT = extractConstNumber(scoringService, 'ROUND_MULTIPLIER', 10);
  const SOLO_SPEED_WEIGHT = extractConstNumber(scoringService, 'SPEED_WEIGHT', 0.8);
  const SOLO_SPEED_EXP = extractConstNumber(scoringService, 'SPEED_EXPONENT', 2);

  // Turn-based multiplayer (backend)
  const body = extractExportedConstObject(simonTurnLogic, 'SIMON_TURN_CONSTANTS') || '';
  const TURN_OPTIONS = extractArrayFromObjectBody(body, 'TURN_OPTIONS_SECONDS') || [30, 60, 90];
  const TB_INITIAL_LEN = extractNumberFromObjectBody(body, 'INITIAL_SEQUENCE_LENGTH', 2);
  const TB_INC = extractNumberFromObjectBody(body, 'SEQUENCE_INCREMENT', 1);
  const TB_BASE = extractNumberFromObjectBody(body, 'SEQUENCE_BASE_POINTS', 100);
  const TB_FLOOR = extractNumberFromObjectBody(body, 'SPEED_FLOOR', 0.3);
  const TB_POWER = extractNumberFromObjectBody(body, 'SPEED_POWER', 2);
  const TB_MULT_STEP = extractNumberFromObjectBody(body, 'MULTIPLIER_STEP_SEQUENCES', 5);

  // Challenge (frontend)
  const CH_TIME = extractConstNumber(challengeLogic, 'TIME_LIMIT_SECONDS', 60);
  const CH_INIT = extractConstNumber(challengeLogic, 'INITIAL_SEQUENCE_LENGTH', 2);
  const CH_INC = extractConstNumber(challengeLogic, 'SEQUENCE_INCREMENT', 1);
  const CH_BASE = extractConstNumber(challengeLogic, 'SEQUENCE_BASE_POINTS', 100);
  const CH_FLOOR = extractConstNumber(challengeLogic, 'SPEED_FLOOR', 0.3);
  const CH_POWER = extractConstNumber(challengeLogic, 'SPEED_POWER', 2);
  const CH_MULT = extractConstNumber(challengeLogic, 'MULTIPLIER_STEP_SEQUENCES', 5);
  const CH_PEN_STEP = extractConstNumber(challengeLogic, 'PENALTY_PER_STEP', 10);
  const CH_PEN_CAP = extractConstNumber(challengeLogic, 'MAX_PENALTY', 150);

  const md = `# Simon 2026 - Game Rules

> ⚠️ **AUTO-GENERATED** from code. Do not edit manually.
> Run: \`npm run rules:generate\`

## Solo Mode

### Objective
Repeat the color sequence shown by the game. Each round adds one more color to the sequence.

### Lives System (Solo Only)
- **Starting Lives**: 3 lives
- **Wrong tap**: lose 1 life
- **Timeout**: lose 1 life
- **Regeneration**: +1 life every 10 rounds completed (max 3)

### Scoring (Solo)
Round score is a hybrid of accuracy + progression + speed:

- **Correct tap**: \`${SOLO_POINTS_PER_TAP}\` points
- **Round bonus**: \`round × ${SOLO_ROUND_MULT}\`
- **Speed bonus (normalized, no penalties)**:
  - Let \`roundValue = tapsScore + roundBonus\`
  - Let \`r = clamp(secondsLeft / timeLimit, 0..1)\`
  - \`speedBonus = floor(roundValue × ${SOLO_SPEED_WEIGHT} × (r^${SOLO_SPEED_EXP}))\`

Key ideas:
- Speed **never subtracts** points.
- Speed scales with the round’s value (matters early and late).

---

## Multiplayer Mode (Turn-Based Showmatch)

### Core idea
Each player gets **one timed turn** to score as much as possible. Everyone watches the active player’s turn.

### Host settings
- **Turn timer**: ${TURN_OPTIONS.join(' / ')} seconds

### Turn rules
- Players play **one at a time** (spectators watch).
- Each player gets **different sequences** (same difficulty, different pattern).
- A **wrong sequence ends your turn immediately**.

### Sequences (difficulty model)
- Initial length: \`${TB_INITIAL_LEN}\`
- Each completed sequence increases length by: \`+${TB_INC}\`

### Scoring (Turn-Based Multiplayer)
- Base points per completed sequence: \`${TB_BASE}\`
- Speed factor: based on \`secondsRemaining / turnTotalSeconds\` (0..1)
- Speed points: \`round(base × (${TB_FLOOR} + (1 - ${TB_FLOOR}) × r^${TB_POWER}))\`
- Multiplier: increases every \`${TB_MULT_STEP}\` completed sequences (x2 at ${TB_MULT_STEP}, x3 at ${TB_MULT_STEP * 2}, …)
- Earned per sequence: \`speedPoints × multiplier\`

### Winner
- Winner = highest total score after all turns finish.

---

## Challenge Mode (Time Trial + Viral)

### Core idea
You have **${CH_TIME} seconds** to score as many points as possible. After your run you can:
- **Challenge a friend** (share link, same sequences)
- **Challenge the community** (public pool)

### Sequences
- Initial length: \`${CH_INIT}\`
- Each completed sequence increases length by: \`+${CH_INC}\`
- Friend challenges use the **same deterministic sequences** (seeded).

### Fail rules
- Failing does **not** end the run.
- You retry the **same** sequence.
- Penalty: \`min(${CH_PEN_CAP}, ${CH_PEN_STEP} × sequenceLength)\`

### Scoring
- Base points per completed sequence: \`${CH_BASE}\`
- Speed points (per sequence): \`round(base × (${CH_FLOOR} + (1 - ${CH_FLOOR}) × r^${CH_POWER}))\` (based on completion speed)
- Multiplier: increases every \`${CH_MULT}\` completed sequences (x2 at ${CH_MULT}, x3 at ${CH_MULT * 2}, …)
- Earned per sequence: \`speedPoints × multiplier\`
`;

  fs.writeFileSync(gameRulesPath, md.trim() + '\n', 'utf8');
  console.log('✅ Wrote GAME_RULES.md');
}

main();

