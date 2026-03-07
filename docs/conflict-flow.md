# Metarchy — Conflict Flow (Phase 4: Conflicts Reveal)

> Authoritative reference for conflict resolution logic. Use this as the source of truth for code and AI context.

---

## 1. Conflict Detection

Check each Location (L) on the board:

- If **2 or more Actors (A) of the same type** are at the same Location → they have a **Conflict**.
- Actors at Disabled Locations are excluded (no conflict, no resources).
- Actors of different types at the same location do *not* conflict with each other.

---

## 2. Argument Comparison (Rock / Paper / Scissors)

Each Actor has an Argument token placed during Distribution Phase:
- **Rock** beats **Scissors** and **Dummy**. If two or more Rocks meet, it's a Draw.
- **Scissors** beats **Paper** and **Dummy**. If two or more Scissors meet, it's a Draw.
- **Paper** beats **Rock** and **Dummy**. If two or more Papers meet, it's a Draw.
- **Dummy** loses to **Rock**, **Scissors**, and **Paper**. If two or more Dummies meet, it's a Draw.
- If **Rock**, **Scissors** and **Paper** meet, it's a Draw.

---

## 3. Conflict Outcomes (O)

For each Actor in the Conflict:

| Outcome | Code | Condition |
|---------|------|-----------|
| Win | OW | Actor's Argument beats all opponents' Arguments |
| Lose | OL | Actor's Argument loses to all opponents' Arguments |
| Draw | OD | Two or more Arguments are the same, or 3 Arguments are different |

### Draw special rules by Actor type:

| Actor | Draw Result |
|-------|-------------|
| **Politician** | Conflict resolution — select a new Argument. |
| **Scientist** | All Scientists create values (each creates 1 Knowledge). |
| **Artist** | All Artists are evicted from the Location (no values are created). |
| **Robot** | All Robots create resources (each creates 1 resource, instead of 3). |

---

## 4. Bet Evaluation (B)

Bets are placed during Distribution Phase. Each bet is a **one-time token**:

| Bet | Code | Condition for Success |
|-----|------|-----------------------|
| Bet on Win (Product) | BW | Actor outcome = Win |
| Bet on Lose (Energy) | BL | Actor outcome = Lose |
| Bet on Draw (Recycle) | BD | Actor outcome = Draw |
| No Bet | B0 | — |

### Resolution order:

1. **Compare Outcome with Bet.**
   - If `Outcome == Bet` → Bet is **Successful** → Apply bet reward.
   - If `Outcome != Bet` → Bet is **Failed**.
2. **Discard the Bet** — regardless of success or failure, the bet is discarded after evaluation.
3. **Bet is consumed after the FIRST conflict resolution**, even if the conflict restarts (Draw).

> [!IMPORTANT]
> Bet icons must be cleared from the UI immediately after the first resolution, even on a Draw restart.
> The restarted conflict is resolved **without bets**.

---

## 5. Bet Rewards

| Bet Type | Reward on Success |
|----------|------------------|
| Product (Win) | +1 extra value depending on the Actor type, or resource depending on the Robot-location |
| Energy (Lose) | Restart the conflict (select a new Argument); no resources lost |
| Recycle (Draw) | Actor wins in the conflict, and creates value or 3 resources |

---

## 6. Resource Collection

After conflict resolution:

- **Winner** claims their Actor's resource from the Location.
- **Draw (Scientist/Robot)**: All share resources.
- **Draw (Artist)**: All evicted, no resources.
- **Draw (Politician)**: Restarts, then winner claims resource.
- **Loser**: Evicted from the Location. No resources.

---

## 7. Complete Flow Chart

```
For each Location L:
  Find all Actor types at L (not disabled)
    For each Actor type T with ≥2 actors:
      [CONFLICT STARTS]
      ↓
      Compare Arguments (RSP)
      ↓
      Determine Outcome: Win / Lose / Draw per Actor
      ↓
      Evaluate Bets (before discard):
        Is Outcome == Bet? → Apply reward
        Always: Discard bet token
      ↓
      Apply Draw special rules (per actor type)
      ↓
      Did conflict Restart? (Politician Draw / Energy Bet)
        YES → Repeat from "Compare Arguments" WITHOUT bets
        NO  → Collect resources, evict losers
      ↓
      [CONFLICT RESOLVED]
```

---

## 8. Coding Notes

- `placedActors[].bid` is the bet token (`'product' | 'energy' | 'recycle' | undefined`).
- On conflict resolution (even restart): clear `bid` from `placedActors` AND from `stickyConflicts` snapshot.
- `stickyConflicts` is a Phase 4 snapshot — must be updated manually when bets are burned.
- Bot Phase 3 actions (Block, Relocate, Exchange) only trigger if bot has committed cards (`botActionCommits` ref).
