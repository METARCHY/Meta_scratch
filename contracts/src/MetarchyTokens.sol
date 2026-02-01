// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MetarchyTokens is ERC1155, Ownable {
    using Strings for uint256;

    // --- Asset Types ---

    // Actors (0-3)
    uint256 public constant ACTOR_ROBOT = 0;
    uint256 public constant ACTOR_HUMAN = 1;
    uint256 public constant ACTOR_CYBORG = 2;
    uint256 public constant ACTOR_MUTANT = 3;

    // RSP Tokens (Hidden/Revealed concept handled in Game logic, these are the assets)
    uint256 public constant RSP_ROCK = 10;
    uint256 public constant RSP_PAPER = 11;
    uint256 public constant RSP_SCISSORS = 12;
    uint256 public constant RSP_DUMMY = 13;

    // Material Resources (20-22)
    uint256 public constant MAT_GOLD = 20;
    uint256 public constant MAT_ENERGY = 21;
    uint256 public constant MAT_DATA = 22;

    // Intangible Resources (30-33)
    uint256 public constant INT_INFLUENCE = 30;
    uint256 public constant INT_REPUTATION = 31;
    uint256 public constant INT_KNOWLEDGE = 32;
    uint256 public constant INT_GLORY = 33;

    // Action Cards (40+)
    uint256 public constant CARD_TELEPORT = 40;
    uint256 public constant CARD_CHANGE_RESOURCE = 41;
    // ... other action cards to be added

    address public gameContract;

    constructor() ERC1155("https://api.metarchy.game/metadata/{id}.json") Ownable(msg.sender) {}

    // --- Modifiers ---
    modifier onlyGame() {
        require(msg.sender == gameContract || msg.sender == owner(), "Caller is not game or owner");
        _;
    }

    // --- Admin ---
    function setGameContract(address _gameContract) external onlyOwner {
        gameContract = _gameContract;
    }

    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }

    // --- Game Logic ---
    function mint(address account, uint256 id, uint256 amount, bytes memory data) external onlyGame {
        _mint(account, id, amount, data);
    }

    function mintBatch(address account, uint256[] memory ids, uint256[] memory amounts, bytes memory data) external onlyGame {
        _mintBatch(account, ids, amounts, data);
    }

    function burn(address account, uint256 id, uint256 amount) external onlyGame {
        _burn(account, id, amount);
    }

    function burnBatch(address account, uint256[] memory ids, uint256[] memory amounts) external onlyGame {
        _burnBatch(account, ids, amounts);
    }
}
