# 52 Cards — The 52-Card Collection

Twelve card games, one standard 52-card deck, all in the browser.

Play solo, against computer opponents, or online with friends using a room code. There is nothing to install and no account to make. Every game follows its full traditional rules, including the edge cases.

The mood is a 1960s spy thriller: low light, green baize, the snap of a fresh deck. You choose the room you play in and the deck you play with, and you can change either at any time, even mid-hand.

> **Play it now:** **https://drag375o.github.io/CARDS/**
>
> **Status:** all twelve games are playable against computer opponents and online. Six venues, six decks and seven card backs are available.

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
- [Controls](#controls)
- [Running locally](#running-locally)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Testing](#testing)
- [Hosting](#hosting)
- [Troubleshooting](#troubleshooting)
- [Credits](#credits)
- [Disclaimer](#disclaimer)

---

## The games

The full rulebook, covering setup, play, scoring and how to win for every game, is in **[Rules_Modes.md](Rules_Modes.md)**. Each table also has a **Rules** button with the same information in plain language.

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
| **Solo** | Klondike, or Blackjack alone against the house. |
| **Vs computer** | Every multiplayer game. Each computer player is Easy, Medium or Hard. Tap a chair at the table to change it. |
| **Online** | Host a table, share the five-letter room code, and friends join from their own browsers. **Any seat without a person is played by a computer.** |

Partnership games (Spades and Bridge) seat partners opposite each other and score by team. In Bridge you sit South, with your partner North.

---

## House rules we use

Many of these games have regional variants, and the rulebook asks for one clearly defined version of each. These are the defaults. Where a game offers a setting, you choose it on the folded house-rules card before the deal.

<details>
<summary><b>01 · Texas Hold'em</b></summary>

- No-limit betting. Each player starts with 1,000 chips (or 2,000). Blinds are 10/20 (or 25/50).
- By default the blinds double every ten hands so the game always ends. This can be turned off.
- Ace counts high, and also low in the A-2-3-4-5 straight.
- Side pots are built automatically when a player goes all in. An uncalled bet goes back to the player who made it.
- Equal best hands split the pot. An odd chip goes to the first winner left of the button.
- In heads-up play the button posts the small blind and acts first before the flop.
- The game ends when one player has every chip, or when you run out.
</details>

<details>
<summary><b>02 · Blackjack</b></summary>

- One 52-card deck, reshuffled before a hand when fewer than 15 cards remain. If it runs out mid-hand, the cards already played are shuffled back in.
- A blackjack pays **3:2**. The dealer **stands on soft 17** (you can switch this to hit soft 17).
- You can double down on any first two cards. You can split a pair once. Split Aces get one card each, and a 21 made after a split is not a blackjack.
- The dealer checks the hole card for blackjack when showing an Ace or a 10-value card.
- Insurance and surrender are not offered.
- You play an agreed number of hands (10, 20 or 40). The player with the most chips wins.
</details>

<details>
<summary><b>03 · Klondike</b></summary>

- You choose **draw 1** or **draw 3** before the deal. You can go through the stock any number of times.
- Cards can come back down from the foundations to the tableau (drag them).
- Undo, a Hint button, a move counter, and **Send all home** once every card is face up.
- **Concede** ends the game if you get stuck.
</details>

<details>
<summary><b>04 · Rummy</b> (basic draw-and-discard)</summary>

- Ace is low only: A-2-3 is a run, Q-K-A is not.
- You can meld and lay off on any turn, including onto other players' melds.
- You can't discard the card you just took from the discard pile.
- You go out by melding, laying off or discarding your last card. The final discard is optional.
- When the stock runs out, the discard pile (except its top card) is turned over once. If the stock runs out a second time, the round ends with no score.
- The winner scores the total of everyone else's unmelded cards (A = 1, 2–10 at face value, J/Q/K = 10). First to 100 (or 250) wins the match.
</details>

<details>
<summary><b>05 · Hearts</b></summary>

- Before each round you pass three cards, rotating **left → right → across → no pass**.
- The 2♣ leads the first trick. No Hearts or Q♠ can be played on the first trick, unless your hand has nothing else.
- Hearts can't be led until they are broken. Playing the Q♠ does not break Hearts.
- **Shooting the moon:** if you take all 26 points, every opponent gets 26 instead.
- The game ends when someone reaches 100 (or 50). The lowest score wins, and tied low scores share the win.
</details>

<details>
<summary><b>06 · Spades</b></summary>

- Bids go from 0 to 13. A bid of 0 is **Nil**. Partners' bids are added together, except Nil bids, which are scored on their own.
- Nil scores +100 if made and −100 if failed. A failed Nil's tricks count as bags. Blind Nil is off.
- A team that makes its bid scores 10 per trick bid plus 1 per overtrick (a "bag"). Every 10 bags costs 100 points. A team that misses its bid loses 10 per trick bid.
- The player left of the dealer leads first. Spades can't be led until broken, unless you hold only Spades.
- First team to **500** (or 300) wins. A team that falls to **−200** loses.
</details>

<details>
<summary><b>07 · Contract Bridge</b></summary>

- Standard auction with bids, passes, doubles and redoubles. The auction ends after three passes in a row following a bid. If all four players pass, the board is thrown in.
- The declarer is the first player of the winning side to name the contract's suit. The declarer plays the dummy's cards as well as their own.
- **Duplicate scoring** includes trick score, overtricks, undertricks, game and part-score bonuses, slam bonuses, and the "insult" bonus for making a doubled or redoubled contract.
- Dealer and vulnerability follow the standard 16-board cycle.
- The match is a set number of boards (4, 8 or 16; 8 by default). The highest total score wins.
- Computer players bid using a simple natural system based on high-card points (see [Computer opponents](#computer-opponents)).
</details>

<details>
<summary><b>08 · Crazy Eights</b></summary>

- Seven cards each for 2–4 players, five each for 5–7.
- If the first card turned up is an 8, it goes back into the deck and another card is turned.
- If you can't play, draw **one** card. You may play it straight away if it's legal. Otherwise your turn ends.
- If the draw pile runs out, the discard pile (minus its top card) is reshuffled into a new one. If nobody can move, the lowest hand takes the round.
- The winner scores what's left in the other players' hands (8 = 50, faces = 10, A = 1, other cards at face value). First to 100 (or 200) wins.
</details>

<details>
<summary><b>09 · Big Two</b></summary>

- Ranks go 3 (lowest) through K, A, then **2 (highest)**. Suits go ♦ < ♣ < ♥ < ♠.
- Five-card hands rank **Straight < Flush < Full House < Four of a Kind + 1 < Straight Flush**.
- Straights can't wrap around and can't include a 2. The highest straight is 10-J-Q-K-A.
- Equal straights or flushes are compared by their highest card, then by suit.
- Whoever holds the **3♦** leads first, and that first play must include it. With 2 players, the lowest card dealt leads.
- Once you pass, you're out until someone wins the pile and starts fresh.
- With 2 players, each gets 13 cards and the rest stay out of play. With 3 players, each gets 17, and whoever holds the 3♦ also takes the one card left over.
- Play a single round, or a five-round match where cards left in hand are penalty points.
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

- Rounds go up from 1 card each to the largest hand the deck allows while leaving one card to turn up for trump: 17 cards with 3 players, 12 with 4, 10 with 5, 8 with 6 and 7 with 7. For a shorter game, stop at 10 or 7 cards.
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
- Each trick is worth 5 points. The first player to 25 wins, even mid-hand.
</details>

---

## Venues and decks

Two choices change the whole look, and they are independent of each other:

- **Venue:** the room you're playing in. It sets the table surface, lighting, background, typography, the ambient sound and the reverb on every sound effect.
- **Deck:** the cards themselves. It sets the faces, the court artwork, the pip layouts and the card back.

Change either from **The House** (the gold "52" button, top right) at any time, even mid-hand. Each venue suggests a deck, but any deck works in any venue.

### Venues

| Venue | Setting | Table | Ambience |
|-------|---------|-------|----------|
| **Riviera Salon** *(default)* | A private room at a 1960s seaside casino | Deep green baize, a mahogany rail with brass inlay, a chandelier glowing overhead | A murmuring room, a distant roulette wheel, chips at other tables, a hushed string quartet |
| **The Lair** | A villain's private table, carved into volcanic rock | Black glass lit red from below, brushed steel edges | A low machine hum and water dripping in the dark |
| **Noir '62** | A back room after midnight, in black and white | Worn grey felt under a bare bulb, a black lacquer rail; moonlight through venetian blinds falls in stripes across the back wall, never over the cards | Rain on the window, a ceiling fan, a muted trumpet two floors down |
| **Mayfair Bar** | A modern cocktail bar after closing | Oxblood leather under amber back-lit shelves, a walnut and brass rim | Ice in a glass, a cocktail shaker, low music |
| **Night Train** | A dining car crossing the Alps | Burgundy velvet and inlaid wood, a swaying lamp, village lights passing the window | The rhythm of the rails and a distant whistle |
| **The Vault** | A Swiss bank's private room | Pale banknote paper with engraved guilloché rings, a great round steel door | A heavy clock and the hum of the vault |

### Decks

| Deck | Based on | Look |
|------|----------|------|
| **Classic** | Traditional full deck | White faces, red and black pips, double-headed courts in red, gold and blue robes |
| **Engraved** | Vintage woodcut sheet | Teal ink (`#1E5A53`) on pale green (`#EEF3DC`), hatched courts and rosette aces, like a banknote |
| **Storybook** | Cartoon court deck | Rounded corners, pips set in decorative rings, soft illustrated royals with closed eyes |
| **Silhouette** | Silhouette icons | Solid black cards with white indices; royals are bold white emblems (crown, tiara, feathered cap) |
| **Ink Line** | Line-icon set | Outline-only pips and line-drawn royals in profile. Minimal and very readable. |
| **Pastel** | Die-cut sticker card | Peach faces, dusty rose and graphite pips, a thick white die-cut border |

**Card backs** can also be chosen on their own: red lattice, blue lattice, engraved guilloché, monogram, noir, mauve, or the venue's own back.

All card art is drawn in code as **SVG**. There are no image files to download, and cards stay sharp at any size. `tools/deck-preview.html` shows every card of every deck side by side.

**Readability options:** a four-colour suit option (♦ blue, ♣ green), large corner indices, reduced motion, and the pace of the computer players (relaxed, normal or brisk).

---

## Look and feel

The game should feel like sitting down at a real table in a film, not filling in a form.

**Everything happens at the table.**

1. **Cold open.** A face-down deck waits in a pool of light on the dark table. Tap to cut it: the deck is riffled twice and squared, and the title comes up. The tap also switches the sound on, since browsers only allow audio after you interact.
2. **Choose a game.** The twelve games are dealt to you as a fanned hand of title cards. Lift one to read its briefing on a typed, paper-clipped file slip.
3. **Set the table.** Empty chairs sit around the table. Tap a chair to change how strong its computer player is, or (when hosting online) open it for a friend. House rules are on a folded card in the middle.
4. **Play.**
5. **Debrief.** Each round ends with a typed slip of scores; the game ends with a stamped winner. From there you can deal again or leave.

**No dashboards.** Information lives on the table where a player would expect it:

- Each seat has a small name plaque, with the dealer's puck beside it. A pool of lamplight drifts toward whoever's turn it is.
- Opponents hold their cards face down in a small fan above their plaque, so you can see how many they have.
- Cards played to a trick sit in front of the player who played them, and the finished trick stays on the felt for a moment so everyone can see what took it.
- The **scorepad** (top bar) keeps every round's scores, plus a **ledger** of everything that's happened.
- A single **subtitle line** narrates the game like captions in a film: *"North leads the king of spades."*

**Your hand is first-person.** Your cards are fanned at the bottom of the screen. The moves you can make appear on a slim **action rail** to the right with a one-line hint. Cards you can't play dim when others can.

**Cards move like cards.** Played cards glide in from the player who played them, and your hand re-fans smoothly as it changes. Reduced motion turns the movement off.

**Phones.** In portrait the table is shown flat and the action rail moves above your hand.

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
| Play a card | A crisp landing. Playing to a trick is softer than laying down a meld. |
| Flip / reveal | A short, clean snap |
| Take a trick | The cards swept together and squared |
| Chips | A light clink for a bet, a heavier stack pushed in for a raise, a whole stack shoved for all in, and the pot raked to the winner |
| Blackjack shoe | A card slid out of the dealing shoe |
| Bidding | The click of a card from a bidding box |
| Slap (Egyptian Rat Screw) | A flat palm on felt: firm, not comic |

**Cues:** a lighter lid flicking open when it becomes your turn; a soft felt brush and a small metal latch for the interface.

**Stings.** Short original phrases built on the minor-major ninth "spy chord", using vibraphone, a twangy baritone guitar, brushed snare and muted brass. A cool resolution when you win, a low swell that sinks away when you lose, and a fuller phrase for a royal flush, a slam, shooting the moon, a made Nil, or a Klondike clear.

**How it works.** All sound is generated live with the Web Audio API, so there are no audio files to download.

- Card and chip sounds are built from shaped noise and short resonances.
- Stings come from small synthesised instruments: plucked strings (Karplus–Strong) for the guitar, FM synthesis for the vibraphone, filtered detuned saws for the brass.
- Each venue sets its own reverb, so a card lands differently in the Vault than on the Night Train.
- Every sound varies slightly in pitch and timing, so repeated deals never sound mechanical.

**Mixer.** In The House there are separate levels for table sounds, music stings and room ambience, a master level, mute, and buttons to preview each sound. Sound pauses when the tab is hidden.

---

## What every game screen shows

As the rulebook requires, every table always displays:

- the game, its objective and how to win (top line, and the **Rules** panel)
- the number of players, and whose turn it is (lamplight, highlighted plaque, rail hint)
- current scores or chips (on each plaque, and in the scorepad)
- how many cards are left in each pile (stock, discards, shoe) and in each opponent's hand
- the current round, hand or board number
- the moves you can make right now. Illegal moves are blocked: unplayable cards dim and unavailable actions are greyed out.

---

## Playing online

**Hosting**

1. Choose a game and take a seat, then tap **Host online table**. You get a five-letter room code, such as `KQ7HR`. Every chair starts open for a friend.
2. Friends open the site, tap **Join a table** on the games screen, and type the code.
3. Tap a chair to switch it between a computer player and an open seat. When you **Deal**, any chair still empty is played by a computer.

**Leaving and coming back**

- If a guest **leaves on purpose**, a computer takes their seat at once, and anyone with the room code may take it over.
- If a guest **loses connection**, the host sees a countdown: *"Ada lost connection. The computer takes over in 60s unless they rejoin with code …"*. The game doesn't pause; their turn simply waits. After 60 seconds a computer stands in.
- Either way the seat stays theirs: rejoining from the same browser hands it straight back.
- While someone is away, the host can tap **Let someone else join** to open their seat to a new player.
- A stranger who tries to join a game in progress is told the seats are taken, unless a seat has been opened.
- If the host's connection drops, guests keep trying to reconnect for about two minutes.
- The host's game is saved for **12 hours**: if the page is closed, **Resume game** on the games screen reopens the room (with a new code if the old one is still busy). Guests see a **Rejoin** card.

**Fair play:** the host's browser runs the game and sends each guest only what that guest may see. Other players' hands and the order of the deck never reach a browser that shouldn't see them.

**How it works:** browsers connect directly over WebRTC with [PeerJS](https://peerjs.com/), which is loaded only when you go online. The public PeerJS server only introduces the browsers. A heartbeat runs every 2 seconds, and a player counts as disconnected after 10 seconds of silence.

---

## Computer opponents

| Level | Behaviour |
|-------|-----------|
| **Easy** | Plays legal moves with loose rules of thumb and occasional mistakes. Good for learning. |
| **Medium** | Plays solid standard strategy for each game. |
| **Hard** | Medium plus extras: counting cards played, card-counting bets in Blackjack, more simulated deals in Hold'em, faster slaps in Egyptian Rat Screw. |

What they do in each family of games:

- **Trick-taking** (Hearts, Spades, Oh Hell, Twenty-Five, Bridge) shares one brain. It wins cheaply when it wants the trick, ducks when it doesn't, covers its partner, and sheds dangerous cards when it can't follow. Bids come from a trick estimate.
- **Bridge** bidding is a simple natural system:
  - 1NT with 15–17 points and a balanced hand, 2NT with 20–21.
  - Otherwise, open your longest suit (five-card majors first).
  - Responses raise a fit, show a new suit, or bid notrump.
  - The contract is set from combined points: 25 for game, 33 for a small slam (checked against partner's minimum), 37 for a grand slam.
- **Hold'em** players score starting hands, then estimate their chance of winning by simulating random deals and compare it with the pot odds.
- **Blackjack** players use basic strategy.
- **Big Two** players find every combination they hold.
- **Rummy** players look for melds and keep useful cards.
- **Klondike** has an autoplayer that powers the **Hint** button.

Computer players decide using only what a person in that seat could see. They never look at hidden cards. The same players stand in for anyone who drops out of an online game.

---

## Controls

- **Tap** a card to play it. When a card needs a choice (such as an eight's suit), a picker opens.
- In games where you play several cards (Rummy, Big Two, passing in Hearts), tap cards to **select** them, then use the rail.
- **Keyboard:**
  - Tab to a card and press Enter to play it.
  - On the games screen, the arrow keys move through the hand and Enter opens a briefing.
  - Escape closes panels.
- **Klondike:** tap a card to send it to its best place, or **drag** it (with the cards on top of it) where you want it.
- **Egyptian Rat Screw:** **Space** flips (or takes a pile you've won). **S** slaps, or tap the pile.

---

## Running locally

There is no build step and nothing to install.

```bash
git clone https://github.com/Drag375o/CARDS.git
cd CARDS
# open index.html directly, or serve the folder:
npx serve .
#   or
python -m http.server 8000
```

Then open `http://localhost:8000` (or the address the server prints).

> Online play needs an internet connection, since it loads PeerJS and uses the public PeerJS server to connect browsers.

**Handy links for testing:**

| Link | Opens |
|------|-------|
| `index.html#menu` | The games screen |
| `#brief:bridge` | A game's briefing |
| `#seat:hearts` | A game's seating screen |
| `#play:spades` (or `#play:ohhell&n:5`) | A game against computer players straight away |
| `#venue:noir62`, `#deck:storybook` | Switch the venue or the deck |
| `#house` | Open The House |

---

## Project structure

```
CARDS/
├── index.html                 # app shell; script order is load order
├── css/
│   ├── base.css               # scene, table, hand fan, drawer
│   ├── screens.css            # cold open, game hand, briefing slips
│   ├── table.css              # seats, rail, overlays, seating, per-game pieces
│   └── venues/                # riviera, lair, noir62, mayfair, nighttrain, vault
├── js/
│   ├── core/
│   │   ├── cards.js           # card model, decks, secure + seeded shuffle, card audit
│   │   ├── registry.js        # the twelve games' metadata; engines register here
│   │   ├── engine.js          # shared engine helpers: events, seats, narration
│   │   ├── tricks.js          # follow suit, trick winner
│   │   └── hands.js           # poker hand evaluation (best five of seven)
│   ├── games/                 # one rules engine per game (no DOM code)
│   ├── ai/                    # one computer player per game (+ _tricks.js, the shared trick brain)
│   ├── tables/                # one table view per game (+ _tricks.js, shared trick pieces)
│   ├── art/
│   │   ├── cardsvg.js         # card geometry, pips, indices, outline pips, backs registry
│   │   ├── backs.js           # card back designs
│   │   └── decks/             # classic, engraved, storybook, silhouette, inkline, pastel
│   ├── audio/
│   │   ├── mixer.js           # buses, compressor, venue reverb, synthesis helpers
│   │   ├── foley.js           # shuffle, deal, flip, chips, slap, cues
│   │   ├── stings.js          # spy-jazz music stings
│   │   ├── ambience.js        # a room-tone bed per venue
│   │   └── controls.js        # sound settings in The House
│   ├── venues/venues.js       # venue registry (look, acoustics, ambience, suggested deck)
│   ├── net.js                 # PeerJS transport: rooms, heartbeat, reconnects
│   └── ui/
│       ├── prefs.js           # saved preferences
│       ├── scene.js           # backdrop, subtitles, notices, The House drawer
│       ├── router.js          # screens
│       ├── coldopen.js  menu.js  gamecard.js  seating.js
│       ├── table.js           # the game table: host + renderer
│       ├── online.js          # online rooms, lobby, takeovers, resume/rejoin
│       └── app.js             # boot and test links
├── tools/deck-preview.html    # every card of every deck
├── .nojekyll                  # tells GitHub Pages to serve files as-is (keep it)
├── tests/                     # headless Node tests (no dependencies)
├── Rules_Modes.md             # the full rulebook for all 12 games
└── README.md
```

---

## Architecture

The design follows two earlier projects, *Auction XI* and *Home-made Mahjong*: plain HTML, CSS and JavaScript, no framework, and a rules engine kept separate from everything else. The interface and its look are entirely new.

**One shared namespace.** Every file is a self-running module that attaches to `window.C52`. The order of the `<script>` tags in `index.html` decides what loads first.

**Rules engines are pure.** Every game in `js/games/` registers the same interface and never touches the page:

| Function | Purpose |
|----------|---------|
| `options` | The house-rule choices shown on the seating card |
| `setup({ n, names, options }, rng)` | Builds a new match as a plain, JSON-safe state object |
| `actions(state, seat)` | Every move that seat may make right now (empty if it isn't their move) |
| `apply(state, seat, action, rng)` | Makes a move, but only if it is legal. Anything else is rejected. |
| `view(state, seat)` | The state with everything hidden that this seat isn't allowed to see |
| `zones(state)` | Every pile of cards, for the card audit |

Engines also keep a public **event list** (who did what, which sound to play). The table uses it for subtitles, sounds, the ledger and animations, and online guests receive it in their view.

Because the engine never touches the page, the same code runs the game in the browser, on the online host, inside the computer players and in the tests.

**The table is a host and a renderer.** The *host* owns the match state, applies moves, runs computer players (each on its own timer, cancelled on any change) and publishes views. The *renderer* draws one seat's view and turns clicks into moves. Online, the host also sends each guest their view, and a guest's renderer works exactly like a local one.

Each game supplies a small **table description** in `js/tables/`. It covers what goes in the middle of the felt, what each seat's label says, the top line, the hand, the action rail and the rules text.

**Cards.** A card is a two-character code: rank `A 2–9 T J Q K` followed by suit `S H D C`, so `TH` is the ten of hearts.

- Each match tracks where every card is. The tests confirm that all 52 cards are accounted for, each in exactly one place, after every move.
- Shuffling uses Fisher–Yates with `crypto.getRandomValues`. Tests use a seeded generator so games can be replayed exactly.

**Saved data** in the browser's `localStorage`:

- preferences
- seating choices for each game
- the host's online game, for 12 hours
- a guest's seat pass

---

## Testing

The test suite runs headless in Node with no dependencies:

```bash
node tests/run.js            # everything
node tests/run.js bridge     # files whose name contains "bridge"
SLOW=1 node tests/run.js     # also list the slowest tests
```

What the tests cover:

- **Card conservation:** after every move, all 52 cards are present and each is in exactly one place.
- **Computer-vs-computer games:** whole games for every title (40 each; 6 for Hold'em, whose players run many simulations). Every one must finish with every card accounted for.
- **Random-move games:** thousands of random but legal moves per title must never crash or lose a card.
- **No peeking:** each player's view must never contain another player's hidden cards.
- **Rule checks** with arranged deals, for example:
  - the Twenty-Five trump order and reneging
  - Bridge duplicate scores (made, doubled, redoubled, undertricks) and the 16-board cycle
  - Big Two hand ranking and straights
  - Hearts passing and shooting the moon
  - Spades bags and Nil
  - Oh Hell's dealer restriction
  - Blackjack payouts, splits, doubles and soft 17
  - Hold'em blinds, heads-up order and side pots
  - Klondike moves and undo
  - Rummy melds
  - Crazy Eights scoring
  - poker hand evaluation, including the wheel and kickers

---

## Hosting

The game is a static site, so any static host works.

- **GitHub Pages** (live at https://drag375o.github.io/CARDS/): in the repo settings, go to Pages, then *Deploy from branch*, choose `main` and `/ (root)`. Every push to `main` updates the site within a minute or two.
- **Netlify:** `npx netlify-cli deploy --prod --dir .`

> The repository includes an empty **`.nojekyll`** file. Keep it: without it, GitHub Pages runs Jekyll, which silently drops files whose names start with an underscore (such as `js/ai/_tricks.js`), and the trick-taking games stop working.

---

## Troubleshooting

| Problem | What to do |
|---------|------------|
| Computers don't move, or a game won't respond | Reload the page so the browser fetches the latest version (Ctrl+F5 / Cmd+Shift+R). If something goes wrong, the game now shows the error at the top of the screen — note what it says. |
| It looks like nothing is happening | Check the hint above the action rail on the right: it's probably your turn (for example, choose three cards to pass in Hearts, or make your bid in Spades). |
| No sound | Tap or click once: browsers only allow sound after you interact. Check the volumes in The House. If your browser blocks audio entirely, the game plays on silently. |
| Dragging doesn't work | Dragging is only used in Klondike. In every other game you tap or click cards and use the buttons on the right. |
| Can't join a friend's table | Online play needs an internet connection. Check the five-letter code; rooms close when the host leaves. |

---

## Credits

- The deck designs are based on reference artwork from [Vecteezy.com](https://www.vecteezy.com). All card art in this repository is original SVG drawn for the project. The reference files themselves are not distributed here.
- Online play uses [PeerJS](https://peerjs.com/).
- Typefaces: Bodoni Moda, Jost, Cormorant Garamond and Courier Prime, from Google Fonts.

## Disclaimer

52 Cards is a free game for fun. **No real money is involved.** Chips in Hold'em and Blackjack have no value and can't be bought or cashed out.
