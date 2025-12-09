// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract GameHub {
    // Mapping from user address -> gameId -> top score
    mapping(address => mapping(uint256 => uint256)) public bestScore;

    // Event emitted when a new high score is submitted
    event ScoreSubmitted(address indexed player, uint256 indexed gameId, uint256 score);

    /**
     * @dev Submit a new score for a game. Updates only if better than previous best.
     * @param gameId The ID of the game (NOTE: using uint256, mapping from string ID needs to happen off-chain or via helper)
     * @param score The score achieved
     */
    function submitScore(uint256 gameId, uint256 score) external {
        uint256 currentBest = bestScore[msg.sender][gameId];
        
        require(score > currentBest, "Score must be higher than previous best");
        
        bestScore[msg.sender][gameId] = score;
        
        emit ScoreSubmitted(msg.sender, gameId, score);
    }
}
