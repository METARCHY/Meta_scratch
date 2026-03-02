# Squad Patterns by Project Type

## Web3 / Blockchain App (e.g., POSTHUMAN)

```
Leader
├── Architect        → maps existing chain integrations, defines new module interfaces
├── Smart Contract   → writes/audits Solidity or CosmWasm contracts
├── Backend Dev      → REST/GraphQL APIs, wallet auth, chain RPC calls
├── Frontend Dev     → wallet UI, NFT display, transaction flows
├── QA Tester        → test wallet connect, sign TX, error states
└── Technical Writer → API docs, user guides
```

## Full-Stack Web App

```
Leader
├── Architect        → defines data model and service boundaries
├── Backend Dev      → API endpoints, database schema, auth
├── Frontend Dev     → components, pages, state management
├── QA Tester        → unit + integration + e2e tests
└── Technical Writer → README, API reference
```

## Game (e.g., Metarchy)

```
Leader
├── Architect        → game state machine, turn logic design
├── Game Designer    → rules validation, balance testing
├── Backend Dev      → match server, real-time sync (WebSocket)
├── Frontend Dev     → game board UI, animations
└── QA Tester        → multiplayer scenarios, edge cases
```

## Smart Contract Audit

```
Leader
├── Architect        → maps contract inheritance and dependencies
├── Smart Contract   → implements fixes and improvements
├── Security Reviewer→ reentrancy, overflow, access control checks
└── Technical Writer → audit report generation
```

## API Integration Sprint

```
Leader
├── Backend Dev      → integration endpoints + error handling
├── QA Tester        → mock responses, rate limit handling
└── Technical Writer → integration guide
```

---

## Sequencing Rules

| Scenario | Order |
|---|---|
| New feature from scratch | Architect → (Backend ∥ Frontend) → QA → Writer |
| Bug fix | QA diagnoses → Backend/Frontend fixes → QA validates |
| Contract deployment | Architect → Smart Contract → Security Reviewer → Writer |
| Documentation sprint | Writer (can run fully in parallel) |
