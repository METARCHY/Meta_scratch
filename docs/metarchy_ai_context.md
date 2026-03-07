# Metarchy: Context & Systems Prompt for Agents

You are stepping into the development of **Metarchy**, a turn-based sci-fi strategy game emphasizing hidden information, deduction, and resource management.

## Game Core & Components
*   **Goal:** Reach the highest Victory Points. `1 Victory Point = 1 Power + 1 Art + 1 Knowledge`.
*   **Actors (4):** Politician (creates Power), Scientist (creates Knowledge), Artist (creates Art), Robot (creates Production, Electricity, or Recycling Resources).
*   **Human Locations (3):** University (Politicians/Scientists), Theater (Scientists/Artists), Square (Politicians/Artists).
*   **Robot Locations (3):** Factory, Energy Plant, Dump.
*   **Arguments (4):** Rock, Paper, Scissors, Dummy (loses to RPS, draws another Dummy).
*   **Bets (3):** Production applies if Outcome = Win. Electricity applies if Outcome = Lose. Recycling applies if Outcome = Draw.

## The Game Flow (Turn Phases)
1.  **Event Phase** (Skip Turn 1): Random global event. May require minigame to settle ties.
2.  **Distribution Phase**: Secretly assign Actors to Locations + Arguments + Bets.
3.  **Action Phase**: Secretly play Action Cards (e.g., Block Location, Relocate, Change Values). Action cards resolve *before* Conflicts.
4.  **Conflict Resolution Phase**: Resolve conflicts in contested Locations. Calculate Outcome -> Check Bets -> Apply Actor Special Rules -> Distribute Values/Resources.
5.  **Market Phase**: Spend 3 different Resources to buy 1 new Action Card.

## Critical Engine Logic: The "Tricky Situations" Rulebook
The most complex part of Metarchy is managing Conflict overlap between Bets and specific Actor rules. **Always execute Conflict logic in exactly this order:**
1.  **Calculate the Base Outcome (O)** purely from Arguments (Win = `OW`, Lose = `OL`, Draw = `OD`).
2.  **Check if Bet (B) fits the Outcome (O).**
    *   If `B(x) == O(x)`, the Bet is Successful. Execute Bet effect, then discard the Bet entirely.
    *   If `B(x) ≠ O(x)`, the Bet Fails. Discard the Bet, proceed with normal Outcome.
3.  **Apply Actor Special Draw Rules:**
    *   *Scientists:* Base Outcome `OD` is treated as a Win for both. (If they bet `BD`, Bet is successful, converting `OD` to Win, which is redundant but valid).
    *   *Artists:* Base Outcome `OD` for Artists means "Both Artists Lose". No Art is generated. (If an Artist bet `BD`, the bet succeeds, converting the outcome to a Win *before* the special rule ruins it).

## Special Case Resolutions
*   **The Rewind:** If P1 bets Lose and P2 bets Win, P2 takes their Reward immediately. P1's bet triggers a secondary Conflict Resolution from scratch to determine a new Final Outcome. (If P2 wins again, P2 gets *another* reward).
*   **The Ultimate Tie-Breaker (Pure RPS):** Whenever game logic structurally collides beyond normal conflict—such as two players playing Relocation on the *exact same* Actor, or two players tying for lowest Values on an Event Card—the UI immediately locks those players into a Rock/Paper/Scissors minigame.
    *   *Minigame constraints:* Cannot pick Dummy. Cannot place Bets. Loser forfeits the Event/Action. Draw restarts the minigame until Win/Lose.
*   **UI Hard-Blocks:** 
    *   Players cannot select the Action Card "Change Values" if neither they nor the target player possess any Values.
    *   If a location is blocked by Sabotage, and a player plays Relocation to save an Actor, the UI restricts where they can Relocate (Robot to Robot-locations, Human to Human-locations).
