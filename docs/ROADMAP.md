# Metarchy — Development Roadmap

> Статус на: март 2026  
> Цель: **MVP** — играбельная 2-player партия с блокчейн-верификацией ходов

---

## Обзор фаз

| Фаза | Название | Статус |
|---|---|---|
| Phase 1 | Neural Network Foundation | ✅ Завершена |
| Phase 2 | Project Governance & Telemetry | ✅ Завершена |
| Phase 3 | Conflict & Resolution Architecture | ✅ Завершена |
| Phase 4 | Tactical Supremacy | ✅ Завершена |
| Phase 5 | MVP — Blockchain Integration & Real Multiplayer | 🔲 Не начата |
| Phase 6 | Full Game — Events, Market, Action Cards Online | 🔲 Не начата |
| Phase 7 | Production & Launch | 🔲 Не начата |

---

## Phase 1: Neural Network Foundation ✅

> Фундамент визуального движка и игровых сущностей.

- [x] Hex-map движок (H-Matrix) с drag-to-move навигацией
- [x] Zoom-система (1.6x при размещении акторов)
- [x] 4 класса акторов: Politician, Robot, Scientist, Artist
- [x] Спрайты акторов (полные + head-портреты)
- [x] 7 локаций с координатами, хинтами и активными оверлеями
- [x] Система размещения акторов на карте (drag & drop)
- [x] Web3 Identity — RainbowKit/wagmi интеграция, Citizen ID
- [x] Guest mode (генерация временного адреса)

---

## Phase 2: Project Governance & Telemetry ✅

> Административная инфраструктура и персистенция данных.

- [x] Admin dashboard: управление играми и citizen записями
- [x] JSON persistence layer (games.json, citizens.json) с volume mount для Docker
- [x] API routes: CRUD для игр и граждан
- [x] Стандартизированные логи (UTC формат, game ID prefix)
- [x] Game session CRUD: создание, join, soft/hard delete, restore
- [x] Docker & Docker Compose настройка
- [x] Polling-based state sync (3s интервал)

---

## Phase 3: Conflict & Resolution Architecture ✅

> Полная система разрешения конфликтов.

- [x] Conflict Detection — группировка акторов по локации и типу
- [x] RPS-матрица (Rock/Paper/Scissors/Dummy)
- [x] Кинематичная арена конфликтов (ConflictResolutionView)
- [x] Анимированная "VS" reveal-последовательность
- [x] Локационные динамические фоны для арены
- [x] Actor-type Draw rules (Politician=refight, Scientist=all win, Artist=all lose, Robot=share)
- [x] Бет-система (Production=Win, Electricity=Lose, Recycling=Draw)
- [x] Re-roll для Electricity bet (повторное разрешение)
- [x] Desaturation disabled-состояния для локаций и акторов
- [x] Strict turn-based: продвижение только когда все ready
- [x] Bot AI: размещение, RPS-выбор, базовые решения

---

## Phase 4: Tactical Supremacy ✅

> Action Cards, Market, расширенный геймплей.

- [x] Action Cards panel: carousel с 520px artwork, golden plates
- [x] 8 типов Action Cards (6 block location + relocation + change values)
- [x] Phase 3: 4-step sequence (Bidding → Block → Relocate → Exchange)
- [x] Relocation: перемещение акторов между Valid локациями
- [x] Exchange: обмен Values между игроками
- [x] Conflict Sidebar: трекинг pending/resolved конфликтов
- [x] Ручное продвижение в Phase 4 (нет auto-advance)
- [x] Market Phase: покупка карт за (Product + Energy + Recycle)
- [x] Game Over: подсчёт VP, VICTORY overlay, return to lobby
- [x] Модульная архитектура `lib/modules/` (9 модулей, pure functions)
- [x] Victory Points калькулятор с Glory distribution

---

## Phase 5: MVP — Blockchain Integration & Real Multiplayer 🔲

> Превращение локальной single-player симуляции в настоящую 2-player game с блокчейн-верификацией.

### 5.1 Commit-Reveal Integration
- [ ] Подключить `MetarchyGame.sol` к фронтенду через wagmi/viem
- [ ] Реализовать commit ходов: `commitMove(gameId, hash)` при завершении Distribution Phase
- [ ] Реализовать reveal ходов: `revealMove(gameId, moveData, salt)` после всех коммитов
- [ ] Encrypt/decrypt move data на клиенте
- [ ] Верифицировать hash matching на контракте
- [ ] Обработка edge cases: timeout, disconnect во время commit/reveal

### 5.2 Game Server
- [ ] Создать Game Server как независимую третью сторону
- [ ] Game Server получает encrypted data от обоих игроков
- [ ] Game Server создаёт on-chain транзакции с encrypted data
- [ ] Game Server отслеживает blockchain events для продвижения фаз
- [ ] Выбрать и интегрировать блокчейн (Avalanche или другой EVM-совместимый)

### 5.3 Real Multiplayer State Sync
- [ ] Заменить polling (3s) на WebSocket-соединение
- [ ] Server-authoritative game state (вместо локального useState)
- [ ] Синхронизация Phase transitions между реальными игроками
- [ ] Синхронизация Conflict Resolution (оба игрока выбирают RPS одновременно)
- [ ] Обработка reconnect и state recovery

### 5.4 Smart Contract Deployment
- [ ] Деплой `MetarchyTokens.sol` на testnet
- [ ] Деплой `MetarchyGame.sol` на testnet
- [ ] Настроить `setGameContract()` — привязать контракты
- [ ] Тестировать mint/burn акторов при join
- [ ] Тестировать полный commit-reveal цикл на testnet

### 5.5 MVP Game Flow (минимальная играбельная партия)
- [ ] 2 реальных игрока, 5 ходов
- [ ] Фазы MVP: Distribution → Conflict Resolution (без Event, Action, Market)
- [ ] Скрытые ходы через commit-reveal
- [ ] Blockchain-proof каждого хода
- [ ] VP подсчёт и определение победителя
- [ ] End-to-end тест: от создания игры до объявления winner

---

## Phase 6: Full Game — Events, Market, Action Cards Online 🔲

> Включить все фазы полной версии в мультиплеер.

### 6.1 Event Phase Online
- [ ] Server-side Event Card draw (рандом на стороне сервера/контракта)
- [ ] Compare Events: сервер сравнивает ресурсы игроков
- [ ] Discard Events: commit-reveal для секретного discard количества
- [ ] Event results → on-chain proof

### 6.2 Action Phase Online
- [ ] Commit-reveal для выбора Action Cards (Phase 3)
- [ ] Синхронизация всех 4 шагов Phase 3 между игроками
- [ ] Relocation validation на стороне сервера
- [ ] Exchange validation: обе стороны подтверждают обмен

### 6.3 Market Phase Online
- [ ] Покупка Action Cards → on-chain транзакция (burn resources, mint card)
- [ ] Рандомизация карт на стороне контракта (VRF или commit-reveal)

### 6.4 3+ Players & Team Mode
- [ ] 3-player conflict resolution (2+ actors, multi-way RPS)
- [ ] 2v2 team mode: shared VP, team-based conflict rules
- [ ] Масштабирование Game Server для 3–4 одновременных подключений

### 6.5 Full Action Card Deck
- [ ] Расширить до 15 уникальных карт (6 block + 6 relocation + 3 change values)
- [ ] Deck management: отслеживание оставшихся карт
- [ ] Балансировка: стоимость и доступность

---

## Phase 7: Production & Launch 🔲

> Подготовка к публичному запуску.

### 7.1 Infrastructure
- [ ] Mainnet deployment (Avalanche C-Chain или другой)
- [ ] Production Game Server (надёжный hosting)
- [ ] CDN для статических ассетов
- [ ] Monitoring & alerting
- [ ] Rate limiting & anti-cheat

### 7.2 UX Polish
- [ ] Onboarding tutorial для новых игроков
- [ ] Sound effects & музыка
- [ ] Mobile-responsive адаптация
- [ ] Matchmaking system (quick play)
- [ ] Player rating & leaderboard

### 7.3 NFT & Economy
- [ ] Actor NFT marketplace (trade actors)
- [ ] Cosmetic upgrades (actor skins, board themes)
- [ ] GATO token utility (entry fees, rewards)
- [ ] Season/tournament system

### 7.4 Security
- [ ] Smart contract audit
- [ ] Penetration testing
- [ ] Anti-bot protection для conflict resolution
- [ ] Formal verification of commit-reveal scheme

---

## Что есть сейчас vs. Что нужно для MVP

### ✅ Есть (работает в single-player с ботами)
- Полный визуальный движок (карта, акторы, анимации)
- Все 5 фаз геймплея (Event, Distribution, Action, Conflict, Market)
- Action Cards (block, relocate, exchange)
- Bet система (Production/Electricity/Recycling)
- VP калькулятор с Glory
- Admin dashboard
- Bot AI
- Модульная архитектура (pure functions)

### 🔲 Нужно для MVP (Phase 5)
- **Blockchain:** commit-reveal подключен к фронтенду
- **Game Server:** независимый арбитр, шифрует/дешифрует ходы
- **Real Multiplayer:** WebSocket, server-authoritative state
- **Deployment:** контракты на testnet, рабочий E2E flow для 2 игроков
- **MVP scope:** только Distribution + Conflict (без Event/Action/Market)

### Приоритет задач для MVP
```
1. Game Server (WebSocket + game state authority)     ← критический путь
2. Commit-reveal интеграция (контракт ↔ фронтенд)   ← критический путь
3. Real multiplayer Phase sync                        ← критический путь
4. Testnet deployment                                 ← финальная валидация
5. E2E тестирование                                   ← acceptance criteria
```
