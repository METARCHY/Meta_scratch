// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MetarchyTokens — ERC-1155 token contract for Metarchy game assets
/// @notice Represents Actors, Arguments, Resources, Values, and Action Cards as on-chain tokens.
/// @dev The game contract is authorized to mint/burn on behalf of players.
contract MetarchyTokens is ERC1155, Ownable {

    // ═══════════════════════════════════════════════════════════
    // TOKEN IDS (matches GameConstants in MetarchyTypes.sol)
    // ═══════════════════════════════════════════════════════════

    // Actors (0–3)
    uint256 public constant ACTOR_POLITICIAN = 0;
    uint256 public constant ACTOR_SCIENTIST  = 1;
    uint256 public constant ACTOR_ARTIST     = 2;
    uint256 public constant ACTOR_ROBOT      = 3;

    // RPS Argument tokens (10–13)
    uint256 public constant ARG_ROCK     = 10;
    uint256 public constant ARG_PAPER    = 11;
    uint256 public constant ARG_SCISSORS = 12;
    uint256 public constant ARG_DUMMY    = 13;

    // Material Resources (20–22)
    uint256 public constant RES_PRODUCT     = 20;
    uint256 public constant RES_ELECTRICITY = 21;
    uint256 public constant RES_RECYCLING   = 22;

    // Intangible Values (30–33)
    uint256 public constant VAL_POWER     = 30;
    uint256 public constant VAL_ART       = 31;
    uint256 public constant VAL_KNOWLEDGE = 32;
    uint256 public constant VAL_FAME      = 33;

    // Action Cards (40–47)
    uint256 public constant CARD_BLOCK_SQUARE     = 40;
    uint256 public constant CARD_BLOCK_THEATRE    = 41;
    uint256 public constant CARD_BLOCK_UNIVERSITY = 42;
    uint256 public constant CARD_BLOCK_FACTORY    = 43;
    uint256 public constant CARD_BLOCK_POWERPLANT = 44;
    uint256 public constant CARD_BLOCK_DUMP       = 45;
    uint256 public constant CARD_RELOCATION       = 46;
    uint256 public constant CARD_CHANGE_VALUES    = 47;

    // GATO currency token
    uint256 public constant GATO = 100;

    // ═══════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════

    address public gameContract;

    // ═══════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════

    constructor()
        ERC1155("https://api.metarchy.game/metadata/{id}.json")
        Ownable(msg.sender)
    {}

    // ═══════════════════════════════════════════════════════════
    // ACCESS CONTROL
    // ═══════════════════════════════════════════════════════════

    modifier onlyGame() {
        require(
            msg.sender == gameContract || msg.sender == owner(),
            "MetarchyTokens: not authorized"
        );
        _;
    }

    function setGameContract(address _gameContract) external onlyOwner {
        gameContract = _gameContract;
    }

    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }

    // ═══════════════════════════════════════════════════════════
    // MINT / BURN (only callable by game contract or owner)
    // ═══════════════════════════════════════════════════════════

    function mint(address to, uint256 id, uint256 amount, bytes memory data) external onlyGame {
        _mint(to, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyGame {
        _mintBatch(to, ids, amounts, data);
    }

    function burn(address from, uint256 id, uint256 amount) external onlyGame {
        _burn(from, id, amount);
    }

    function burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external onlyGame {
        _burnBatch(from, ids, amounts);
    }
}
