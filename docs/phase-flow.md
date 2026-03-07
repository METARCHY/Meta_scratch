# Metarchy Phase Flow
This document describes the exact flow of turns and phases currently implemented in the Metarchy 

## Turn Structure

### Max Turns:
- 2 players (1 vs 1): ends after 5 turns
- 3 players (1 vs 1 vs 1): ends after 5 turns
- 4 players (2 vs. 2): ends after 6 turns
- Test game with bots ends after 3 turns

- Turn 1: Skips Phase 1 (Event Phase) and starts directly at Phase 2 (Distribution Phase).
- Turn 2+: Starts at Phase 1 (Event Phase).
- The last Turn: No Phase 5 (Market Phase), game is finished after Phase 4 (Conflicts Resolution)

## Phases Structure

### Phase 1: Event Phase
- At the start of the phase, a random Event Card is drawn automatically from the Event Card Deck
- The UI presents the Event Card and its conditions (e.g., discard resources, compare sum of values, compare single values).

Player Action: In case of comparing values, the player must click "CONFIRM" to resolve the event. In case of discarding resources, the player need to choose the amount to discard and afte click "CONFIRM".

Resolution:
- UI shows the summary to players: Amount of discarded resources by each player, or amount of values owned by each player. And also shows Outcome:
 - If there is a clear winner, UI show which of the players get reward: Value Fame or Action Card. Note: Only player-winner see the exactly Action Card, all other players see that winner got Action Card, but they don't know which Action Card. Players need to click on button "Get It!", and game goes to the Phase 2 (Distribution Phase)
 - If there are several players meet the conditions for winning (two or more players discarded the same biggest amount of resources, or two or more players have the same smallest amount of values), UI shows wich players need to start the process of the Conflict Resolution. Players, who meet the conditions for winning, see the button "Resolve the Conflict" and need to click on it. Other players see the button "Wait for resolution...", but they can't click on it, they just need to wait while the conflict will be resolved.
  - Fro players, who meet the conditions for winning, a specialized Conflict Resolution modal (Tie-Breaker) pops up where tied players play Rock-Paper-Scissors: each player choose Rock, Scissors or Paper and click on "Done". UI shows to players the Outcome:
   - If the Outcome is Draw, players see the button "Resolve the Conflict" and need to click on it. Conflict Resolution happens one more time, until one of players is winner.
   - If there is a clear winner, UI show which of the players get reward: Value Fame or Action Card. Players need to click on button "Get It!", and game goes to the Phase 2 (Distribution Phase)
 
### Phase 2: Distribution Phase
- Players have their set of Actors (Politician, Scientist, Artist, Robot).

Player Action: The player clicks an Actor, chooses a valid Location on the Map, and selects an Argument Token (Rock/Paper/Scissors). They may optionally add a Bet (Product, Energy, Recycle). After distributing all their Actors by Locations, the player must click the "Next Phase" button. If other players still didn't finish with the distribution of Actors by the Locations, the player's button changes to "WAITING FOR OTHERS..." until the other players finish.

Bots Actions (Only in case of test game, when player plays agains bots): Bots automatically place their actors in the background. The player's button changes to "WAITING FOR OTHERS..." until the bots finish.

Phase Transition: Once all players (humans and bots) have committed their turns, the game advances to Phase 3.

### Phase 3: Action Phase
This phase is divided into multiple sequential sub-steps (p3Step in the code).

#### Step 0: Action: Select Cards
- UI shows Action Card board to aplayer. Even if a player don't have any Action Cards.

Player Action: The player selects which cards they want to activate this turn (they can pick 0 or multiple). Once selection is complete, the player must click "Commit Action Cards" (or "Play No Cards" if none selected).

After all players selected cards to play, the game gets the information about Action Cards that will be played and goes to the next Step:
- If Block Location Cards (Construction Work, Charity Event, Student Protests, Sabotage, Cable Stolen, Environmental Protests) have not been selected, then the game should skip Step 1
- If Relocation Cards have not been selected, then the game should skip Step 2
- If Change Values Cards have not been selected, then the game should skip Step 3

- If no Action Cards have been seelcted, the game must show the players board with the information: "No Actions this turn."
Player Action: Players need to click on button "Get It!", and game should go to Phase 4.

#### Step 1: Action: Block Locations
- UI shows to players a board with the information: "<Locations-Names> will not work this turn."

Player Action: Players need to click on button "Get It!", and game goes to the next Step.

#### Step 2: Action: Relocation
- Players, who didn't select to play Reocation Cards in Step 0, get notification "Waiting for the Relocation..."
- UI ask players, who selected Relocation Cards to play in Step 0, which actor they want to move from one location to another. (Note: Player can choose to relocate as own Actor, as an Actor of another player)

Player Action: Player needs to click on any Actor,  then click a new valid Location (this repeats for the number of Relocation cards played). After click on button "Done". The player's button changes to "WAITING FOR OTHERS..." until the other players finish relocation. 

After this, the game should show which Actors have moved to which Locations, and goes to the next Step.

- If different players choice to relocate the same Actor to different locations, than game starts the process of Conflict Resolution between theses players (Other players need to get notification: Waiting for the Conflict Resolution).
- Relocation Card of player-winner - has effect. Relocation Card of player-loser has no effect and discarded.
- After this, the game should show which Actors have moved to which Locations, and goes to the next Step.

#### Step 3: Action: Change Values
Only for players who selected to play Change Values Card in Step 0. All other players get notification: Waiting for Values Exchange

- UI shows to a player a board with non-zero amount Values of a player and ask player to choose own Value for exchange

Player Action: The player need to click on available value (Power, Knowledg of Art), and after click on button: "Choose a player"
- Player can't click on a Value if amount of Value is 0
- Player can't click on Value Fame

- UI shows to a player a board with avatars of opponent players, and ask to choose an opponent for exchange

Player Action: The player need to click on avatar of a player-opponent

- UI shows to a player a board with non-zero amount Values of a player-opponent and ask player to choose Value for exchange

Player Action: The player need to click on available value (Power, Knowledg of Art), and after click on button: "Change Values"
- Player can't click on a Value if amount of Value is 0
- Player can't click on Value Fame


### Phase 4: Conflicts Reveal
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
