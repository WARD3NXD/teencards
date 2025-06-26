export class TeenPattiGame {
  constructor(players) {
    this.players = players.map(p => ({
      ...p,
      cards: [],
      bet: 0,
      totalBet: 0,
      folded: false,
      isPlaying: true
    }));
    this.deck = this.createDeck();
    this.pot = 0;
    this.currentPlayerIndex = 0;
    this.currentBet = 2; // Minimum bet
    this.round = 1;
    this.gamePhase = 'betting'; // 'betting', 'showdown', 'finished'
  }

  createDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank, value: this.getCardValue(rank) });
      }
    }
    
    return this.shuffleDeck(deck);
  }

  getCardValue(rank) {
    const values = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
      'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    return values[rank];
  }

  shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  dealCards() {
    // Deal 3 cards to each player
    for (let i = 0; i < 3; i++) {
      for (const player of this.players) {
        if (player.isPlaying) {
          player.cards.push(this.deck.pop());
        }
      }
    }
    
    // Set initial ante
    this.players.forEach(player => {
      if (player.isPlaying) {
        player.bet = 1;
        player.totalBet = 1;
        this.pot += 1;
      }
    });
  }

  handlePlayerAction(playerId, action, amount = 0) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || !player.isPlaying || player.folded) {
      return { success: false, error: 'Invalid player or player not in game' };
    }

    const currentPlayer = this.players[this.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    let lastAction = { playerId, playerName: player.name, action, amount: 0 };

    switch (action) {
      case 'pack':
        player.folded = true;
        player.isPlaying = false;
        lastAction.action = 'packed';
        break;

      case 'call':
        const callAmount = this.currentBet - player.bet;
        player.bet = this.currentBet;
        player.totalBet += callAmount;
        this.pot += callAmount;
        lastAction.amount = this.currentBet;
        break;

      case 'raise':
        const raiseAmount = Math.max(amount, this.currentBet * 2);
        const betDifference = raiseAmount - player.bet;
        player.bet = raiseAmount;
        player.totalBet += betDifference;
        this.pot += betDifference;
        this.currentBet = raiseAmount;
        lastAction.amount = raiseAmount;
        break;

      default:
        return { success: false, error: 'Invalid action' };
    }

    this.nextTurn();
    
    return { success: true, lastAction };
  }

  nextTurn() {
    const activePlayers = this.getActivePlayers();
    
    if (activePlayers.length <= 1) {
      this.gamePhase = 'finished';
      return;
    }

    // Find next active player
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    } while (!this.players[this.currentPlayerIndex].isPlaying || this.players[this.currentPlayerIndex].folded);

    // Check if betting round is complete
    const playingPlayers = activePlayers.filter(p => p.bet === this.currentBet);
    if (playingPlayers.length === activePlayers.length) {
      this.round++;
      
      // After several rounds, force showdown
      if (this.round > 5 || activePlayers.length === 2) {
        this.gamePhase = 'showdown';
      }
    }
  }

  getActivePlayers() {
    return this.players.filter(p => p.isPlaying && !p.folded);
  }

  removePlayer(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      player.isPlaying = false;
      player.folded = true;
    }
  }

  isGameOver() {
    const activePlayers = this.getActivePlayers();
    return activePlayers.length <= 1 || this.gamePhase === 'finished';
  }

  getWinners() {
    const activePlayers = this.getActivePlayers();
    
    if (activePlayers.length === 1) {
      return [{ ...activePlayers[0], winnings: this.pot }];
    }

    // Evaluate hands for showdown
    const handsWithPlayers = activePlayers.map(player => ({
      player,
      hand: this.evaluateHand(player.cards),
      cards: player.cards
    }));

    // Sort by hand strength (higher is better)
    handsWithPlayers.sort((a, b) => {
      if (a.hand.rank !== b.hand.rank) {
        return b.hand.rank - a.hand.rank;
      }
      return b.hand.value - a.hand.value;
    });

    // Find all players with the best hand
    const bestHandRank = handsWithPlayers[0].hand.rank;
    const bestHandValue = handsWithPlayers[0].hand.value;
    const winners = handsWithPlayers.filter(h => 
      h.hand.rank === bestHandRank && h.hand.value === bestHandValue
    );

    const winningsPerPlayer = Math.floor(this.pot / winners.length);
    return winners.map(w => ({ 
      ...w.player, 
      winnings: winningsPerPlayer,
      hand: w.hand,
      cards: w.cards
    }));
  }

  evaluateHand(cards) {
    const sorted = [...cards].sort((a, b) => b.value - a.value);
    const ranks = sorted.map(c => c.value);
    const suits = sorted.map(c => c.suit);
    
    // Check for Trail (Three of a kind)
    if (ranks[0] === ranks[1] && ranks[1] === ranks[2]) {
      return { rank: 6, value: ranks[0], name: 'Trail' };
    }
    
    // Check for Pure Sequence (Straight flush)
    const isSequence = this.isSequence(ranks);
    const isFlush = suits[0] === suits[1] && suits[1] === suits[2];
    
    if (isSequence && isFlush) {
      return { rank: 5, value: ranks[0], name: 'Pure Sequence' };
    }
    
    // Check for Sequence (Straight)
    if (isSequence) {
      return { rank: 4, value: ranks[0], name: 'Sequence' };
    }
    
    // Check for Color (Flush)
    if (isFlush) {
      return { rank: 3, value: ranks[0], name: 'Color' };
    }
    
    // Check for Pair
    if (ranks[0] === ranks[1] || ranks[1] === ranks[2] || ranks[0] === ranks[2]) {
      const pairValue = ranks[0] === ranks[1] ? ranks[0] : 
                       ranks[1] === ranks[2] ? ranks[1] : ranks[0];
      return { rank: 2, value: pairValue, name: 'Pair' };
    }
    
    // High Card
    return { rank: 1, value: ranks[0], name: 'High Card' };
  }

  isSequence(ranks) {
    const sorted = [...ranks].sort((a, b) => a - b);
    
    // Check for A-2-3 (special case)
    if (sorted[0] === 2 && sorted[1] === 3 && sorted[2] === 14) {
      return true;
    }
    
    // Check for consecutive sequence
    return sorted[1] === sorted[0] + 1 && sorted[2] === sorted[1] + 1;
  }

  getGameState() {
    return {
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        bet: p.bet,
        totalBet: p.totalBet,
        folded: p.folded,
        isPlaying: p.isPlaying,
        cardCount: p.cards.length
      })),
      pot: this.pot,
      currentPlayerIndex: this.currentPlayerIndex,
      currentBet: this.currentBet,
      round: this.round,
      gamePhase: this.gamePhase
    };
  }

  getPlayerCards() {
    const playerCards = {};
    this.players.forEach(player => {
      playerCards[player.id] = player.cards;
    });
    return playerCards;
  }

  getAllCards() {
    const allCards = {};
    this.players.forEach(player => {
      allCards[player.id] = player.cards;
    });
    return allCards;
  }
}