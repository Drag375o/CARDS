# THE 52-CARD COLLECTION
## Master Game Rules & Instruction Specification

### PROJECT OVERVIEW

Create a collection of 12 traditional and popular card games playable using a standard 52-card deck.

The collection contains:
- 8 renowned games recognized and played internationally or across major regional communities.
- 4 less-mainstream games that introduce different mechanics and provide variety.

Every game must have its own complete rules, setup instructions, gameplay logic, scoring system and winning conditions.

The instructions must be self-contained. A person who has never played a particular game should be able to understand it and start playing without needing external explanations.

---

# 1. STANDARD CARD DECK

All games use a standard 52-card deck unless a particular game's rules require cards to be removed.

### Suits
- Hearts (♥)
- Diamonds (♦)
- Clubs (♣)
- Spades (♠)

### Card Ranks
- Ace (A)
- 2–10
- Jack (J)
- Queen (Q)
- King (K)

### General Rules
- No Jokers unless explicitly required by a variation.
- Explain whether Aces are high, low or both in each game.
- Explain the ranking of suits whenever relevant.
- Explain any cards removed during setup.
- Never assume all games use the same card-ranking system.

---

# 2. RENOWNED CARD GAMES

These eight games form the main collection.

## GAME 01: TEXAS HOLD'EM POKER

**Players:** 2–10

### Objective
Create the strongest possible five-card poker hand using any combination of two private cards and five shared community cards.

The objective is to win chips by having the best hand at showdown or by making all opponents fold.

### Setup
1. Every player receives two private cards face down.
2. One player acts as the dealer or button.
3. The two players immediately to the dealer's left place the small blind and big blind.
4. A betting round begins.

### Gameplay

**1. Pre-Flop**
- Every player receives two private cards.
- Players decide whether to fold, call or raise.
- Betting proceeds clockwise.

**2. The Flop**
- Three community cards are revealed face up.
- Another betting round begins.

**3. The Turn**
- A fourth community card is revealed.
- Another betting round takes place.

**4. The River**
- The fifth and final community card is revealed.
- The final betting round begins.

**5. Showdown**
- Remaining players reveal their private cards.
- Each player forms their strongest five-card combination.
- The strongest hand wins the pot.

### Player Actions
- Fold: Leave the current hand.
- Check: Pass without betting, when permitted.
- Bet: Place chips into the pot.
- Call: Match the current bet.
- Raise: Increase the current bet.
- All-in: Bet all remaining chips.

### Poker Hand Rankings
From strongest to weakest:

1. Royal Flush
2. Straight Flush
3. Four of a Kind
4. Full House
5. Flush
6. Straight
7. Three of a Kind
8. Two Pair
9. One Pair
10. High Card

### Winning Conditions
- Win when every opponent folds.
- Otherwise, the player with the strongest five-card hand wins.
- Split the pot when hands tie.

---

## GAME 02: BLACKJACK (21)

**Players:** 2 or more, including one dealer

### Objective
Achieve a hand value closer to 21 than the dealer without exceeding 21.

### Card Values
- Number cards: Their printed value.
- Jack, Queen and King: 10 points.
- Ace: 1 or 11 points, whichever benefits the hand without busting.

### Setup
1. Choose one player or computer as the dealer.
2. Every player places a bet.
3. Each player receives two face-up cards.
4. The dealer receives one face-up card and one face-down card.

### Gameplay

Players act one at a time.

Available actions:

- Hit: Take another card.
- Stand: Keep the current hand.
- Double Down: Double the original bet and receive exactly one additional card.
- Split: If the initial two cards have the same rank, separate them into two hands and play each independently.

The dealer reveals the hidden card after all players finish.

The dealer must:
- Hit when the total is 16 or lower.
- Stand when the total is 17 or higher.

For a soft 17, specify whether the dealer hits or stands before play begins.

### Winning Conditions
- A hand exceeding 21 loses immediately.
- A hand closer to 21 than the dealer wins.
- A hand equal to the dealer's total is a push (tie).
- A natural Blackjack is an Ace and a 10-value card as the initial two cards.

Use standard casino payout conventions, with the Blackjack payout specified before play.

---

## GAME 03: KLONDIKE SOLITAIRE

**Players:** 1

### Objective
Move all 52 cards into four foundation piles, one for each suit, in ascending order from Ace to King.

### Setup

Arrange seven tableau columns:

- Column 1: One card.
- Column 2: Two cards.
- Column 3: Three cards.
- Column 4: Four cards.
- Column 5: Five cards.
- Column 6: Six cards.
- Column 7: Seven cards.

Only the top card of each column is face up.

The remaining 24 cards form the stock pile.

Create four empty foundation spaces.

### Gameplay

Players can:

1. Move cards between tableau columns.
2. Build tableau sequences in descending order.
3. Alternate red and black colors when building tableau sequences.
4. Move Aces to the foundation piles.
5. Build foundation piles in ascending order using the same suit.
6. Draw cards from the stock pile.
7. Move the top waste card into a tableau column or foundation when legal.

### Restrictions
- Only Kings can be placed in empty tableau columns.
- Only the top exposed card of a tableau column can be moved.
- A face-down card is revealed when the card above it is removed.

Choose either a one-card or three-card stock draw mode before starting.

### Winning Conditions
Win by moving all four suits into their foundations from Ace through King.

---

## GAME 04: RUMMY (STANDARD 52-CARD VERSION)

**Players:** 2–6

### Objective
Form valid sets and sequences and get rid of all cards in your hand.

### Definitions

**Set:** Three or four cards of the same rank but different suits.

Example:
- 7♥, 7♦, 7♣

**Sequence:** Three or more consecutive cards of the same suit.

Example:
- 4♠, 5♠, 6♠

### Setup
Use one standard 52-card deck.

Deal:
- 2 players: 10 cards each.
- 3–4 players: 7 cards each.
- 5–6 players: 6 cards each.

Place the remaining cards face down as the stock pile.

Reveal one card to start the discard pile.

### Gameplay

Each turn consists of:

1. Draw one card from either the stock or discard pile.
2. Organize your hand into possible sets and sequences.
3. Optionally lay down valid combinations, according to the chosen Rummy variant.
4. Discard one card to end your turn.

Players continue taking turns until someone goes out or the stock is exhausted.

### Scoring
When a player goes out, opponents count the unmatched cards remaining in their hands.

Suggested standard values:
- Ace: 1 point.
- 2–10: Face value.
- Jack, Queen, King: 10 points.

### Winning Conditions
The first player to go out wins the round.

For a match, play multiple rounds and use the agreed cumulative scoring system.

Use a clearly defined basic draw-and-discard Rummy variant. Do not mix rules from Gin Rummy or Indian Rummy into this version.

---

## GAME 05: HEARTS

**Players:** 4

### Objective
Finish with the lowest total score by avoiding penalty cards.

### Card Values
- Every Heart: 1 penalty point.
- Queen of Spades: 13 penalty points.
- Other cards: 0 points.

### Setup
1. Shuffle the 52-card deck.
2. Deal all cards equally.
3. Each player receives 13 cards.
4. Select the first player according to the standard opening rule: the player holding the 2 of Clubs starts.

### Gameplay

1. Players take turns playing one card.
2. The first player leads a suit.
3. Other players must follow that suit if they have it.
4. If a player cannot follow suit, they may play another suit, subject to restrictions.
5. The highest card of the suit led wins the trick.
6. The trick winner leads the next trick.

### Important Rules
- Hearts cannot normally be led until they have been broken.
- Hearts are broken when a player discards a Heart because they cannot follow the suit led.
- The Queen of Spades carries 13 penalty points.
- On the first trick, penalty cards are subject to the standard first-trick restrictions.

### Shooting the Moon
If a player collects all 13 Hearts and the Queen of Spades, they have collected all 26 penalty points.

Instead of receiving 26 points, they can make every opponent receive 26 points.

### Winning Conditions
Play multiple rounds until someone reaches 100 points or the agreed target.

The player with the lowest total score wins.

---

## GAME 06: SPADES

**Players:** 4, in two partnerships

### Objective
Predict and win the number of tricks your team bids.

### Setup
1. Divide players into two teams.
2. Partners sit opposite each other.
3. Deal all 52 cards.
4. Each player receives 13 cards.

### Card Ranking
A, K, Q, J, 10, 9, 8, 7, 6, 5, 4, 3, 2.

Spades are always the trump suit.

### Gameplay

**1. Bidding**
- Each player announces how many tricks they expect to win.
- Partners' bids are added together.
- Nil bids are permitted in standard play.

**2. Playing**
- The first player leads a card.
- Other players must follow the led suit if possible.
- If unable to follow suit, a player may play another suit.
- A Spade beats cards from other suits.
- The highest card of the led suit wins unless a Spade is played, in which case the highest Spade wins.

**3. Next Trick**
- The trick winner leads the next trick.

### Important Rules
- Spades cannot normally be led until broken.
- Spades are broken when a player plays one because they cannot follow the led suit.
- Standard opening restrictions and nil-bid rules should be enforced.

### Scoring
A team meeting its combined bid receives 10 points per trick bid.

Additional tricks receive 1 point each, called bags.

Failing to meet the bid results in a penalty of 10 points per trick bid.

A Nil bid earns a bonus if successful and a penalty if unsuccessful. Set the scoring values before play.

### Winning Conditions
First team to reach the agreed target, commonly 500 points, wins.

---

## GAME 07: CONTRACT BRIDGE

**Players:** 4, two partnerships

### Objective
Win tricks according to a contract established through bidding.

### Setup
1. Divide players into two partnerships.
2. Partners sit opposite each other.
3. Deal all 52 cards.
4. Every player receives 13 cards.

### Card Ranking
A, K, Q, J, 10, 9, 8, 7, 6, 5, 4, 3, 2.

### Gameplay

Bridge has two main phases.

**Phase 1: Auction**

Players bid in clockwise order.

A bid specifies:
- A level from 1 to 7.
- A denomination: Clubs, Diamonds, Hearts, Spades or No Trump.

Each bid represents a commitment to win six tricks plus the stated level.

Players may:
- Bid.
- Pass.
- Double an opponent's contract.
- Redouble an opponent's double.

The auction ends after three consecutive passes following a bid.

The final contract determines the declarer, dummy, trump suit and required tricks.

**Phase 2: Play**

1. The player to declarer's left leads the opening card.
2. Declarer's partner places all 13 cards face up on the table as dummy.
3. Declarer controls both their own cards and dummy's cards.
4. Players follow suit when possible.
5. The highest card of the led suit wins unless a trump card is played.
6. The winner leads the next trick.

### Scoring
Scoring depends on:
- Contract denomination.
- Number of tricks won.
- Whether the contract succeeds.
- Vulnerability.
- Bonuses for game, slam, doubles and redoubles.

Use standard duplicate Bridge scoring rather than inventing a simplified scoring system.

### Winning Conditions
Teams compete across multiple deals. The match winner is determined by the agreed Bridge scoring format.

---

## GAME 08: CRAZY EIGHTS

**Players:** 2–7

### Objective
Be the first player to get rid of every card.

### Setup
1. Shuffle the deck.
2. Deal 7 cards to each player when playing 2–4 players.
3. For 5–7 players, deal 5 cards each.
4. Place the remaining cards face down as the draw pile.
5. Reveal one card to start the discard pile.

### Gameplay

Players take turns clockwise.

A player can play a card if:
- It matches the suit of the top discard.
- It matches the rank of the top discard.
- It is an Eight.

Eights are wild cards.

When playing an Eight, the player chooses the next suit.

If a player cannot play:
- Draw a card according to the chosen standard rule.
- If the drawn card is playable, it may be played immediately.
- Otherwise, the turn ends.

### Winning Conditions
The first player to discard all cards wins the round.

For multiplayer scoring, count the remaining cards in opponents' hands.

Use:
- Eight: 50 points.
- Face cards: 10 points.
- Number cards: Face value.
- Ace: 1 point.

The winner receives the sum of opponents' remaining card values.

Play until an agreed target, such as 100 or 200 points.

---

# 3. NICHE CARD GAMES

These four games provide variety and introduce less-mainstream mechanics.

## GAME 09: BIG TWO

**Players:** 2–4

### Objective
Be the first player to get rid of all your cards.

### Card Ranking

In the common four-player version, card strength is:

- 3 is the lowest rank.
- 4, 5, 6, 7, 8, 9, 10, J, Q, K, A.
- 2 is the highest rank.

A commonly used suit ranking from weakest to strongest is:
Diamonds, Clubs, Hearts, Spades.

### Setup
1. Shuffle the 52-card deck.
2. Deal 13 cards to each player.
3. The player holding the 3 of Diamonds starts.

### Valid Combinations

Players may play:
- Single card.
- Pair.
- Three of a Kind.
- Five-card combination.

Five-card combinations include:
1. Straight.
2. Flush.
3. Full House.
4. Four of a Kind with an additional card.
5. Straight Flush.

Use the agreed traditional five-card hand hierarchy for comparing combinations.

### Gameplay

1. The starting player plays a valid combination containing the 3 of Diamonds.
2. The next player must play the same number of cards in a stronger combination.
3. Alternatively, the player may pass.
4. A player who passes cannot re-enter that particular play unless the table is reset.
5. When all other players pass, the last player who played wins the pile.
6. That player begins a new play with any valid combination.

### Winning Conditions
The first player to empty their hand wins.

### Important Note
Big Two has regional variations in suit ranking and five-card combination ranking. Use one clearly specified version consistently.

---

## GAME 10: EGYPTIAN RAT SCREW

**Players:** 2–6

### Objective
Collect all 52 cards by winning piles and reacting quickly to special combinations.

### Setup
1. Shuffle the deck.
2. Deal all cards equally.
3. Each player keeps their cards face down.
4. Players must not look at their cards before playing them.

### Gameplay

Players take turns placing the top card of their deck face up in the center, creating a central pile.

**Normal Cards**
- Number cards require no special response.
- Players continue playing cards until a face card or Ace appears.

**Face Card Challenge**

When a player reveals:
- Jack: The next player has one chance to play another face card or Ace.
- Queen: The next player has two chances.
- King: The next player has three chances.
- Ace: The next player has four chances.

If the challenged player reveals another face card or Ace, the challenge transfers to the next player using the new card's challenge count.

If the challenged player fails to reveal a face card or Ace within the allowed attempts, the player who played the last face card wins the entire central pile.

**Slapping Rules**

Players can slap the central pile when specific combinations appear.

Common slap opportunities:
- Doubles: Two consecutive cards of the same rank.
- Sandwich: Two cards of the same rank separated by one card.

The first eligible player to slap correctly collects the pile.

### Winning Conditions
A player wins by collecting all 52 cards.

### Important Note
Egyptian Rat Screw has many house-rule variations. Define the permitted slap combinations and penalties before starting.

---

## GAME 11: OH HELL

**Players:** 3–7

### Objective
Predict exactly how many tricks you will win in each round.

### Setup
1. Shuffle the deck.
2. Deal a specified number of cards to each player.
3. Reveal the next card to determine the trump suit.
4. Keep the remaining cards out of play.

### Round Structure
Use a progressive deal:

- Round 1: One card per player.
- Round 2: Two cards per player.
- Round 3: Three cards per player.
- Continue increasing the number of cards.
- Stop when the deck cannot support another complete round.

For 3–7 players, the maximum hand size must be calculated according to the number of players and the chosen trump-indicator procedure.

### Bidding

Each player announces the exact number of tricks they expect to win.

Bidding proceeds clockwise.

The dealer's bid is restricted in the common version so that the total bids cannot equal the number of tricks available in that round.

### Gameplay
1. The first player leads a card.
2. Other players must follow suit if possible.
3. If unable to follow suit, they may play another suit.
4. The highest card of the led suit wins unless a trump card is played.
5. The highest trump wins the trick.
6. The trick winner leads the next trick.

### Scoring
A common scoring system is:
- Exact bid: 10 points plus the number of tricks bid.
- Incorrect bid: 0 points.

### Winning Conditions
After all rounds, the player with the highest cumulative score wins.

---

## GAME 12: TWENTY-FIVE

**Players:** 3–9

### Objective
Be the first player or team to reach 25 points by winning tricks.

### Setup
1. Shuffle the 52-card deck.
2. Deal five cards to each player.
3. Turn the next card face up to determine the trump suit.
4. The remaining cards are not used in that hand.

### Card Ranking

Twenty-Five uses an unusual trump hierarchy.

In the traditional form, the strongest trump cards are:

1. 5 of trumps.
2. Jack of trumps.
3. Ace of Hearts.

The remaining trump cards follow their traditional ranking, with the exact ordering of red and black suits depending on the trump suit.

Non-trump cards follow their ordinary trick-taking ranking, with special treatment of the Ace of Hearts.

The full trump hierarchy must be explicitly implemented. Do not use ordinary Spades or Whist ranking for this game.

### Gameplay
1. The player to the dealer's left leads.
2. Other players play one card each.
3. Players must follow suit if possible, subject to the traditional trump rules.
4. A trump card beats a non-trump card.
5. The highest-ranking card wins the trick.
6. The trick winner leads the next trick.

### Scoring
- Each trick won earns 5 points.
- Five tricks win the hand and award 25 points.

### Winning Conditions
The first player to reach 25 points wins the game.

### Important Note
Twenty-Five has historical regional variations. Implement one documented traditional Irish ruleset, particularly its special trump and follow-suit rules.

---

# 4. GENERAL IMPLEMENTATION REQUIREMENTS

These rules apply to the entire collection.

### Card Management
- Every card must have a unique suit and rank.
- A card cannot exist in two locations simultaneously.
- Cards must be shuffled before each new game or round.
- Face-down and face-up card states must be maintained.
- Every game must use its own correct deck configuration.

### Turn Management
- Enforce turn order.
- Prevent players from making illegal moves.
- Clearly indicate whose turn it is.
- Handle skipped turns and special actions correctly.
- Automatically detect when a round or game ends.

### Multiplayer
Support the player counts specified for each game.

Where partnerships exist, implement team assignments and team scoring.

### Game Information
Every game should display:
- Game objective.
- Number of players.
- Current player's turn.
- Current score.
- Cards remaining in relevant piles.
- Legal available actions.
- Current round.
- Winning conditions.

### Rules Accuracy
- Do not simplify a game in a way that changes its fundamental mechanics.
- Do not combine different variants without explicitly defining the resulting ruleset.
- Follow the specified card rankings and scoring systems.
- Explain all special cases.
- Handle ties, empty draw piles, invalid moves and round-ending conditions.

### FINAL OBJECTIVE

Create a complete, playable collection of 12 distinct card games using a standard 52-card deck.

The collection should provide:
- Familiar games that most card players can recognize.
- Strategic games that reward skill and planning.
- Casual games that are easy to learn.
- Competitive multiplayer experiences.
- Solo gameplay.
- Four less-mainstream games that make the collection stand out.

Each game must be independently playable, with complete rules and no dependence on another game in the collection.