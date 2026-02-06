# Metarchy Frontend - Development Status

**Last Updated:** February 2, 2026

## 🚀 Recent Updates (Session Handover)

We have successfully implemented the **Conflict Phase (Phase 4)** with high-fidelity visuals and refined game logic.

### ✅ Completed Features
1.  **Conflict Phase UI**
    - **Conflicts Sidebar**: A persistent, collapsible sidebar that lists active conflicts. Visually integrates the Phase 2 "Actor Orb" (Player) and Phase 3 "HUD Marker" (Opponent) styles.
    - **Resolution Arena (`ConflictResolutionView`)**: A premium close-up modal featuring:
        - Full-screen location concept art backdrops.
        - Full-body actor illustrations with team tinting.
        - Animated reveal sequences (Entrance, Reveal, Results) using `framer-motion`.

2.  **Logic Refinements**
    - **Strict Role-Based Conflicts**: Conflicts now **only** occur between actors of the **same role** (e.g., Politician vs Politician). Matches based on RSP tokens alone (e.g., Rock vs Rock) are ignored.
    - **Multi-Conflict Locations**: A single location can now host multiple distinct conflicts (e.g., a Robot battle and a Scientist battle at the same "Square").
    - **Filtering**: Resolved conflicts effectively disappear from the active list to prevent infinite loops.

3.  **Bug Fixes**
    - Fixed missing Player Avatars/Names in the Sidebar by correctly mapping to `MY_ACTORS`.
    - Fixed "Random Conflicts" by ensuring `actorType` is recorded during placement in `GameBoardPage.tsx`.
    - Hidden opponent Bid Icons in the Sidebar (requested change).

---

## 🛠 Key Technical Notes for Next Session

*   **Conflict Detection Logic**:
    - Located in `GameBoardPage.tsx` -> `activeConflicts` useMemo.
    - It iterates through placed actors and explicitly checks `a.actorType === playerActorRaw.actorType`.
    - **Important**: The `placedActors` state has been patched to include `actorType` during `handleRSPSelect`. Ensure any *new* placement mechanics also include this property.

*   **Visual Assets**:
    - Location backgrounds are pulled from `/public/Locations closeups/`.
    - Actor images are mapped via `MY_ACTORS` or `PLAYERS` arrays.

*   **State Management**:
    - `activeConflictLocId`: Tracks which specific conflict is currently being viewed in the Arena. It uses a composite ID format: `${locId}_${actorType}` (e.g., `square_politician`).
    - `resolvedConflicts`: Array of composite IDs that have been finished.

## 📋 Next Steps

1.  **Phase 5 (Resolution / End Game)**:
    - Implement the final scoring or transition after conflicts are resolved.
    - Handle the "Double Prize" logic verification fully (currently simulated).
2.  **Sound Effects**:
    - Add SFX for "VS" slam, Card Reveal, and Victory/Defeat states.
3.  **Edge Cases**:
    - Verify "Draw" mechanics with diverse bid types (Star/Recycle).
    - detailed testing of the "Restart" flow for Energy bids.
