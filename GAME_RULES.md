# Simon 2026 - Game Rules

## Solo Mode

### Objective
Repeat the color sequence shown by the game. Each round adds one more color to the sequence.

### Lives System
- **Starting Lives**: 3 lives (hearts)
- **Losing Lives**: 
  - Wrong color tap = lose 1 life
  - Timer runs out = lose 1 life
- **Regeneration**: Gain 1 life every 10 rounds completed (max 3)
- **Game Over**: When all lives are lost

### Scoring System

The game uses a hybrid scoring formula:

```
Round Score = Taps Score + Round Bonus + Speed Bonus
```

| Component | Formula | Description |
|-----------|---------|-------------|
| Taps Score | `taps × 10` | 10 points per correct tap |
| Round Bonus | `round × 10` | Bonus for completing a round |
| Speed Bonus | `seconds_left × 10` | Bonus for remaining time |

**Example**: Complete round 5 with a 6-color sequence and 8 seconds remaining:
- Taps: 6 × 10 = 60 points
- Round Bonus: 5 × 10 = 50 points
- Speed Bonus: 8 × 10 = 80 points
- **Total**: 190 points

### Timer
- Each turn has a time limit
- Timer starts when it's your turn to play
- Timer bar changes color:
  - 🟢 Green: > 50% time remaining
  - 🟠 Orange: 25-50% time remaining
  - 🔴 Red + pulse: < 25% time remaining

### Melodies
The game sequences are based on real public domain melodies! Each color represents musical notes, so you're unknowingly playing famous songs:
- Ode to Joy (Beethoven)
- Für Elise (Beethoven)
- Twinkle Twinkle Little Star
- Happy Birthday
- And more...

When you complete a melody, a new one starts automatically.

### High Score
Your best score is saved locally and persisted between sessions.

---

## Multiplayer Mode (Coming Soon)

### Turn-Based Play
- Players take turns repeating the sequence
- Wrong input = elimination
- Last player standing wins

### Real-Time Feedback
- See when opponent is playing
- Watch their sequence in real-time

---

## Tips & Tricks

1. **Feel the rhythm**: Each color has a unique vibration pattern. Use haptic feedback to help remember sequences.

2. **Listen to the melody**: The colors form musical notes. Recognizing the tune can help you remember longer sequences.

3. **Speed bonus matters**: Complete sequences quickly for extra points.

4. **Protect your lives**: Early lives are precious. Focus on accuracy over speed in the beginning.

5. **Round 10 checkpoint**: Remember that you regenerate a life every 10 rounds!
