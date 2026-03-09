// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./libraries/MetarchyTypes.sol";
import "./libraries/RPSLib.sol";
import "./MetarchyTokens.sol";

/// @title MetarchyGame — On-chain game state & move storage for Metarchy
/// @notice Stores the full lifecycle of a Metarchy game session: creation,
///         player distribution (commit-reveal), conflict resolution, resources,
///         and victory-point calculation. Designed for Avalanche C-Chain.
/// @dev    Mirrors the pure-function game engine in frontend/lib/modules/
///         Architecture: all game logic on-chain for trustless 2-player MVP.
///         Action Cards & Events are stubbed — phase machine skips them for now.
contract MetarchyGame is Ownable, ReentrancyGuard {
    using RPSLib for uint8;

    // ═══════════════════════════════════════════════════════════
    // CUSTOM ERRORS
    // ═══════════════════════════════════════════════════════════

    error NotInGame();
    error GameNotActive();
    error WrongPhase(GamePhase expected, GamePhase actual);
    error AlreadyCommitted();
    error AlreadyRevealed();
    error HashMismatch();
    error InvalidPlacement(uint8 actorType, uint8 location);
    error DuplicateActorType(uint8 actorType);
    error DuplicateArgument(uint8 argument);
    error GameFull();
    error NotEnoughPlayers();
    error OnlyCreator();
    error AlreadyJoined();
    error InsufficientResource(uint8 resourceKey);
    error ConflictsAlreadyProcessed();
    error ConflictNotPending(uint8 index);
    error NotConflictParticipant();
    error InvalidChoice();

    // ═══════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════

    MetarchyTokens public immutable tokens;
    address public gameServer;
    uint256 public nextGameId;

    /// @dev Feature flags for MVP — skip Action & Event phases
    bool public actionPhaseEnabled;
    bool public eventPhaseEnabled;
    bool public marketPhaseEnabled;

    // ─── Core game storage ──────────────────────────────────
    mapping(uint256 => GameSession)                             internal _games;
    mapping(uint256 => address[])                               internal _gamePlayers;
    mapping(uint256 => mapping(address => PlayerState))         internal _playerStates;

    // ─── Turn-level move storage ────────────────────────────
    /// gameId ⇒ turn ⇒ player ⇒ TurnMoves
    mapping(uint256 => mapping(uint8 => mapping(address => TurnMoves)))
        internal _turnMoves;

    // ─── Conflict storage ───────────────────────────────────
    /// gameId ⇒ turn ⇒ ConflictRecord[]
    mapping(uint256 => mapping(uint8 => ConflictRecord[]))      internal _turnConflicts;
    /// gameId ⇒ turn ⇒ true once processConflicts() has been called
    mapping(uint256 => mapping(uint8 => bool))                  internal _conflictsProcessed;
    /// gameId ⇒ turn ⇒ count of still-unresolved conflicts
    mapping(uint256 => mapping(uint8 => uint8))                 internal _pendingConflicts;

    // ─── Conflict re-resolution commit-reveal ───────────────
    /// gameId ⇒ turn ⇒ conflictIndex ⇒ player ⇒ ResolveCommit
    mapping(uint256 => mapping(uint8 => mapping(uint8 => mapping(address => ResolveCommit))))
        internal _resolveCommits;
    /// gameId ⇒ turn ⇒ conflictIndex ⇒ commitCount
    mapping(uint256 => mapping(uint8 => mapping(uint8 => uint8)))
        internal _resolveCommitCount;
    /// gameId ⇒ turn ⇒ conflictIndex ⇒ revealCount
    mapping(uint256 => mapping(uint8 => mapping(uint8 => uint8)))
        internal _resolveRevealCount;

    // ─── Phase confirmations ────────────────────────────────
    mapping(uint256 => mapping(uint8 => mapping(address => bool))) internal _phaseConfirmed;
    mapping(uint256 => mapping(uint8 => uint8))                     internal _phaseConfirmCount;

    // ─── Disabled locations bitmask ─────────────────────────
    /// gameId ⇒ turn ⇒ bitmask (bit N ⇒ location N disabled)
    mapping(uint256 => mapping(uint8 => uint8))                 public disabledLocations;

    // ═══════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════

    event GameCreated(uint256 indexed gameId, address indexed creator, uint8 maxPlayers);
    event PlayerJoined(uint256 indexed gameId, address indexed player);
    event GameStarted(uint256 indexed gameId, uint8 maxTurns);
    event PhaseChanged(uint256 indexed gameId, GamePhase phase, uint8 turn);
    event MoveCommitted(uint256 indexed gameId, address indexed player, uint8 turn);
    event MoveRevealed(uint256 indexed gameId, address indexed player, uint8 turn);
    event ConflictCreated(uint256 indexed gameId, uint8 turn, uint8 conflictIndex, uint8 location, uint8 actorType);
    event ConflictResolved(uint256 indexed gameId, uint8 turn, uint8 conflictIndex, address winner);
    event PeacefulReward(uint256 indexed gameId, address indexed player, uint8 actorType, uint8 resourceKey, uint8 amount);
    event ConflictReward(uint256 indexed gameId, address indexed player, uint8 resourceKey, uint8 amount);
    event BetResult(uint256 indexed gameId, address indexed player, uint8 betType, bool success);
    event GameFinished(uint256 indexed gameId, address indexed winner, uint8 winnerVP);

    // ═══════════════════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════════════════

    modifier onlyPlayer(uint256 gameId) {
        if (!_playerStates[gameId][msg.sender].hasJoined) revert NotInGame();
        _;
    }

    modifier onlyServerOrOwner() {
        require(msg.sender == gameServer || msg.sender == owner(), "Not authorized");
        _;
    }

    modifier inPhase(uint256 gameId, GamePhase expected) {
        GamePhase actual = _games[gameId].currentPhase;
        if (actual != expected) revert WrongPhase(expected, actual);
        _;
    }

    modifier gameActive(uint256 gameId) {
        if (_games[gameId].status != GameStatus.Playing) revert GameNotActive();
        _;
    }

    // ═══════════════════════════════════════════════════════════
    // CONSTRUCTOR & ADMIN
    // ═══════════════════════════════════════════════════════════

    constructor(address _tokens) Ownable(msg.sender) {
        tokens = MetarchyTokens(_tokens);
    }

    function setGameServer(address _server) external onlyOwner {
        gameServer = _server;
    }

    function setActionPhaseEnabled(bool _enabled) external onlyOwner {
        actionPhaseEnabled = _enabled;
    }

    function setEventPhaseEnabled(bool _enabled) external onlyOwner {
        eventPhaseEnabled = _enabled;
    }

    function setMarketPhaseEnabled(bool _enabled) external onlyOwner {
        marketPhaseEnabled = _enabled;
    }

    // ═══════════════════════════════════════════════════════════
    // LOBBY
    // ═══════════════════════════════════════════════════════════

    /// @notice Create a new game session. Caller auto-joins as first player.
    function createGame(uint8 maxPlayers) external returns (uint256) {
        require(maxPlayers >= 2 && maxPlayers <= 5, "2-5 players");

        uint256 gameId = nextGameId++;
        GameSession storage g = _games[gameId];
        g.id = uint64(gameId);
        g.status = GameStatus.Waiting;
        g.maxPlayers = maxPlayers;
        g.currentTurn = 1;
        g.maxTurns = RPSLib.getMaxTurns(maxPlayers);
        g.currentPhase = GamePhase.Lobby;
        g.createdAt = uint64(block.timestamp);
        g.creator = msg.sender;

        _addPlayer(gameId, msg.sender);

        emit GameCreated(gameId, msg.sender, maxPlayers);
        return gameId;
    }

    /// @notice Join an existing game in the Lobby phase.
    function joinGame(uint256 gameId) external {
        GameSession storage g = _games[gameId];
        if (g.status != GameStatus.Waiting) revert GameNotActive();
        if (g.playerCount >= g.maxPlayers) revert GameFull();
        if (_playerStates[gameId][msg.sender].hasJoined) revert AlreadyJoined();

        _addPlayer(gameId, msg.sender);
        emit PlayerJoined(gameId, msg.sender);
    }

    /// @notice Creator starts the game once enough players have joined.
    function startGame(uint256 gameId) external {
        GameSession storage g = _games[gameId];
        if (msg.sender != g.creator) revert OnlyCreator();
        if (g.status != GameStatus.Waiting) revert GameNotActive();
        if (g.playerCount < 2) revert NotEnoughPlayers();

        g.status = GameStatus.Playing;
        // Turn 1 skips Event phase → go directly to Distribution
        g.currentPhase = GamePhase.DistributionCommit;

        emit GameStarted(gameId, g.maxTurns);
        emit PhaseChanged(gameId, GamePhase.DistributionCommit, 1);
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: DISTRIBUTION — COMMIT-REVEAL
    // ═══════════════════════════════════════════════════════════

    /// @notice Submit a hash of your 4-actor distribution. Mirrors the
    ///         commit-reveal scheme described in docs/flow_MVP.md.
    function commitDistribution(uint256 gameId, bytes32 commitHash)
        external
        onlyPlayer(gameId)
        gameActive(gameId)
        inPhase(gameId, GamePhase.DistributionCommit)
    {
        PlayerState storage ps = _playerStates[gameId][msg.sender];
        if (ps.commitHash != bytes32(0)) revert AlreadyCommitted();

        ps.commitHash = commitHash;
        _games[gameId].committedCount++;

        emit MoveCommitted(gameId, msg.sender, _games[gameId].currentTurn);

        // Auto-advance when all players committed
        if (_games[gameId].committedCount == _games[gameId].playerCount) {
            _games[gameId].currentPhase = GamePhase.DistributionReveal;
            emit PhaseChanged(gameId, GamePhase.DistributionReveal, _games[gameId].currentTurn);
        }
    }

    /// @notice Reveal your 4-actor placements. The contract verifies the hash,
    ///         validates all placements, deducts bet resources, and stores moves.
    /// @param moveData  16 bytes packed: actorTypes[4] ++ locations[4] ++ arguments[4] ++ bets[4]
    /// @param salt      Random salt used during commit
    function revealDistribution(
        uint256 gameId,
        bytes calldata moveData,
        bytes32 salt
    )
        external
        onlyPlayer(gameId)
        gameActive(gameId)
        inPhase(gameId, GamePhase.DistributionReveal)
    {
        require(moveData.length == 16, "moveData must be 16 bytes");
        PlayerState storage ps = _playerStates[gameId][msg.sender];
        if (ps.revealed) revert AlreadyRevealed();

        // ── Verify hash ─────────────────────────────────────
        bytes32 expectedHash = keccak256(
            abi.encodePacked(gameId, _games[gameId].currentTurn, moveData, salt)
        );
        if (ps.commitHash != expectedHash) revert HashMismatch();

        // ── Unpack moveData ─────────────────────────────────
        uint8[4] memory actorTypes;
        uint8[4] memory locations;
        uint8[4] memory arguments;
        uint8[4] memory bets;
        for (uint8 i = 0; i < 4; i++) {
            actorTypes[i] = uint8(moveData[i]);
            locations[i]  = uint8(moveData[4 + i]);
            arguments[i]  = uint8(moveData[8 + i]);
            bets[i]       = uint8(moveData[12 + i]);
        }

        // ── Validate & store placements ─────────────────────
        _validateAndStoreMoves(gameId, msg.sender, actorTypes, locations, arguments, bets);

        // ── Consume bet resources ───────────────────────────
        for (uint8 i = 0; i < 4; i++) {
            if (bets[i] != GameConstants.BET_NONE) {
                _consumeBetResource(gameId, msg.sender, bets[i]);
            }
        }

        ps.revealed = true;
        _games[gameId].revealedCount++;

        emit MoveRevealed(gameId, msg.sender, _games[gameId].currentTurn);

        // Auto-advance when all players revealed
        if (_games[gameId].revealedCount == _games[gameId].playerCount) {
            _resetCommitReveal(gameId);

            if (actionPhaseEnabled) {
                _games[gameId].currentPhase = GamePhase.Action;
                emit PhaseChanged(gameId, GamePhase.Action, _games[gameId].currentTurn);
            } else {
                _games[gameId].currentPhase = GamePhase.ConflictResolution;
                emit PhaseChanged(gameId, GamePhase.ConflictResolution, _games[gameId].currentTurn);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 3: ACTION CARDS (stub — enable via flag)
    // ═══════════════════════════════════════════════════════════

    /// @notice Confirm you're done with the Action phase (no cards to play).
    ///         When all players confirm, phase advances to ConflictResolution.
    function confirmActionPhase(uint256 gameId)
        external
        onlyPlayer(gameId)
        gameActive(gameId)
        inPhase(gameId, GamePhase.Action)
    {
        uint8 turn = _games[gameId].currentTurn;
        require(!_phaseConfirmed[gameId][turn][msg.sender], "Already confirmed");

        _phaseConfirmed[gameId][turn][msg.sender] = true;
        _phaseConfirmCount[gameId][turn]++;

        if (_phaseConfirmCount[gameId][turn] == _games[gameId].playerCount) {
            _games[gameId].currentPhase = GamePhase.ConflictResolution;
            emit PhaseChanged(gameId, GamePhase.ConflictResolution, turn);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 4: CONFLICT RESOLUTION
    // ═══════════════════════════════════════════════════════════

    /// @notice Detect and resolve all conflicts for the current turn.
    ///         Deterministic — callable by anyone (server or player).
    ///         Reads stored placements and computes RPS outcomes on-chain.
    function processConflicts(uint256 gameId)
        external
        gameActive(gameId)
        inPhase(gameId, GamePhase.ConflictResolution)
    {
        uint8 turn = _games[gameId].currentTurn;
        if (_conflictsProcessed[gameId][turn]) revert ConflictsAlreadyProcessed();
        _conflictsProcessed[gameId][turn] = true;

        uint8 playerCount = _games[gameId].playerCount;
        uint8 pendingCount = 0;

        // ── Detect conflicts: compare every player pair's placements ──
        for (uint8 i = 0; i < playerCount; i++) {
            for (uint8 j = i + 1; j < playerCount; j++) {
                address pi = _gamePlayers[gameId][i];
                address pj = _gamePlayers[gameId][j];

                for (uint8 ai = 0; ai < 4; ai++) {
                    ActorPlacement storage mI = _turnMoves[gameId][turn][pi].placements[ai];
                    for (uint8 aj = 0; aj < 4; aj++) {
                        ActorPlacement storage mJ = _turnMoves[gameId][turn][pj].placements[aj];

                        // Conflict = same actor type at same location
                        if (mI.actorType == mJ.actorType && mI.location == mJ.location) {
                            // Skip disabled locations
                            if (_isLocationDisabled(gameId, turn, mI.location)) continue;

                            uint8 cIdx = uint8(_turnConflicts[gameId][turn].length);
                            _turnConflicts[gameId][turn].push(ConflictRecord({
                                location: mI.location,
                                actorType: mI.actorType,
                                player1: pi,
                                player2: pj,
                                arg1: mI.argument,
                                arg2: mJ.argument,
                                bet1: mI.bet,
                                bet2: mJ.bet,
                                winner: address(0),
                                resolved: false,
                                needsResolve: false
                            }));

                            emit ConflictCreated(gameId, turn, cIdx, mI.location, mI.actorType);

                            // ── Resolve RPS ────────────────────
                            uint8 outcome = RPSLib.resolve(mI.argument, mJ.argument);
                            ConflictRecord storage conf = _turnConflicts[gameId][turn][cIdx];

                            if (outcome == GameConstants.OUTCOME_WIN) {
                                // Check if P2 has electricity bet (bet on lose → re-resolve)
                                if (mJ.bet == GameConstants.BET_ELECTRICITY) {
                                    conf.needsResolve = true;
                                    pendingCount++;
                                    emit BetResult(gameId, pj, GameConstants.BET_ELECTRICITY, true);
                                } else {
                                    conf.winner = pi;
                                    conf.resolved = true;
                                    _applyWinRewards(gameId, conf, pi);
                                    emit ConflictResolved(gameId, turn, cIdx, pi);
                                }
                            } else if (outcome == GameConstants.OUTCOME_LOSE) {
                                // Check if P1 has electricity bet
                                if (mI.bet == GameConstants.BET_ELECTRICITY) {
                                    conf.needsResolve = true;
                                    pendingCount++;
                                    emit BetResult(gameId, pi, GameConstants.BET_ELECTRICITY, true);
                                } else {
                                    conf.winner = pj;
                                    conf.resolved = true;
                                    _applyWinRewards(gameId, conf, pj);
                                    emit ConflictResolved(gameId, turn, cIdx, pj);
                                }
                            } else {
                                // DRAW — check recycling bets first
                                bool p1Recycle = (mI.bet == GameConstants.BET_RECYCLING);
                                bool p2Recycle = (mJ.bet == GameConstants.BET_RECYCLING);

                                if (p1Recycle && !p2Recycle) {
                                    // P1's recycle bet succeeds → draw→win
                                    conf.winner = pi;
                                    conf.resolved = true;
                                    _applyWinRewards(gameId, conf, pi);
                                    emit BetResult(gameId, pi, GameConstants.BET_RECYCLING, true);
                                    emit ConflictResolved(gameId, turn, cIdx, pi);
                                } else if (p2Recycle && !p1Recycle) {
                                    conf.winner = pj;
                                    conf.resolved = true;
                                    _applyWinRewards(gameId, conf, pj);
                                    emit BetResult(gameId, pj, GameConstants.BET_RECYCLING, true);
                                    emit ConflictResolved(gameId, turn, cIdx, pj);
                                } else {
                                    // True draw — actor-specific behavior
                                    _handleDrawConflict(gameId, turn, cIdx);
                                    if (!_turnConflicts[gameId][turn][cIdx].resolved) {
                                        pendingCount++;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // ── Handle peaceful actors (no conflict) ────────────
        _handlePeacefulActors(gameId, turn);

        _pendingConflicts[gameId][turn] = pendingCount;

        // ── Advance phase or enter re-resolution ────────────
        if (pendingCount > 0) {
            _games[gameId].currentPhase = GamePhase.ConflictResolveCommit;
            emit PhaseChanged(gameId, GamePhase.ConflictResolveCommit, turn);
        } else {
            _advanceFromConflict(gameId);
        }
    }

    // ─── Conflict re-resolution (politician draws) ──────────

    /// @notice Commit a new RPS choice for an unresolved conflict.
    function commitConflictChoice(uint256 gameId, uint8 conflictIndex, bytes32 commitHash)
        external
        onlyPlayer(gameId)
        gameActive(gameId)
        inPhase(gameId, GamePhase.ConflictResolveCommit)
    {
        uint8 turn = _games[gameId].currentTurn;
        ConflictRecord storage conf = _turnConflicts[gameId][turn][conflictIndex];
        if (conf.resolved || !conf.needsResolve) revert ConflictNotPending(conflictIndex);
        if (msg.sender != conf.player1 && msg.sender != conf.player2) revert NotConflictParticipant();

        ResolveCommit storage rc = _resolveCommits[gameId][turn][conflictIndex][msg.sender];
        if (rc.committed) revert AlreadyCommitted();

        rc.hash = commitHash;
        rc.committed = true;
        _resolveCommitCount[gameId][turn][conflictIndex]++;

        // When both participants committed → move to reveal
        if (_resolveCommitCount[gameId][turn][conflictIndex] == 2) {
            _games[gameId].currentPhase = GamePhase.ConflictResolveReveal;
            emit PhaseChanged(gameId, GamePhase.ConflictResolveReveal, turn);
        }
    }

    /// @notice Reveal your RPS choice for an unresolved conflict.
    function revealConflictChoice(
        uint256 gameId,
        uint8 conflictIndex,
        uint8 choice,
        bytes32 salt
    )
        external
        onlyPlayer(gameId)
        gameActive(gameId)
        inPhase(gameId, GamePhase.ConflictResolveReveal)
    {
        if (choice > GameConstants.SCISSORS) revert InvalidChoice(); // no dummy in re-fights
        uint8 turn = _games[gameId].currentTurn;
        ConflictRecord storage conf = _turnConflicts[gameId][turn][conflictIndex];

        ResolveCommit storage rc = _resolveCommits[gameId][turn][conflictIndex][msg.sender];
        if (rc.revealed) revert AlreadyRevealed();

        // Verify hash
        bytes32 expected = keccak256(
            abi.encodePacked(gameId, turn, conflictIndex, choice, salt)
        );
        if (rc.hash != expected) revert HashMismatch();

        rc.choice = choice;
        rc.revealed = true;
        _resolveRevealCount[gameId][turn][conflictIndex]++;

        // When both revealed → resolve
        if (_resolveRevealCount[gameId][turn][conflictIndex] == 2) {
            ResolveCommit storage rc1 = _resolveCommits[gameId][turn][conflictIndex][conf.player1];
            ResolveCommit storage rc2 = _resolveCommits[gameId][turn][conflictIndex][conf.player2];

            uint8 outcome = RPSLib.resolve(rc1.choice, rc2.choice);

            if (outcome == GameConstants.OUTCOME_WIN) {
                conf.winner = conf.player1;
                conf.resolved = true;
                conf.needsResolve = false;
                _pendingConflicts[gameId][turn]--;
                _applyWinRewards(gameId, conf, conf.player1);
                emit ConflictResolved(gameId, turn, conflictIndex, conf.player1);
            } else if (outcome == GameConstants.OUTCOME_LOSE) {
                conf.winner = conf.player2;
                conf.resolved = true;
                conf.needsResolve = false;
                _pendingConflicts[gameId][turn]--;
                _applyWinRewards(gameId, conf, conf.player2);
                emit ConflictResolved(gameId, turn, conflictIndex, conf.player2);
            } else {
                // Still draw → reset commit-reveal for another round
                _resetConflictCommits(gameId, turn, conflictIndex, conf.player1, conf.player2);
                _games[gameId].currentPhase = GamePhase.ConflictResolveCommit;
                emit PhaseChanged(gameId, GamePhase.ConflictResolveCommit, turn);
                return; // exit early, don't advance
            }

            // Check if all conflicts resolved
            if (_pendingConflicts[gameId][turn] == 0) {
                _advanceFromConflict(gameId);
            } else {
                // More conflicts pending — go back to commit phase
                _games[gameId].currentPhase = GamePhase.ConflictResolveCommit;
                emit PhaseChanged(gameId, GamePhase.ConflictResolveCommit, turn);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 5: MARKET (stub — enable via flag)
    // ═══════════════════════════════════════════════════════════

    /// @notice Buy a random action card: costs 1 product + 1 electricity + 1 recycling.
    ///         Mirrors canBuyActionCard() in modules/market/marketLogic.ts
    function buyActionCard(uint256 gameId)
        external
        onlyPlayer(gameId)
        gameActive(gameId)
        inPhase(gameId, GamePhase.Market)
    {
        PlayerResources storage res = _playerStates[gameId][msg.sender].resources;
        if (res.product < 1) revert InsufficientResource(GameConstants.RES_PRODUCT);
        if (res.electricity < 1) revert InsufficientResource(GameConstants.RES_ELECTRICITY);
        if (res.recycling < 1) revert InsufficientResource(GameConstants.RES_RECYCLING);

        res.product--;
        res.electricity--;
        res.recycling--;

        // TODO: mint a random action card token via MetarchyTokens
        // For now, just emit event
        emit ConflictReward(gameId, msg.sender, 0, 1); // placeholder
    }

    /// @notice Confirm you're done with the Market phase.
    function confirmMarketPhase(uint256 gameId)
        external
        onlyPlayer(gameId)
        gameActive(gameId)
        inPhase(gameId, GamePhase.Market)
    {
        uint8 turn = _games[gameId].currentTurn;
        require(!_phaseConfirmed[gameId][turn][msg.sender], "Already confirmed");

        _phaseConfirmed[gameId][turn][msg.sender] = true;
        _phaseConfirmCount[gameId][turn]++;

        if (_phaseConfirmCount[gameId][turn] == _games[gameId].playerCount) {
            _advanceFromMarket(gameId);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE MANAGEMENT (internal)
    // ═══════════════════════════════════════════════════════════

    /// @dev Advance from ConflictResolution → Market or next turn.
    function _advanceFromConflict(uint256 gameId) internal {
        GameSession storage g = _games[gameId];

        // Final turn → game ends after conflict (rules: no Market on final turn)
        if (g.currentTurn >= g.maxTurns) {
            _finishGame(gameId);
            return;
        }

        if (marketPhaseEnabled) {
            g.currentPhase = GamePhase.Market;
            emit PhaseChanged(gameId, GamePhase.Market, g.currentTurn);
        } else {
            _advanceToNextTurn(gameId);
        }
    }

    /// @dev Advance from Market → next turn.
    function _advanceFromMarket(uint256 gameId) internal {
        _advanceToNextTurn(gameId);
    }

    /// @dev Move to next turn: increment turn counter, set phase to Event or Distribution.
    function _advanceToNextTurn(uint256 gameId) internal {
        GameSession storage g = _games[gameId];
        g.currentTurn++;

        // Reset per-turn phase confirmations (reuse turn index)
        // (phaseConfirmed is keyed by turn, so new turn = clean slate)

        if (eventPhaseEnabled && g.currentTurn > 1) {
            g.currentPhase = GamePhase.Event;
            emit PhaseChanged(gameId, GamePhase.Event, g.currentTurn);
        } else {
            g.currentPhase = GamePhase.DistributionCommit;
            emit PhaseChanged(gameId, GamePhase.DistributionCommit, g.currentTurn);
        }
    }

    /// @dev End the game: calculate VP, determine winner.
    function _finishGame(uint256 gameId) internal {
        GameSession storage g = _games[gameId];
        g.status = GameStatus.Finished;
        g.currentPhase = GamePhase.Finished;

        address bestPlayer = address(0);
        uint8 bestVP = 0;

        for (uint8 i = 0; i < g.playerCount; i++) {
            address p = _gamePlayers[gameId][i];
            uint8 vp = calculateVP(gameId, p);
            if (vp > bestVP) {
                bestVP = vp;
                bestPlayer = p;
            }
        }

        g.winner = bestPlayer;
        emit GameFinished(gameId, bestPlayer, bestVP);
        emit PhaseChanged(gameId, GamePhase.Finished, g.currentTurn);
    }

    /// @dev Reset commit-reveal counters between phases.
    function _resetCommitReveal(uint256 gameId) internal {
        GameSession storage g = _games[gameId];
        g.committedCount = 0;
        g.revealedCount = 0;

        for (uint8 i = 0; i < g.playerCount; i++) {
            address p = _gamePlayers[gameId][i];
            _playerStates[gameId][p].commitHash = bytes32(0);
            _playerStates[gameId][p].revealed = false;
        }
    }

    /// @dev Reset conflict re-resolution commits for another round.
    function _resetConflictCommits(
        uint256 gameId,
        uint8 turn,
        uint8 conflictIndex,
        address p1,
        address p2
    ) internal {
        delete _resolveCommits[gameId][turn][conflictIndex][p1];
        delete _resolveCommits[gameId][turn][conflictIndex][p2];
        _resolveCommitCount[gameId][turn][conflictIndex] = 0;
        _resolveRevealCount[gameId][turn][conflictIndex] = 0;
    }

    // ═══════════════════════════════════════════════════════════
    // CONFLICT HELPERS (internal)
    // ═══════════════════════════════════════════════════════════

    /// @dev Handle a draw based on actor type:
    ///   Politician → needsResolve=true (re-fight)
    ///   Scientist  → both win (share knowledge)
    ///   Artist     → both lose (no art)
    ///   Robot      → both get 1 resource (instead of 3)
    function _handleDrawConflict(uint256 gameId, uint8 turn, uint8 conflictIndex) internal {
        ConflictRecord storage conf = _turnConflicts[gameId][turn][conflictIndex];
        uint8 actorType = conf.actorType;

        if (actorType == GameConstants.POLITICIAN) {
            // Must re-fight until win/lose
            conf.needsResolve = true;
        } else if (actorType == GameConstants.SCIENTIST) {
            // Both scientists win — each gets 1 knowledge
            conf.resolved = true;
            _addResource(gameId, conf.player1, GameConstants.RES_KNOWLEDGE, 1);
            _addResource(gameId, conf.player2, GameConstants.RES_KNOWLEDGE, 1);
            emit ConflictReward(gameId, conf.player1, GameConstants.RES_KNOWLEDGE, 1);
            emit ConflictReward(gameId, conf.player2, GameConstants.RES_KNOWLEDGE, 1);
            emit ConflictResolved(gameId, turn, conflictIndex, address(0));
        } else if (actorType == GameConstants.ARTIST) {
            // Both artists lose — nobody gets art
            conf.resolved = true;
            emit ConflictResolved(gameId, turn, conflictIndex, address(0));
        } else if (actorType == GameConstants.ROBOT) {
            // Both robots get 1 resource (reduced from 3)
            conf.resolved = true;
            uint8 resKey = RPSLib.locationResource(conf.location);
            _addResource(gameId, conf.player1, resKey, 1);
            _addResource(gameId, conf.player2, resKey, 1);
            emit ConflictReward(gameId, conf.player1, resKey, 1);
            emit ConflictReward(gameId, conf.player2, resKey, 1);
            emit ConflictResolved(gameId, turn, conflictIndex, address(0));
        }
    }

    /// @dev Apply win rewards + check production bet bonus.
    function _applyWinRewards(uint256 gameId, ConflictRecord storage conf, address winner) internal {
        uint8 actorType = conf.actorType;
        uint8 rewardKey;
        uint8 baseAmount;

        if (actorType == GameConstants.ROBOT) {
            rewardKey = RPSLib.locationResource(conf.location);
            baseAmount = 3;
        } else {
            rewardKey = RPSLib.actorRewardKey(actorType);
            baseAmount = 1;
        }

        // Check production bet (bet on win) → +1 bonus
        uint8 winnerBet = (winner == conf.player1) ? conf.bet1 : conf.bet2;
        uint8 bonus = 0;
        if (winnerBet == GameConstants.BET_PRODUCT) {
            bonus = 1;
            emit BetResult(gameId, winner, GameConstants.BET_PRODUCT, true);
        }

        _addResource(gameId, winner, rewardKey, baseAmount + bonus);
        emit ConflictReward(gameId, winner, rewardKey, baseAmount + bonus);
    }

    /// @dev Handle actors not involved in any conflict — auto-win rewards.
    function _handlePeacefulActors(uint256 gameId, uint8 turn) internal {
        uint8 conflictCount = uint8(_turnConflicts[gameId][turn].length);

        for (uint8 p = 0; p < _games[gameId].playerCount; p++) {
            address player = _gamePlayers[gameId][p];
            TurnMoves storage moves = _turnMoves[gameId][turn][player];

            for (uint8 a = 0; a < 4; a++) {
                ActorPlacement storage pl = moves.placements[a];

                // Skip disabled locations
                if (_isLocationDisabled(gameId, turn, pl.location)) continue;

                // Check if this actor is in any conflict
                bool inConflict = false;
                for (uint8 c = 0; c < conflictCount; c++) {
                    ConflictRecord storage conf = _turnConflicts[gameId][turn][c];
                    if (conf.location == pl.location && conf.actorType == pl.actorType) {
                        if (conf.player1 == player || conf.player2 == player) {
                            inConflict = true;
                            break;
                        }
                    }
                }

                if (!inConflict) {
                    _applyPeacefulRewards(gameId, player, pl);
                }
            }
        }
    }

    /// @dev Reward a peaceful actor (no opponent at its location).
    ///      Win bet succeeds automatically, other bets fail.
    function _applyPeacefulRewards(
        uint256 gameId,
        address player,
        ActorPlacement storage pl
    ) internal {
        uint8 rewardKey;
        uint8 baseAmount;

        if (pl.actorType == GameConstants.ROBOT) {
            rewardKey = RPSLib.locationResource(pl.location);
            baseAmount = 3;
        } else {
            rewardKey = RPSLib.actorRewardKey(pl.actorType);
            baseAmount = 1;
        }

        // Production bet succeeds for peaceful actors (auto-win)
        uint8 bonus = 0;
        if (pl.bet == GameConstants.BET_PRODUCT) {
            bonus = 1;
            emit BetResult(gameId, player, GameConstants.BET_PRODUCT, true);
        }

        _addResource(gameId, player, rewardKey, baseAmount + bonus);
        emit PeacefulReward(gameId, player, pl.actorType, rewardKey, baseAmount + bonus);
    }

    function _isLocationDisabled(uint256 gameId, uint8 turn, uint8 location) internal view returns (bool) {
        return (disabledLocations[gameId][turn] & (1 << location)) != 0;
    }

    // ═══════════════════════════════════════════════════════════
    // RESOURCE MANAGEMENT (internal)
    // ═══════════════════════════════════════════════════════════

    function _addPlayer(uint256 gameId, address playerAddr) internal {
        _gamePlayers[gameId].push(playerAddr);
        _games[gameId].playerCount++;

        PlayerState storage ps = _playerStates[gameId][playerAddr];
        ps.addr = playerAddr;
        ps.hasJoined = true;
        _initResources(gameId, playerAddr);
    }

    function _initResources(uint256 gameId, address player) internal {
        PlayerResources storage r = _playerStates[gameId][player].resources;
        r.gato = GameConstants.DEFAULT_GATO;
        r.product = GameConstants.DEFAULT_MATERIAL;
        r.electricity = GameConstants.DEFAULT_MATERIAL;
        r.recycling = GameConstants.DEFAULT_MATERIAL;
        r.power = 0;
        r.art = 0;
        r.knowledge = 0;
        r.fame = 0;
    }

    function _addResource(uint256 gameId, address player, uint8 key, uint8 amount) internal {
        PlayerResources storage r = _playerStates[gameId][player].resources;
        if      (key == GameConstants.RES_PRODUCT)     r.product     += amount;
        else if (key == GameConstants.RES_ELECTRICITY)  r.electricity += amount;
        else if (key == GameConstants.RES_RECYCLING)    r.recycling   += amount;
        else if (key == GameConstants.RES_POWER)        r.power       += amount;
        else if (key == GameConstants.RES_ART)          r.art         += amount;
        else if (key == GameConstants.RES_KNOWLEDGE)    r.knowledge   += amount;
        else if (key == GameConstants.RES_FAME)         r.fame        += amount;
    }

    function _consumeBetResource(uint256 gameId, address player, uint8 betType) internal {
        PlayerResources storage r = _playerStates[gameId][player].resources;
        if (betType == GameConstants.BET_PRODUCT) {
            if (r.product < 1) revert InsufficientResource(GameConstants.RES_PRODUCT);
            r.product--;
        } else if (betType == GameConstants.BET_ELECTRICITY) {
            if (r.electricity < 1) revert InsufficientResource(GameConstants.RES_ELECTRICITY);
            r.electricity--;
        } else if (betType == GameConstants.BET_RECYCLING) {
            if (r.recycling < 1) revert InsufficientResource(GameConstants.RES_RECYCLING);
            r.recycling--;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PLACEMENT VALIDATION (internal)
    // ═══════════════════════════════════════════════════════════

    function _validateAndStoreMoves(
        uint256 gameId,
        address player,
        uint8[4] memory actorTypes,
        uint8[4] memory locations,
        uint8[4] memory arguments,
        uint8[4] memory bets
    ) internal {
        uint8 turn = _games[gameId].currentTurn;
        bool[4] memory usedActors;
        bool[4] memory usedArguments;

        for (uint8 i = 0; i < 4; i++) {
            require(actorTypes[i] < GameConstants.NUM_ACTORS, "Invalid actor");
            require(locations[i] < GameConstants.NUM_LOCATIONS, "Invalid location");
            require(arguments[i] < 4, "Invalid argument");
            require(bets[i] < 4, "Invalid bet");

            // Each actor type exactly once
            if (usedActors[actorTypes[i]]) revert DuplicateActorType(actorTypes[i]);
            usedActors[actorTypes[i]] = true;

            // Each argument exactly once
            if (usedArguments[arguments[i]]) revert DuplicateArgument(arguments[i]);
            usedArguments[arguments[i]] = true;

            // Actor ↔ Location allowed
            if (!RPSLib.isValidPlacement(actorTypes[i], locations[i])) {
                revert InvalidPlacement(actorTypes[i], locations[i]);
            }

            // Store
            _turnMoves[gameId][turn][player].placements[i] = ActorPlacement({
                actorType: actorTypes[i],
                location: locations[i],
                argument: arguments[i],
                bet: bets[i]
            });
        }

        _turnMoves[gameId][turn][player].submitted = true;
    }

    // ═══════════════════════════════════════════════════════════
    // VICTORY POINTS (view)
    // ═══════════════════════════════════════════════════════════

    /// @notice Calculate VP for a player: VP = min(Power, Art, Knowledge)
    ///         after distributing Fame as a wildcard to the lowest value.
    ///         Mirrors calculateVictoryPoints() in modules/resources/resourceManager.ts
    function calculateVP(uint256 gameId, address player) public view returns (uint8) {
        PlayerResources memory r = _playerStates[gameId][player].resources;

        uint8 power = r.power;
        uint8 art = r.art;
        uint8 knowledge = r.knowledge;
        uint8 fame = r.fame;

        // Distribute fame greedily to the lowest value
        while (fame > 0) {
            if (power <= art && power <= knowledge) {
                power++;
            } else if (art <= knowledge) {
                art++;
            } else {
                knowledge++;
            }
            fame--;
        }

        // VP = min(power, art, knowledge)
        uint8 minVal = power;
        if (art < minVal) minVal = art;
        if (knowledge < minVal) minVal = knowledge;

        return minVal;
    }

    // ═══════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    function getGame(uint256 gameId) external view returns (GameSession memory) {
        return _games[gameId];
    }

    function getPlayers(uint256 gameId) external view returns (address[] memory) {
        return _gamePlayers[gameId];
    }

    function getPlayerState(uint256 gameId, address player) external view returns (PlayerState memory) {
        return _playerStates[gameId][player];
    }

    function getPlayerResources(uint256 gameId, address player) external view returns (PlayerResources memory) {
        return _playerStates[gameId][player].resources;
    }

    function getTurnMoves(uint256 gameId, uint8 turn, address player)
        external view returns (ActorPlacement[4] memory placements, bool submitted)
    {
        TurnMoves storage tm = _turnMoves[gameId][turn][player];
        return (tm.placements, tm.submitted);
    }

    function getConflicts(uint256 gameId, uint8 turn) external view returns (ConflictRecord[] memory) {
        return _turnConflicts[gameId][turn];
    }

    function getConflictCount(uint256 gameId, uint8 turn) external view returns (uint256) {
        return _turnConflicts[gameId][turn].length;
    }

    function getPendingConflicts(uint256 gameId, uint8 turn) external view returns (uint8) {
        return _pendingConflicts[gameId][turn];
    }

    // ═══════════════════════════════════════════════════════════
    // HASH HELPERS (pure — for frontend integration)
    // ═══════════════════════════════════════════════════════════

    /// @notice Reproduce the distribution commit hash for off-chain verification.
    ///         moveData = packed 16 bytes: actorTypes[4] ++ locations[4] ++ arguments[4] ++ bets[4]
    ///         Frontend MUST use this exact encoding to compute the commit hash.
    function computeDistributionHash(
        uint256 gameId,
        uint8 turn,
        bytes calldata moveData,
        bytes32 salt
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(gameId, turn, moveData, salt));
    }

    /// @notice Reproduce the conflict re-resolution commit hash.
    function computeConflictHash(
        uint256 gameId,
        uint8 turn,
        uint8 conflictIndex,
        uint8 choice,
        bytes32 salt
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(gameId, turn, conflictIndex, choice, salt));
    }
}
