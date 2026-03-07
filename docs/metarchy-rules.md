# Metarchy: Official Rulebook

Welcome to the official rules for **Metarchy**, a turn-based strategy game of hidden information, psychological deduction, and resource management.

## 🎯 Goal of the Game
The ultimate objective is to accumulate the highest number of **Victory Points** by the end of the game's final Turn. 
A **Victory Point** is earned by collecting a full set of the three Value Tokens:
`1 Victory Point = 1 Power + 1 Art + 1 Knowledge`

If players have an equal number of Victory Points at the end of the final Turn, an extra tie-breaker Turn is played between those tied players.

## Gaming Terminology
- **Conflict** - If two or more Actors of the same type meet in one Location, they will have a Conflict. If Actors have a Conflict, players need to start the process of Conflict Resolution.
- **Conflict Resolution** - Every time, when rules of the game come to a conflict with each other, players need to start the process of Conflict Resolution: each player chooses Rock, Paper, or Scissors. Each player knows only their own choice, but not the other players' choices. After all players have made their choices, their choices are revealed. The Outcome of the Conflict can be Win, Lose or Draw. If the Conflict Outcome is a Draw then repeat the Conflict Resolution unless otherwise stated in the rules. Conflict Resolution can be between Actors. Bets are not used for the Conflict Resolution. Dummy is not used for the Conflict Resolution. 
- **Outcome** - result of the Conflict Resolution. It can be Win, Lose or Draw.
- **Location** - part of the game field. Locations is doing nothing by itself. Players can send Actors to the Locations.
- **Actor** - main charecters of each player. Players send Actors to the Locations. Actors produce Values or Resources in the Locations.
- **Argument** - when sending an Actor to a Location, player MUST give an Argument to Actor. Each Actor must to have an Argument. Each Actor can get only one Argument. Actors of the same player must have different Arguments.
- **Bet** - when sending an Actor to a Location, player MAY add a Bet on Outcome to Actor. To add a Bet on the Outcome of a Conflict, a player must use a Resource. If a player does not have the required Resource, player cannot add a Bet to Actor. Player can't add more than one Bet to one Actor. If Outcome of the Conflict is the same as a Bet, then Bet is succesful. If Outcome of the Conflict is other than a Bet, then Bet is faild. Regardless of whether the Bet was successful or faild, the Bet Resource is discarded and is not returned to the player.

## 🔬 Game Components

### 1. Players
The game supports 2 to 3 players, or "2 vs. 2" mode.
Exch player starts the game with:
- 4 Actors (Politician, Scientist, Artist, Robot)
- 4 Arguments (Rock, Scissors, Paper, Dummy)
- 3 Resources (1 Production, 1 Electricity, 1 Recycling)

### 2. The Game Board (Locations)
The board consists of 6 distinct Locations where Conflicts are happening:
**Human Locations:**
- 🏛️ **University** (You can send here Politician or Scientist)
- 🎭 **Theater** (You can send here Scientist or Artist)
- ⛲ **Square** (You can send here Politician or Artist)

**Robot Locations:**
- 🏭 **Factory** (You can send here Robot)
- ⚡ **Energy Plant** (You can send here Robot)
- 🗑️ **Dump** (You can send here Robot)

### 3. Actors (4 Types per Player)
Actors are sent to Locations to create values.
- 👔 **Politician** (Players can only send Politician to the Square and University locations.)
  - A Politician in the Square or University location creates the Value - Power.
  - If two or more Politicians are in the Square or University Location, a Conflict occurs between the Politicians.
  - For each Politician, the Conflict Outcome can be Win, Lose or Draw.
  - If Outcome is Win - Politician returns to Player-owner with Value Power.
  - If Outcome is Lose - Politician returns to Player-owner without anything. 
  - If Outcome is Draw, players need to Resolve the Conflict until Outcome of the Conflict Win-Lose. 
- 🧑🔬 **Scientist** (Players can only send Scientist to the Theater and University Locations.)
  - A Scientist in the Theater or University Location produces the Value - Knowledge.
  - If two or more Scientists are in the Theater or University Location, a Conflict occurs between the Scientists.
  - For each Scientist, the Conflict Outcome can be Win, Lose or Draw.
  - If Outcome is Win - Scientist returns to Player-owner with Value Knowledge.
  - If Outcome is Lose - Scientist returns to Player-owner without anything. 
  - If Outcome is Draw, players don't need to Resolve the Conflict. All Scientists return to Player-owners with Value Knowledge. ("Draw between Scientists" is the same as "All Scientists Win")
- 🧑🎨 **Artist** (Players can only send Artist to the Theater and Square Locations.)
  - An Artist in the Theater or Square Location creates the Value - Art.
  - If two or more Artists are in the Theater or Square Location, a Conflict occurs between the Artists.
  - For each Artist, the Conflict Outcome can be Win, Lose or Draw.
  - If Outcome is Win - Artist returns to Player-owner with Value Art.
  - If Outcome is Lose - Artist returns to Player-owner without anything. 
  - If Outcome is Draw, players don't need to Resolve the Conflict. All Artists return to Player-owners without anything. ("Draw between Artists" is the same as "All Artists Lose")
- 🤖 **Robot** (Players can send an Actor-Robot to these Locations: Factory, Power Plant, or Dump.)
  - A Robot in the Factory Location produces three units of Rescourses - Product.
  - A Robot in the Power Plant Location produces three units of Rescourses - Electricity.
  - A Robot in the Dump Location produces three units of Rescourses - Recycling.
  - If two or more Actor-Robots are in the Factory, Power Plant, or Dump Location, a Conflict occurs between the Robots.
  - For each Robot, the Conflict Outcome can be Win, Lose or Draw.
  - If Outcome is Win - Robot returns to Player-owner with 3 Resources of Product/Electricity/Recycling (depending on the Location).
  - If Outcome is Lose - Robot returns to Player-owner without anything. 
  - If Outcome is Draw - Robot returns to Player-owner with 1 Resource of Product/Electricity/Recycling (depending on the Location).

### 4. Arguments (4 Types)
When Player send an Actor to Location, Player must give an Argument to Actor.
- 🪨 **Rock** *(Loses to Paper. Wins against Scissors and Dummy. Draws against Rock).*
- ✂️ **Scissors** *(Loses to Rock. Wins against Paper and Dummy. Draws against Scissors).*
- 📄 **Paper** *(Loses to Scissors. Wins against Rock and Dummy. Draws against Paper).*
- 🪆 **Dummy** *(Loses to Rock, Paper, and Scissors. Draws against another Dummy).*

### 5. Values
Required to form Victory Points. 1 Power + 1 Art + 1 Knowledge = 1 Victory Point
- 👑 **Power** (Created by Politics in Square/University)
- 🎨 **Art** (Created by Artists in Theater/Square)
- 📖 **Knowledge** (Created by Scientists in University/Theater)

### 6. Resources
Used to add bets on Conflict Outcome.
- ⚙️ **Production** (Used to bet on "Win". If the Conflict Outcome for Actor is Win, this Actor will return to Player-owner with one more additional Value or Resource, depending on the Actor.)
- 🔋 **Electricity** (Used to bet on "Lose". If the Conflict Outcome for Actor is Lose, then Resolve the Conflict one more time.)
- ♻️ **Recycling** (Used to bet on "Draw". If the Conflict Outcome for Actor is Draw, then count Outcome as a Win for this Actor.)

### 7. Action Cards
Action cards are powerful, single-use items that can dramatically alter the game state. They are purchased during Market Phase using a combination of Resources.
  Deck of Action Cards contains 15 cards:
- **Construction Work** (1 card. Location Square doesn't work this turn. No Conflicts will happen there. Actors in this location will not produce any Values.)
- **Charity Event** (1 card. Location Theater doesn't work this turn. No conflicts will happen there. Actors in this location will not produce any Values.)
- **Student Protests** (1 card. Location University doesn't work this turn. No conflicts will happen there. Actors in this location will not produce any Values.)
- **Sabotage** (1 card. Location Factory doesn't work this turn. No conflicts will happen there. Actors in this location will not produce any Values.)
- **Cable Stolen** (1 card. Location Energy Plant doesn't work this turn. No conflicts will happen there. Actors in this location will not produce any Values.)
- **Environmental Protests** (1 card. Location Dump doesn't work this turn. No conflicts will happen there. Actors in this location will not produce any Values.)
- **Relocation** (6 cards. Choose one Actor and move it to any possible location. You can't send Politics to Theater, Scientist to Square, Artist to University, Robots to Human Locations, and Humans to Robot Locations. You can play Relocation card after any player played Construction Work, Charity Event, Student Protests, Sabotage, Cable Stolen, or Environmental Protests)
- **Change Values** (3 cards. Exchange one of your Values with any other Value of another Player. Players can't exchange the Fame Value.)

- An Action Card can be obtained randomly by playing an Event Card.
- Players always receive Action Cards randomly.
- In the last phase of each turn (Market Phase), a player may purchase a random Action Card using three different Resources: "Product + Electricity + Recycling."
- A player may play any amount of Action Cards during the Action Phase.

### 8. Event Cards
At the beginning of each turn, in Event Phase (but not on the Turn 1), one of the seven Event Cards is randomly open, and Event happens.
Deck of Event Cards contains 7 cards:
- **Political Repression** (Compare the amount of Value Power for each Player. The player with the lowest amount of Value Power gains the Value Fame.)
- **Educational Crisis** (Compare the amount of Value Knowledge for each Player. The player with the lowest amount of Value Knowledge gains the Value Fame.)
- **Cultural Decline** (Compare the amount of Value Art for each Player. The player with the lowest amount of Value Art gains the Value Fame.)
- **Revolution** - Compare the total amount of all Values for each Player. The player with the lowest amount of all Values gains the Value Fame.)
- **Help Poor Countries** (Each Player may discards any amount of Resource Product, but players don't know how many Resources other players discarded. After all Players have discarded the desired amount of Resources Product (the amount may be zero), information about how many resources each player has discarded becomes publicly known. The Player who has discarded more Resourse Products receives a random Action Card.
- **Earth Hour** - Each Player may discards any amount of Resource Electricity, but players don't know how many Resources other players discarded. After all Players have discarded the desired amount of Resources Electricity (the amount may be zero), information about how many resources each player has discarded becomes publicly known. The Player who has discarded more Resourse Electricity receives a random Action Card.
- **Prevent Eco-Crisis** - Each Player may discards any amount of Resource Recycling, but players don't know how many Resources other players discarded. After all Players have discarded the desired amount of Resources Recycling (the amount may be zero), information about how many resources each player has discarded becomes publicly known. The Player who has discarded more Resourse Recycling receives a random Action Card.

If two or more players meet the conditions specified on the Event Card, the winner is determined by a Conflict Resolution.

## Metarchy Phase Flow
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

### Phase 4: Conflict Resolution Phase
- If in the Location the only one Actor of one type (the only one Politician, the only one Scientist, the only one Artist, the only one Robot) - such an Actor doesn't have a Conflict, and game count such an Actor as a Winner. Such an Actor returns back to Player and brings a Value or 3 Resources (depends of Actor type). If such an Actor had a Bet on Win, then a Bet is succesful, and it brings additional Value or Resource to Player. However, if a Bet was on a Draw or Lose, the Bet is faild. All Resources used as Bets are not returned, regardless of succesful or failed bet.
- If two or more Actors of the same type are in the same Location, a Conflict occurs between these Actors
- All Actors involved in the Conflict reveal their Arguments and Bets.
- Conflicts between Actors can have Outcome: "Win", "Draw" or "Loss".
- If Actors had Bets, then compare Outcome with Bets:
    - If the "Conflict Outcome" matches the Bet, the Bet is successful.
    - If the "Conflict Outcome" does not match the Bet, the Bet is faild.
    - All Resources used as Bets are not returned, regardless of the Conflict's outcome.
- If for the Actor, Outcome of the Conflict is **Win:** The Actor produce Value or 3 Resources in the Location and bring it to a Player-owner.
- If for the Actor, Outcome of the Conflict is **Lose:** The Actor leave the Location and doesn't bring any Value or Resources to a Player.
- If for the Actor, Outcome of the Conflict is **Draw:** 
  - For Politicians: Resolve the Conflict until only one Politician in the Location. Politician-winner creates Value Power and brings it to a Player-owner.
  - For Scientists: no needs to Resolve the Conflict, all Scientists remain in the Location and considered as winners, all of them create Value Knowledge and bring it to players-owners.
  - For Artists: no needs to Resolve the Conflict, all Artists leave the location and considered as losers. Players-owners don't get Value Art.
  - For Robots: no needs to Resolve the Conflict, all Robots remain in the Location and considered as winners, but all of them create only 1 Resource instead of 3 Resources and bring it to players-owners.
After, Players count amount of Values and Resources, and go to the next Phase.

### Phase 5: Market Phase
Players may purchase Action Card.
- Players may choose to spend Production + Electricity + Recycling (1 unit of each) to buy a random Action Card from the deck.
- The Turn ends after the Market Phase, and next Turn starts from Phase 1.
- If it was the final Turn, game ends after Conflict Resolution Phase, and players count their Victory Points to determine the ultimate winner!
- If two or more players have the same amount of Victory Points, they play one more Turn.
