# 52 Cards — The 52-Card Collection

Twelve card games, one standard 52-card deck, all in the browser.

Play solo, against computer opponents, or online with friends using a room code. There is nothing to install and no account to make. Every game follows its full traditional rules, including the edge cases.

The mood is a 1960s spy thriller: low light, green baize, the snap of a fresh deck, chips sliding across felt. You pick the room you play in and the deck you play with, and you can change either at any time.

> **Status:** in development. See the [Roadmap](#roadmap) for what's playable so far.

---

## Contents

- [The games](#the-games)
- [Ways to play](#ways-to-play)
- [House rules we use](#house-rules-we-use)
- [Venues and decks](#venues-and-decks)
- [Look and feel](#look-and-feel)
- [Sound](#sound)
- [What every game screen shows](#what-every-game-screen-shows)
- [Playing online](#playing-online)
- [Computer opponents](#computer-opponents)
- [Running locally](#running-locally)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Testing](#testing)
- [Hosting](#hosting)
- [Roadmap](#roadmap)
- [Credits](#credits)
- [Disclaimer](#disclaimer)

---

## The games

The full rulebook, covering setup, play, scoring and how to win for every game, is in **[Rules_Modes.md](Rules_Modes.md)**.

### Renowned

| # | Game | Players | Type | In one line |
|---|------|---------|------|-------------|
| 01 | **Texas Hold'em Poker** | 2–10 | Betting / hand ranking | Make the best five-card hand from two hole cards and five community cards. |
| 02 | **Blackjack (21)** | 1–7 + dealer | Banking | Get closer to 21 than the dealer without going over. |
| 03 | **Klondike Solitaire** | 1 | Patience | Build all four suits from Ace to King. |
| 04 | **Rummy** | 2–6 | Draw & discard | Meld sets and runs until your hand is empty. |
| 05 | **Hearts** | 4 | Trick-avoidance | Avoid Hearts and the Queen of Spades, or take them all. |
| 06 | **Spades** | 4 (2 teams) | Trick-taking, bidding | Win exactly as many tricks as your team bid. Spades are always trump. |
| 07 | **Contract Bridge** | 4 (2 teams) | Trick-taking, auction | Win the auction for a contract, then make it. Uses duplicate scoring. |
| 08 | **Crazy Eights** | 2–7 | Shedding | Match the suit or rank. Eights are wild. |

### Niche

| # | Game | Players | Type | In one line |
|---|------|---------|------|-------------|
| 09 | **Big Two** | 2–4 | Climbing / shedding | Beat the last play with a stronger one. The 2 is the highest card. |
| 10 | **Egyptian Rat Screw** | 2–6 | Reflex / slapping | Win face-card challenges and slap doubles and sandwiches to take the pile. |
| 11 | **Oh Hell** | 3–7 | Exact bidding | Bid exactly how many tricks you'll take. One too many still scores nothing. |
| 12 | **Twenty-Five** | 3–9 | Trick-taking (Irish) | First to 25. The 5 of trumps beats everything, then the Jack, then the A♥. |

Each game stands on its own and needs nothing from the others.

---

## Ways to play

| Mode | Description |
|------|-------------|
| **Solo** | Klondike, plus Blackjack against the house. |
| **Vs computer** | Every multiplayer game. Computer players fill any empty seat at Easy, Medium or Hard. |
| **Online** | Host a table, share the five-letter room code, and friends join from their own browsers. Computer players fill any seats left empty. |

Partnership games (Spades and Bridge) seat partners opposite each other and score by team.

---

## House rules we use

Many of these games have regional variants, and the rulebook asks for one clearly defined version of each. These are the defaults. Where a game offers a setting, you choose it in the table setup before the deal.

<details>
<summary><b>01 · Texas Hold'em</b></summary>

- No-limit betting. Each player starts with 1,000 chips, with blinds of 10/20 (both adjustable).
- Ace counts high, and also low in the A-2-3-4-5 straight.
- Side pots are built automatically when a player goes all-in.
- Split pots go to equal best hands. An odd chip goes to the first winner left of the button.
- In heads-up play the button posts the small blind and acts first before the flop.
</details>

<details>
<summary><b>02 · Blackjack</b></summary>

- One 52-card deck, reshuffled when fewer than 15 cards remain.
- A blackjack pays **3:2**. The dealer **stands on soft 17** (you can switch this to hit soft 17).
- You can double down on any first two cards. You can split a pair once. Split Aces get one card each, and a 21 made after a split is not a blackjack.
- The dealer checks the hole card for blackjack when showing an Ace or a 10-value card.
- Insurance and surrender are not offered.
</details>

<details>
<summary><b>03 · Klondike</b></summary>

- You choose **draw 1** or **draw 3** before the deal. You can go through the stock any number of times.
- Cards can come back down from the foundations to the tableau.
- Undo is available, plus an optional move counter and timer.
</details>

<details>
<summary><b>04 · Rummy</b> (basic draw-and-discard)</summary>

- Ace is low only: A-2-3 is a run, Q-K-A is not.
- You can meld and lay off on any turn, including onto other players' melds.
- You can't discard the card you just took from the discard pile.
- You go out by melding or laying off every card. The final discard is optional.
- When the stock runs out, the discard pile (except its top card) is turned over once. If the stock runs out a second time, the round ends with no score.
- The winner scores the total of everyone else's unmelded cards (A = 1, 2–10 at face value, J/Q/K = 10). First to 100 wins the match.
</details>

<details>
<summary><b>05 · Hearts</b></summary>

- Before each round you pass three cards, rotating **left → right → across → no pass**.
- The 2♣ leads the first trick. No Hearts or Q♠ can be played on the first trick, unless your hand has nothing else.
- Hearts can't be led until they are broken. Playing the Q♠ does not break Hearts.
- **Shooting the moon:** if you take all 26 points, every opponent gets 26 instead.
- The game ends when someone reaches 100. The lowest score wins, and tied low scores share the win.
</details>

<details>
<summary><b>06 · Spades</b></summary>

- Bids go from 0 to 13. A bid of 0 is **Nil**. Partners' bids are added together, except Nil bids, which are scored on their own.
- Nil scores +100 if made and −100 if failed. Blind Nil is off.
- A team that makes its bid scores 10 per trick bid plus 1 per overtrick (a "bag"). Every 10 bags costs 100 points. A team that misses its bid loses 10 per trick bid.
- The player left of the dealer leads first. Spades can't be led until broken, unless you hold only Spades.
- First team to **500** wins. A team that falls to **−200** loses.
</details>

<details>
<summary><b>07 · Contract Bridge</b></summary>

- Standard auction with bids, passes, doubles and redoubles. The auction ends after three passes in a row following a bid. If all four players pass, the hand is redealt.
- **Duplicate scoring** includes trick score, overtricks, undertricks, game and part-score bonuses, slam bonuses, and the "insult" bonus for making a doubled or redoubled contract.
- Dealer and vulnerability follow the standard 16-board cycle.
- The match is a set number of boards (8 by default). The highest total score wins.
- Computer players bid using a simple natural system based on high-card points.
</details>

<details>
<summary><b>08 · Crazy Eights</b></summary>

- Seven cards each for 2–4 players, five each for 5–7.
- If the first card turned up is an 8, it goes back into the deck and another card is turned.
- If you can't play, draw **one** card. You may play it straight away if it's legal. Otherwise your turn ends.
- If the draw pile runs out, the discard pile (minus its top card) is reshuffled into a new one.
- The winner scores what's left in the other players' hands (8 = 50, faces = 10, A = 1, other cards at face value). First to 100 wins.
</details>

<details>
<summary><b>09 · Big Two</b></summary>

- Ranks go 3 (lowest) through K, A, then **2 (highest)**. Suits go ♦ < ♣ < ♥ < ♠.
- Five-card hands rank **Straight < Flush < Full House < Four of a Kind + 1 < Straight Flush**.
- Straights can't wrap around and can't include a 2. The highest straight is 10-J-Q-K-A.
- Equal straights or flushes are compared by their highest card, then by suit.
- Whoever holds the **3♦** leads first, and that first play must include it.
- Once you pass, you're out until someone wins the pile and starts fresh.
- With 2 players, each gets 13 cards and the rest stay out of play. With 3 players, each gets 17, and whoever holds the 3♦ also takes the one card left over.
</details>

<details>
<summary><b>10 · Egyptian Rat Screw</b></summary>

- Face cards and Aces set a challenge: J = 1 try, Q = 2, K = 3, A = 4.
- The pile can be slapped on **doubles** (two of the same rank in a row) and **sandwiches** (two of the same rank with one card between).
- A wrong slap costs one card, which goes face down under the pile.
- A player who runs out of cards can still slap back in until the game ends.
- In online games the host decides who slapped first. Computer reaction times depend on difficulty.
</details>

<details>
<summary><b>11 · Oh Hell</b></summary>

- Rounds go up from 1 card each to the largest hand the deck allows while leaving one card to turn up for trump. That is 17 cards with 3 players, 12 with 4, 10 with 5, 8 with 6 and 7 with 7.
- The dealer bids last and can't bid a number that would make the total bids equal the tricks available.
- An exact bid scores **10 + the bid**. Anything else scores 0.
</details>

<details>
<summary><b>12 · Twenty-Five</b> (traditional Irish rules)</summary>

- Trump ranking, highest first:
  - **Hearts trump:** 5♥, J♥, A♥, K, Q, 10, 9, 8, 7, 6, 4, 3, 2
  - **Diamonds trump:** 5♦, J♦, A♥, A♦, K, Q, 10, 9, 8, 7, 6, 4, 3, 2
  - **Clubs or Spades trump:** 5, J, A♥, A, K, Q, 2, 3, 4, 6, 7, 8, 9, 10
- Non-trump ranking (*high in red, low in black*):
  - **Red suits:** K, Q, J, 10 … 2, A (except the A♥, which is always a trump)
  - **Black suits:** K, Q, J, A, 2 … 10
- **Following suit:** if a non-trump suit is led, you may follow suit or play a trump. You only discard another suit if you can do neither.
- **Reneging:** the 5 of trumps, the J of trumps and the A♥ don't have to be played to a trump lead when the trump led is lower than them.
- **Robbing:** the player holding the Ace of trumps may swap any card for the turned-up trump card. If the turned-up card is itself an Ace, the dealer may rob it.
- Each trick is worth 5 points. The first player to 25 wins.
</details>

---

## Venues and decks

Two choices change the whole look, and they are independent of each other:

- **Venue:** the room you're playing in. It sets the table surface, lighting, background, typography, the ambient sound and the reverb on every sound effect.
- **Deck:** the cards themselves. It sets the faces, the court artwork, the pip layouts and the card back.

Change either from the menu at any time, even mid-hand. The table re-dresses itself without interrupting play. Each venue suggests a deck, but any deck works in any venue.

### Venues

| Venue | Setting | Table | Ambience |
|-------|---------|-------|----------|
| **Riviera Salon** *(default)* | A private room at a 1960s seaside casino | Deep green baize, a brass rail, warm chandelier glow | A murmuring room, a distant roulette wheel, a hushed string quartet |
| **The Lair** | A villain's private table, carved into volcanic rock | Black glass lit red from below, brushed steel edges | A low machine hum and water moving somewhere behind the walls |
| **Noir '62** | A back room after midnight, in black and white | Worn felt crossed by stripes of light through venetian blinds | Rain on the window, a ceiling fan, a muted trumpet two floors down |
| **Mayfair Bar** | A modern cocktail bar after closing | Polished walnut and leather under amber back-lit shelves | Ice in a glass, a shaker, low lounge music |
| **Night Train** | A dining car crossing the Alps | Burgundy velvet and inlaid wood under a swaying lamp | The steady rhythm of the rails and the occasional whistle |
| **The Vault** | A Swiss bank's private room | Pale banknote paper with fine engraved line work | A ticking clock and the heavy hum of the vault |

### Decks

| Deck | Based on | Look |
|------|----------|------|
| **Classic** | Traditional full deck | White faces, red and black pips, double-headed courts in red, gold and blue robes |
| **Engraved** | Vintage woodcut sheet | Teal ink (`#1E5A53`) on pale green (`#DFECB7`), hatched courts and a fine diamond-lattice back, like a banknote |
| **Storybook** | Cartoon court deck | Rounded corners, decorative pip patterns and soft, illustrated royals |
| **Silhouette** | Silhouette icons | Solid black cards with white indices. Stark and graphic. |
| **Ink Line** | Line-icon set | Outline-only faces with a crown mark for royals. Minimal and very readable. |
| **Pastel** | Die-cut sticker card | Peach faces, mauve backs and a white die-cut border |

Card backs can also be chosen on their own: red lattice, blue lattice, engraved guilloché, monogram, or the venue's own back.

All card art is drawn in code as **SVG**. There are no image files to download, and cards stay sharp at any size.

**Readability options:** a four-colour suit option (♦ blue, ♣ green), large corner indices, and reduced motion.

---

## Look and feel

The game should feel like sitting down at a real table in a film, not filling in a form.

**Everything happens at the table.**

1. **Cold open.** A deck is shuffled and squared in the dark, and the title comes up.
2. **Choose a game.** The twelve games are dealt to you as a fanned hand. Lift a card to read its briefing (players, length, what it's about), then play it to sit down.
3. **Set the table.** Empty chairs sit around the table. Tap a chair to seat a computer player and choose how strong it is, or leave it open for a friend online. House rules sit on a small folded card on the table. Tap it to change them.
4. **Play.**
5. **Debrief.** Results arrive as a typed slip: scores, the key hand, and a stamp for the winner. From there you can deal again or leave the table.

**No dashboards.** Information lives on the table where a player would expect it:

- Each seat has a small name plaque. A pool of lamplight shows whose turn it is.
- Chips are real stacks. Tricks are taken and stacked in front of whoever won them. The dealer button is a physical puck that moves around the table.
- Scores are kept in pencil on a scorepad at the edge of the table. Open it for the full history.
- A single **subtitle line** at the bottom narrates what happens, like captions in a film: *"North leads the king of spades."* Older lines scroll into the ledger.

**Your hand is first-person.** Your cards are fanned at the bottom of the screen as if you're holding them. The moves you can make appear on a slim action rail beside your hand. You can tap, drag or use the keyboard.

**Cards move like cards.** They are dealt in arcs with a slight spin, settle with a little weight, and flip in perspective. A reduced-motion setting replaces all of this with simple fades.

**Phones get their own layout.** In portrait the table is viewed from above, and your hand sits in the thumb zone at the bottom.

---

## Sound

The sound design is restrained and close-up, like a card scene in a 1960s spy film. Every sound is something you would actually hear at a high-stakes table, with short music stings in the style of period spy jazz. There are no cartoon boings, arcade coins or fanfares.

**Table sounds**

| Moment | Sound |
|--------|-------|
| Shuffle | A riffle, then the cards cascading back together, then the deck squared with a tap on the felt |
| Cut | A soft lift and set-down |
| Deal | Each card slides across the felt, panned toward the seat it's going to |
| Draw / pick up | A card drawn off the stock |
| Play a card | A crisp landing. Playing to a trick is softer than slapping down a meld. |
| Flip / reveal | A short, clean snap |
| Take a trick | The cards swept together and squared |
| Chips | A light clink for a bet, a heavier stack pushed in for a raise, a whole stack shoved for all-in, and the pot raked to the winner |
| Blackjack shoe | A card slid out of the dealing shoe |
| Bridge bidding | The click of a card from a bidding box |
| Slap (Egyptian Rat Screw) | A flat palm on felt: firm, not comic |

**Cues**

| Moment | Sound |
|--------|-------|
| Your turn | A lighter lid flicking open |
| Time running low | A wristwatch ticking |
| Menu | A soft felt brush on hover and a small metal latch on select |

**Stings.** These are short phrases built on the minor-major ninth "spy chord", using vibraphone, a twangy baritone guitar, brushed snare and muted brass:

- **Win:** a short, cool resolution.
- **Loss:** a low string swell that falls away.
- **Big moments:** a fuller phrase for a royal flush, a grand slam, shooting the moon or a Klondike clear.

**How it works.** All sound is generated live with the Web Audio API, so there are no audio files to download.

- Card and chip sounds are built from shaped noise and short resonances.
- Stings come from small synthesised instruments: plucked strings for the guitar, FM synthesis for the vibraphone, filtered pads for the brass.
- Each venue sets its own reverb, so a card lands differently in the Vault than on the Night Train.
- Every sound varies slightly in pitch and timing, so repeated deals never sound mechanical.

**Mixer.** There are separate volume levels for Effects, Music and Ambience, plus a master mute. Sound pauses when the tab is hidden.

---

## What every game screen shows

As the rulebook requires, every table always displays:

- the game's objective and how to win
- the number of players, and whose turn it is
- current scores, or chips for Hold'em
- how many cards are left in each pile (stock, discard, waste)
- the current round, hand or board number
- the moves you can make right now. Illegal moves are blocked, and anything you can't do is greyed out.

Each game also has a **How to play** panel with the rules in plain language, so someone new can learn at the table.

---

## Playing online

1. Choose a game, then **Host online table**. You get a five-letter room code, such as `KQ7HR`.
2. Friends open the site, choose **Join**, and enter the code.
3. The host starts the game once everyone has joined. Computer players fill any empty seats.

**Leaving and coming back**

- If a player's connection drops, a computer player takes their seat after a short countdown, so the game doesn't stall.
- A player who rejoins with the same browser gets their seat back automatically.
- The host can resume a saved game for up to 12 hours. If the old room code is taken, a new one is issued.

**Fair play:** each player's browser receives only what that player is allowed to see. Other players' hands and the order of the deck are never sent to a browser that shouldn't see them.

---

## Computer opponents

| Level | Behaviour |
|-------|-----------|
| **Easy** | Makes legal moves using simple rules of thumb. Good for learning. |
| **Medium** | Plays solid standard strategy for each game, such as counting trumps, bidding from hand strength and using basic Blackjack strategy. |
| **Hard** | Keeps track of every card played, infers what opponents might hold, and plays defensively. |

Computer players make decisions using only what a human in that seat could see. They never look at hidden cards. The same computer players are used to fill dropped online seats and to power the **Hint** button.

---

## Running locally

There is no build step and nothing to install.

```bash
git clone https://github.com/Drag375o/CARDS.git
cd CARDS
# serve the folder with any static server, for example:
npx serve .
#   or
python -m http.server 8000
```

Then open `http://localhost:8000` (or the address the server prints).

> Opening `index.html` directly as a file mostly works too, but online play needs the page served over `http(s)`.

---

## Project structure

```
CARDS/
├── index.html              # app shell and the order scripts load in
├── css/
│   ├── base.css            # layout, table, hand fan, animations
│   └── venues/             # riviera, lair, noir62, mayfair, nighttrain, vault
├── js/
│   ├── core/
│   │   ├── cards.js        # card model, deck building, secure shuffle
│   │   ├── tricks.js       # shared trick-taking helpers (follow suit, trick winner)
│   │   ├── hands.js        # poker / Big Two hand evaluation
│   │   └── registry.js     # list of games and their metadata
│   ├── games/              # one rules engine per game, no DOM code
│   │   ├── holdem.js   blackjack.js   klondike.js   rummy.js
│   │   ├── hearts.js   spades.js      bridge.js     crazy8.js
│   │   └── bigtwo.js   ers.js         ohhell.js     twentyfive.js
│   ├── ai/                 # computer players, one file per game
│   ├── art/
│   │   ├── cardsvg.js      # shared card geometry, pip layouts, indices
│   │   ├── decks/          # classic, engraved, storybook, silhouette, inkline, pastel
│   │   └── backs.js        # card back patterns
│   ├── net.js              # online rooms (PeerJS)
│   ├── audio/
│   │   ├── mixer.js        # volume buses, venue reverb, mute
│   │   ├── foley.js        # shuffle, deal, flip, chips, slap...
│   │   └── stings.js       # spy-jazz music stings
│   └── ui/                 # screens, table rendering, input, saves
├── tests/                  # headless Node tests (no dependencies)
├── Rules_Modes.md          # the full rulebook for all 12 games
└── README.md
```

---

## Architecture

The design follows two earlier projects, *Auction XI* and *Home-made Mahjong*: plain HTML, CSS and JavaScript, no framework, and a rules engine kept separate from everything else.

**One shared namespace.** Every file is a self-running module that attaches to `window.C52`. The order of the `<script>` tags in `index.html` decides what loads first.

**Rules engines are pure.** Every game in `js/games/` exposes the same interface and never touches the page:

| Function | Purpose |
|----------|---------|
| `meta` | Name, player counts, options and objective text |
| `createMatch(players, options, rng)` | Builds a new match as a plain, JSON-safe state object |
| `actionsFor(state, seat)` | Every move that seat may make right now |
| `apply(state, seat, action)` | Makes a move, but only if it appears in `actionsFor`. Anything else is rejected. |
| `view(state, seat)` | The state with everything hidden that this seat isn't allowed to see |
| `result(state)` | Whether the round or game is over, plus scores and winners |

Because the engine never touches the page, the same code runs the game in the browser, on the online host, inside the computer players and in the tests. The engine also moves the game forward automatically when no one has a decision to make, such as dealing, flipping the trump card, or the dealer drawing in Blackjack.

**Cards.** A card is a two-character code: rank `A 2–9 T J Q K` followed by suit `S H D C`, so `TH` is the ten of hearts. Each match tracks where every card is, so a card can never be in two places at once, and a check confirms that all 52 cards are accounted for after every move. Shuffling uses Fisher–Yates with `crypto.getRandomValues`. Tests use a seeded random number generator so games can be replayed exactly.

**Online play is peer-to-peer and host-authoritative.** Connections run directly between browsers over WebRTC using [PeerJS](https://peerjs.com/). The public PeerJS server is used only to connect players, at peer ID `cards52-room-<CODE>`. The host's browser runs the engine and sends each guest `view(state, seat)` after every change. Guests send only the moves they want to make. Other details:

- Room codes use five letters and leave out I and O, so codes are easy to read.
- Each guest gets a random seat token that lets them reclaim their seat.
- A heartbeat runs every 2 s, and a player is treated as disconnected after 10 s of silence.
- All networking code is in `net.js`, so the connection method can be replaced without changing any game code.

**Saved data.** Settings, the host's saved game and the last joined room are stored in the browser's `localStorage`.

---

## Testing

The test suite runs headless in Node with no dependencies. Both reference projects ran their simulations as one-off scripts. Here they live in `tests/`:

```bash
node tests/run.js
```

- **Card conservation:** after every move, all 52 cards are present and each is in exactly one place.
- **Legal-move fuzzing:** thousands of random but legal games per title must never crash or reach a state where nobody can move.
- **Rule fixtures:** fixed deals check specific rulings, such as the Twenty-Five trump order, Bridge scores, Big Two hand comparison, Hearts shooting the moon, and Blackjack splits and soft totals.
- **Computer-vs-computer runs:** whole matches between computer players to check that scoring adds up and every game ends.

---

## Hosting

The game is a static site, so any static host works.

- **GitHub Pages:** in the repo settings, go to Pages, then *Deploy from branch*, choose `main` and `/ (root)`.
- **Netlify:** `npx netlify-cli deploy --prod --dir .`

---

## Roadmap

Each item is committed and pushed on its own as it's finished.

- [ ] Card engine: card model, deck, shuffle, card-location tracking
- [ ] SVG card faces and backs: Classic deck
- [ ] Venue system + Riviera Salon
- [ ] Sound engine: shuffle, deal, flip, chips, cues
- [ ] Cold open, game hand menu and table seating
- [ ] 03 Klondike Solitaire
- [ ] 02 Blackjack
- [ ] 08 Crazy Eights
- [ ] 05 Hearts
- [ ] 06 Spades
- [ ] 11 Oh Hell
- [ ] 04 Rummy
- [ ] 09 Big Two
- [ ] 12 Twenty-Five
- [ ] 10 Egyptian Rat Screw
- [ ] 01 Texas Hold'em
- [ ] 07 Contract Bridge
- [ ] Computer players: Easy / Medium / Hard
- [ ] Online rooms
- [ ] Remaining decks: Engraved, Storybook, Silhouette, Ink Line, Pastel
- [ ] Remaining venues: The Lair, Noir '62, Mayfair Bar, Night Train, The Vault
- [ ] Music stings and venue ambience
- [ ] Settings and accessibility options
- [ ] Test suite and hosting

---

## Credits

- The deck designs are based on reference artwork from [Vecteezy.com](https://www.vecteezy.com). All card art in this repository is original SVG drawn for the project. The reference files themselves are not distributed here.
- Online play uses [PeerJS](https://peerjs.com/).

## Disclaimer

52 Cards is a free game for fun. **No real money is involved.** Chips in Hold'em and Blackjack have no value and can't be bought or cashed out.
