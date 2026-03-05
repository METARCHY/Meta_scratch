The flow of Metarchy game for two players: Player1 (P1) and Player2 (P2) 
 We will use next dictionary: Location - L University - U Square - S Theater - T Factory - F
Power Plant - P
Dump - D
 Actor - A Politician - P Scientist - S Artist - A
Robot - R
 Argument - a Rock - R Scissors - S
Paper - P
Dummy - D
 Bet - B
Production (bet on Win) - W
Electricity (bet on Lose) - L Recycling (bet on Draw) - D If no bet - 0
 If Player1 sent Scientist with Paper to University and add Recycling to bet on Draw, we can record it: “P1: LU-AS-aP-BD” As every Player needs to send 4 Actors, it will be an example of data from Player1: P1: LU-AS-aP-BD LS-AP-aR-BL LT-AA-aS-B0 LD-AR-aD-BW  
# Turn 1

## Distribution Phase

Player send Actor to Location. Player choose one of four Arguments for Actor. Player choose to add or not to add Bet for this Actor. To add a Bet - Player need to have resources for Bets. If Player don’t have resources for Bet - Player can’t add Bet even if want. Player repeat this process for each Actor.  After Player satisfied with distribution of Actors on the game field, Player click on the button “Next Phase”. 
After Player click on the button “Next Phase”, the data about players's distribution need to be encrypted. Example of data: “P1: LU-AS-aP-BD LS-AP-aR-BL LT-AA-aS-B0 LD-AR-aD-BW” 
Encrypted data is sent to Game Server.
Game Server play the role of independent third party. Game Server gets the encrypted data from Player1, and wait for encrypted data from Player2.

After Game Server get encrypted data from all players (it means that all players distribute their actors with arguments among locations and clicked on the button “Next Phase”), Game Server create a transaction with encrypted data and send it to the blockchain. After transaction with the encrypted data in the blockchain - new phase begins.
 Note: It can be any blockchain, we need to develop Metarchy the way it possible to deploy on any blockchain, as a blockchain is just a source of proof.
Also it means that Game Server has own private key (own address) and can create transactions, sign transactions, and also get data from the blockchain. For now, let’s use Avalanche MCP Server: https://build.avax.network/docs/tooling/ai-llm/mcp-server If you don’t understand how to use it, create skill for this

## Action Phase (Archived, will be added later)

## Conflict Phase

Game Server needs to decrypt the data, and show to Players the distribution of Actors with Arguments in the Locations, and do they have Bets or not. Players can see in which Locations they have conflicts between Actors, and which Actors don’t have conflicts.
At first, game check Actors that don’t have conflicts, and check their Bets. Actors without conflict are returning back to players and bring them Values (Power, Knowledge or Art) or Resources ( 3 Production, 3 Electricity or 3 Recycling) depends of Actor’s type. +1 Value or Resource	if it was a Bet for Win and no conflict.
And we need to show to players which Actors returned back and which Values/Resources they bring to each player.

After, game needs to show to players all conflicts, step-by-step. At first, show conflicts between Politicians in the location Square (if such a conflict exists). Compare Arguments of Politicians and see the result: who is Win, who is Lose, and who have Draw. After, check Bets and compare Bets with an Outcome of conflict. Show it to players. If P1-Politician Win and P2-Politician Lose, then Politician Actors return back to players, and P1-Politician brings to 1 Power to P1.
If P1-Politician Lose and P2-Politician Win, then Politician Actors return back to players, and P2-Politician brings to 1 Power to P2. If P1-Politician and P2-Politician get Draw as the result, game need to start the process of Resolving the Conflict: P1 need to choose Rock, Scissors or Paper and click on the button “Resolve the Conflict”.

After Player click on the button “Resolve the Conflict”, the data about players's decision need to be encrypted. Example of data: “P1: R”.
Encrypted data is sent to Game Server.
Game Server gets the encrypted data from Player1, and wait for encrypted data from Player2.
After Game Server get encrypted data from all players (it means that all players choose Rock, Scissors or Paper an click on button “Resolve the Conflict”), Game Server create a transaction with encrypted data and send it to the blockchain. After transaction with the encrypted data in the blockchain, we can decrypt it and see the Outcome for players: Win-Lose, Lose-Win or Draw. In case of Win-Lose or Lose-Win - we already know what to do. In case of Draw, we need to repeat resolving of conflict, and we need to repeat it until the outcome is Win-Lose or Lose-Win.

After, game needs to show conflicts between Politicians in the location University (if such a conflict exists), and repeat the process of solving conflict, and if it’s needed - resolving conflict.

After, game needs to show conflicts between Scientists in the location University (if such a conflict exists), and repeat the process of solving conflict, and if it’s needed - resolving conflict.
 After, game needs to show conflicts between Scientists in the location Theater (if such a conflict exists), and repeat the process of solving conflict, and if it’s needed - resolving conflict.

After, game needs to show conflicts between Artists in the location Theater (if such a conflict exists), and repeat the process of solving conflict, and if it’s needed - resolving conflict.

After, game needs to show conflicts between Artists in the location Square (if such a conflict exists), and repeat the process of solving conflict, and if it’s needed - resolving conflict.

After, game needs to show conflicts between Robots in the location Factory (if such a conflict exists), and repeat the process of solving conflict, and if it’s needed - resolving conflict.

After, game needs to show conflicts between Robots in the location Power Plant (if such a conflict exists), and repeat the process of solving conflict, and if it’s needed - resolving conflict.

After, game needs to show conflicts between Robots in the location Dump (if such a conflict exists), and repeat the process of solving conflict, and if it’s needed - resolving conflict.

After all conflicts are solved, all Actors with Arguments returned to players, players got Values and/or Resources , and resources that were used as bets are discarded (they don’t return back to players) - we can go to the next phase.

## Market Phase (Archived, will be added later)

# Turn 2

## Event Phase (there is no Event Phase in Turn 1) (Archived, will be added later)

## Distribution Phase

## Action Phase (Archived, will be added later)

## Conflict Phase

## Market Phase (Archived, will be added later)

# Turn 3

## Event Phase (Archived, will be added later)

## Distribution Phase

## Action Phase (Archived, will be added later)

## Conflict Phase

## Market Phase (Archived, will be added later)

# Turn 4

## Event Phase (Archived, will be added later)

## Distribution Phase

## Action Phase (Archived, will be added later)

## Conflict Phase

## Market Phase (Archived, will be added later)

# Turn 5

## Event Phase (Archived, will be added later)

## Distribution Phase

## Action Phase (Archived, will be added later)

## Conflict Phase

## Final Phase

Game needs to count the amount of Valuse each player has. 1 Power + 1 Knowledge + 1 Art = 1 Victory Point
Player who has more Victory Points - Winner of the Game
