# Simon 2026 - Game Rules

> ⚠️ **AUTO-GENERATED** from code. Do not edit manually.
> Run: `npm run rules:generate`

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

- **Correct tap**: `10` points
- **Round bonus**: `round × 10`
- **Speed bonus (normalized, no penalties)**:
  - Let `roundValue = tapsScore + roundBonus`
  - Let `r = clamp(secondsLeft / timeLimit, 0..1)`
  - `speedBonus = floor(roundValue × 0.8 × (r^2))`

Key ideas:
- Speed **never subtracts** points.
- Speed scales with the round’s value (matters early and late).

---

## Multiplayer Mode (Turn-Based Showmatch)

### Core idea
Each player gets **one timed turn** to score as much as possible. Everyone watches the active player’s turn.

### Host settings
- **Turn timer**: 30 / 60 / 90 seconds

### Turn rules
- Players play **one at a time** (spectators watch).
- Each player gets **different sequences** (same difficulty, different pattern).
- A **wrong sequence ends your turn immediately**.

### Sequences (difficulty model)
- Initial length: `2`
- Each completed sequence increases length by: `+1`

### Scoring (Turn-Based Multiplayer)
- Base points per completed sequence: `100`
- Speed factor: based on `secondsRemaining / turnTotalSeconds` (0..1)
- Speed points: `round(base × (0.3 + (1 - 0.3) × r^2))`
- Multiplier: increases every `5` completed sequences (x2 at 5, x3 at 10, …)
- Earned per sequence: `speedPoints × multiplier`

### Winner
- Winner = highest total score after all turns finish.

---

## Challenge Mode (Time Trial + Viral)

### Core idea
You have **60 seconds** to score as many points as possible. After your run you can:
- **Challenge a friend** (share link, same sequences)
- **Challenge the community** (public pool)

### Sequences
- Initial length: `2`
- Each completed sequence increases length by: `+1`
- Friend challenges use the **same deterministic sequences** (seeded).

### Fail rules
- Failing does **not** end the run.
- You retry the **same** sequence.
- Penalty: `min(150, 10 × sequenceLength)`

### Scoring
- Base points per completed sequence: `100`
- Speed points (per sequence): `round(base × (0.3 + (1 - 0.3) × r^2))` (based on completion speed)
- Multiplier: increases every `5` completed sequences (x2 at 5, x3 at 10, …)
- Earned per sequence: `speedPoints × multiplier`
