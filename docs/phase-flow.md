Current Phase Flow in Codebase
This document describes the exact flow of turns and phases currently implemented in the Metarchy codebase (specifically inside 
page.tsx
 and 
PhaseEngine.ts
).

Turn Structure
Turn 1: Skips Phase 1 (Events) and starts directly at Phase 2 (Distribution).
Turn 2+: Starts at Phase 1 (Events).
Max Turns:
Test game against bots: ends after 3 turns.
4-player game: ends after 8 turns.
5-player game: ends after 6 turns.
2, 3, or 6-player games: ends after 7 turns.
Phase 1: Event Stage
A random Event Card is drawn automatically at the start of the phase.
The UI presents the Event Card and its conditions (e.g., discard resources, compare sum, compare single resource).
Player Action: The user must click "CONFIRM" to resolve the event.
Resolution:
If there is a clear winner/loser, the results and rewards are applied immediately.
If there is a tie for a compare or compare_sum event, a specialized Conflict Resolution modal (Tie-Breaker) pops up where tied players play Rock-Paper-Scissors.
Phase Transition: After resolution (or after closing the event modal), the game automatically advances to Phase 2.
Phase 2: Distribution Phase (Placement)
Players receive their set of Actors (Politician, Scientist, Artist, Robot).
Player Action: The user clicks an Actor, chooses a valid Location on the Map, and selects an Argument Token (Rock/Paper/Scissors). They may optionally add a Bet (Product, Energy, Recycle).
Player Action: After placing all their Actors (or deciding they are done), the user must click the "Next Phase" button in the bottom right corner.
Opponent Action (Bots): In a test game, bots automatically place their actors in the background. The user's button changes to "WAITING FOR OTHERS..." until the bots finish.
Phase Transition: Once all players (human and CPU) have committed their turns, the game advances to Phase 3.
Phase 3: Action Phase
This phase is divided into multiple sequential sub-steps (p3Step in the code).

Step 0: Action: Select Cards
Players view all the Action Cards in their hand.
Player Action: The user selects which cards they want to activate this turn (they can pick 0 or multiple).
Player Action: Once selection is complete, the user must click "Commit Action Cards" (or "Play No Cards" if none selected).
Step 1: Action: Stop Locations (Block Locations)
Auto-Execution: The game automatically finds any "Turn Off Location" cards selected in Step 0 and applies them instantly, disabling the target locations.
Auto-Transition (The Issue): The game has a setTimeout that waits 1 second, then automatically evaluates what other cards were played:
If Relocation cards were played, it forcefully jumps to Step 2.
If Change Values (Exchange) cards were played, it forceful jumps to Step 3.
If no valid cards remain, it instantly forces the game into Phase 4 via 
handleNextPhaseWrapper()
.
Player Action: NONE required. The UI skips the user.
Step 2: Action: Relocation
Only accessible if Relocation cards were selected in Step 0.
Player Action: The user must click their placed actor on the map, then click a new valid location hex.
This repeats for the number of Relocation cards played.
Player Action: The user must explicitly click "Done Relocation" to proceed (unless all cards match count, then it might rely on Next Phase).
Step 3: Action: Change Values (Exchange)
Only accessible if Change Values/Exchange cards were selected.
Player Action: The user clicks an opponent's profile, chooses a resource to give, and a resource to take.
Player Action: The user clicks "Done Exchange".
Phase Transition: The game advances to Phase 4.
Phase 4: Conflicts Reveal
The game scans the board for any locations holding actors belonging to different players (or if a single player/bot holds a location uncontested).
A sidebar lists all active Conflicts.
Player Action: The user clicks on a Conflict in the sidebar to open the Conflict Resolution Modal.
Player Action: The user clicks "Reveal Conflict" to trigger the RPS logic and process bets.
This is repeated for every active conflict.
Phase Transition: The "Next Phase" button only becomes active once all conflicts involving the local player are resolved.
Player Action: The user must explicitly click the "Next Phase" button.
Phase 5: Market & Cards
(Note: Code comments indicate Player Exchange (Steps 1 & 2) in this phase are skipped for the MVP).

Step 3: Buy Cards. The Market displays 3 generated random Action Cards.
Player Action: The user can choose to buy a card (costs 1 Product, 1 Energy, 1 Recycle) by clicking it, or they can click "Skip".
Phase Transition: Clicking a card or clicking Skip ends the turn.
The board is completely cleared of actors.
Turn counter increments by +1, and the game loops back to Phase 1: Event Stage.
