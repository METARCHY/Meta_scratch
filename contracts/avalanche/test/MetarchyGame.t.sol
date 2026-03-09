// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MetarchyTokens.sol";
import "../src/MetarchyGame.sol";
import "../src/libraries/MetarchyTypes.sol";

contract MetarchyGameTest is Test {
    MetarchyTokens tokens;
    MetarchyGame game;

    address alice = makeAddr("alice");
    address bob   = makeAddr("bob");

    function setUp() public {
        tokens = new MetarchyTokens();
        game   = new MetarchyGame(address(tokens));
        tokens.setGameContract(address(game));
    }

    // ─── Lobby ──────────────────────────────────────────────

    function test_CreateGame() public {
        vm.prank(alice);
        uint256 gameId = game.createGame(2);

        GameSession memory g = game.getGame(gameId);
        assertEq(g.id, 0);
        assertEq(g.maxPlayers, 2);
        assertEq(g.playerCount, 1);
        assertEq(uint8(g.status), uint8(GameStatus.Waiting));
        assertEq(uint8(g.currentPhase), uint8(GamePhase.Lobby));
        assertEq(g.creator, alice);
    }

    function test_JoinGame() public {
        vm.prank(alice);
        uint256 gameId = game.createGame(2);

        vm.prank(bob);
        game.joinGame(gameId);

        GameSession memory g = game.getGame(gameId);
        assertEq(g.playerCount, 2);

        address[] memory players = game.getPlayers(gameId);
        assertEq(players[0], alice);
        assertEq(players[1], bob);
    }

    function test_StartGame() public {
        uint256 gameId = _createAndStartGame();

        GameSession memory g = game.getGame(gameId);
        assertEq(uint8(g.status), uint8(GameStatus.Playing));
        assertEq(uint8(g.currentPhase), uint8(GamePhase.DistributionCommit));
        assertEq(g.currentTurn, 1);
        assertEq(g.maxTurns, 5);
    }

    function test_StartGame_RevertNotCreator() public {
        vm.prank(alice);
        uint256 gameId = game.createGame(2);
        vm.prank(bob);
        game.joinGame(gameId);

        vm.prank(bob);
        vm.expectRevert(MetarchyGame.OnlyCreator.selector);
        game.startGame(gameId);
    }

    // ─── Resources ──────────────────────────────────────────

    function test_InitialResources() public {
        vm.prank(alice);
        uint256 gameId = game.createGame(2);

        PlayerResources memory r = game.getPlayerResources(gameId, alice);
        assertEq(r.gato, 1000);
        assertEq(r.product, 1);
        assertEq(r.electricity, 1);
        assertEq(r.recycling, 1);
        assertEq(r.power, 0);
        assertEq(r.art, 0);
        assertEq(r.knowledge, 0);
        assertEq(r.fame, 0);
    }

    // ─── Distribution Commit-Reveal ─────────────────────────

    function test_CommitDistribution() public {
        uint256 gameId = _createAndStartGame();

        // Alice commits
        bytes32 hash = _makeDistributionHash(
            gameId, 1,
            _aliceMoveData(),
            bytes32("alice_salt")
        );

        vm.prank(alice);
        game.commitDistribution(gameId, hash);

        GameSession memory g = game.getGame(gameId);
        assertEq(g.committedCount, 1);
        // Still in commit phase (waiting for bob)
        assertEq(uint8(g.currentPhase), uint8(GamePhase.DistributionCommit));
    }

    function test_CommitBothAutoAdvance() public {
        uint256 gameId = _createAndStartGame();

        _commitBoth(gameId, 1);

        GameSession memory g = game.getGame(gameId);
        assertEq(uint8(g.currentPhase), uint8(GamePhase.DistributionReveal));
    }

    function test_FullDistributionCycle() public {
        uint256 gameId = _createAndStartGame();

        _commitBoth(gameId, 1);
        _revealBoth(gameId, 1);

        GameSession memory g = game.getGame(gameId);
        // Should advance to ConflictResolution (action phase disabled by default)
        assertEq(uint8(g.currentPhase), uint8(GamePhase.ConflictResolution));
    }

    function test_RevealDistribution_RevertHashMismatch() public {
        uint256 gameId = _createAndStartGame();
        _commitBoth(gameId, 1);

        // Try to reveal with wrong data
        bytes memory wrongData = abi.encodePacked(
            uint8(3), uint8(2), uint8(1), uint8(0),  // Wrong order!
            uint8(1), uint8(3), uint8(2), uint8(4),
            uint8(0), uint8(1), uint8(2), uint8(3),
            uint8(0), uint8(0), uint8(0), uint8(0)
        );
        vm.prank(alice);
        vm.expectRevert(MetarchyGame.HashMismatch.selector);
        game.revealDistribution(gameId, wrongData, bytes32("alice_salt"));
    }

    // ─── Conflict Processing ────────────────────────────────

    function test_ProcessConflicts_NoPoliticianDraw() public {
        uint256 gameId = _createAndStartGame();
        _commitBoth(gameId, 1);
        _revealBoth(gameId, 1);

        // Process conflicts
        game.processConflicts(gameId);

        GameSession memory g = game.getGame(gameId);
        // No politician draw in default setup → should advance past conflict
        // (advances to next turn since market disabled)
        assertTrue(
            uint8(g.currentPhase) == uint8(GamePhase.DistributionCommit) ||
            uint8(g.currentPhase) == uint8(GamePhase.Finished)
        );
    }

    // ─── VP Calculation ─────────────────────────────────────

    function test_CalculateVP_Zero() public {
        vm.prank(alice);
        uint256 gameId = game.createGame(2);

        // All values are 0 at start → VP = 0
        uint8 vp = game.calculateVP(gameId, alice);
        assertEq(vp, 0);
    }

    // ─── Hash Helpers ───────────────────────────────────────

    function test_HashDeterminism() public view {
        uint256 gameId = 0;
        uint8 turn = 1;
        bytes memory md = _aliceMoveData();
        bytes32 salt = bytes32("test_salt");

        bytes32 h1 = game.computeDistributionHash(gameId, turn, md, salt);
        bytes32 h2 = game.computeDistributionHash(gameId, turn, md, salt);
        assertEq(h1, h2);
    }

    // ═══════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════

    function _createAndStartGame() internal returns (uint256) {
        vm.prank(alice);
        uint256 gameId = game.createGame(2);
        vm.prank(bob);
        game.joinGame(gameId);
        vm.prank(alice);
        game.startGame(gameId);
        return gameId;
    }

    // Default placements: no overlap → no conflicts
    // Alice: P→Square(R), S→Uni(P), A→Theatre(S), R→Factory(D)
    // Bob:   P→Uni(R),    S→Theatre(P), A→Square(S), R→Dump(D)

    bytes32 constant ALICE_SALT = bytes32("alice_salt");
    bytes32 constant BOB_SALT   = bytes32("bob_salt");

    function _aliceMoveData() internal pure returns (bytes memory) {
        return abi.encodePacked(
            uint8(0), uint8(1), uint8(2), uint8(3),  // actorTypes: P, S, A, R
            uint8(1), uint8(3), uint8(2), uint8(4),  // locations: Square, Uni, Theatre, Factory
            uint8(0), uint8(1), uint8(2), uint8(3),  // arguments: Rock, Paper, Scissors, Dummy
            uint8(0), uint8(0), uint8(0), uint8(0)   // bets: none
        );
    }

    function _bobMoveData() internal pure returns (bytes memory) {
        return abi.encodePacked(
            uint8(0), uint8(1), uint8(2), uint8(3),  // actorTypes: P, S, A, R
            uint8(3), uint8(2), uint8(1), uint8(6),  // locations: Uni, Theatre, Square, Dump
            uint8(0), uint8(1), uint8(2), uint8(3),  // arguments: Rock, Paper, Scissors, Dummy
            uint8(0), uint8(0), uint8(0), uint8(0)   // bets: none
        );
    }

    function _makeDistributionHash(
        uint256 gameId,
        uint8 turn,
        bytes memory moveData,
        bytes32 salt
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(gameId, turn, moveData, salt));
    }

    function _commitBoth(uint256 gameId, uint8 turn) internal {
        bytes32 aliceHash = _makeDistributionHash(gameId, turn, _aliceMoveData(), ALICE_SALT);
        bytes32 bobHash   = _makeDistributionHash(gameId, turn, _bobMoveData(), BOB_SALT);

        vm.prank(alice);
        game.commitDistribution(gameId, aliceHash);
        vm.prank(bob);
        game.commitDistribution(gameId, bobHash);
    }

    function _revealBoth(uint256 gameId, uint8 /*turn*/) internal {
        vm.prank(alice);
        game.revealDistribution(gameId, _aliceMoveData(), ALICE_SALT);
        vm.prank(bob);
        game.revealDistribution(gameId, _bobMoveData(), BOB_SALT);
    }
}
