//BACKEND SCRIPTS (business logic)

gameInitialized = false;
  //The ranks of cards in a deck and their corresponding values in blackjack.
var ranks = [["2", 2, "deuce"], ["3", 3, "three"], ["4", 4, "four"], ["5", 5, "five"], ["6", 6, "six"], ["7", 7, "seven"], ["8", 8, "eight"], ["9", 9, "nine"], ["10", 10, "ten"], ["j", 10, "jack"], ["q", 10, "queen"], ["k", 10, "king"], ["a", 1, "ace"]];
  //The suits of cards in a deck.
var suits = [["spades", "♠"], ["hearts", "♥"], ["clubs", "♣"], ["diams", "♦"]];
  // BankRoll is the amount of money the player has available to wager.
var playerBankRoll = 1000;

  // The current shoe object in use.
var currentShoe;
  // The hand object for the player and dealer
var playerHand;
var dealerHand;

  //The Card object has a rank and suit, just as a real playing card would. 'Shuffle score' is used to randomize the cards for shuffling. deckNumber tracks which deck the card cam from for multiple deck shoes. 'value' tracks the value of the card with aces counted as 11.
function Card(rank, suit, suitSymbol, value, rankName, number){
  this.rank = rank;
  this.suit = suit;
  this.rankName = rankName;
  this.suitSymbol = suitSymbol;
  this.value = value;
  this.deckNumber = number;
  this.shuffleScore;
};

  // Individualshand contains an array cards, the score is their combined value, and the number of aces for tracking hard, vs. soft hands. 'Wager' is the number of points the player has bet on this round.
function IndividualHand(){
  this.cards = [];
  this.containsAce = false;
  this.hardScore = 0;
  this.softScore = 0;
  this.wager = 25;
}

  //checks if a hand is busted
IndividualHand.prototype.isBust = function(){
  if (this.hardScore > 21) {
    return true;
  } else {
    return false;
  }
}

  //determines whether the dealer will hit or stay
var hitOrStay = function(hand){
  for(; hand.hardScore < 17 && hand.softScore < 17;){
    currentShoe.dealCard(hand);
    $("#dealerHand").append(hand.cards[hand.cards.length -1].toHTML());
  }
}

var evaluateRound = function(dealerHand, playerHand) {
  endHand();
  var dealerFinalScore = dealerHand.finalScore();
  var playerFinalScore = playerHand.finalScore();
  if (dealerHand.isBust()) {
    playerBankRoll += playerHand.wager;
    $("#actionOutput").append(". Dealer is bust with a score of " + dealerHand.hardScore + ". You win! Your bankroll is now $" + playerBankRoll);
    $("#bankRollBanner").text(playerBankRoll);
  } else if (playerFinalScore > dealerFinalScore){
    playerBankRoll += playerHand.wager;
    $("#actionOutput").append(". You have " + playerFinalScore + " and the dealer has " + dealerFinalScore + ". Congrats, you win. Your bankroll is now $" + playerBankRoll);
    $("#bankRollBanner").text(playerBankRoll);
  } else if (playerFinalScore === dealerFinalScore) {
    $("#actionOutput").append(". You have " + playerFinalScore + " and the dealer has " + dealerFinalScore + ". It's a tie. Your bankroll is now $" + playerBankRoll);
    $("#bankRollBanner").text(playerBankRoll);
  } else if (playerFinalScore < dealerFinalScore) {
    playerBankRoll -= playerHand.wager;
    $("#actionOutput").append(". You have " + playerFinalScore + " and the dealer has " + dealerFinalScore + ". Sorry, you lose. Your bankroll is now $" + playerBankRoll);
    $("#bankRollBanner").text(playerBankRoll);

  }
}

IndividualHand.prototype.finalScore = function(){
  if (this.softScore > 21) {
    return this.hardScore;
  } else {
    return this.softScore;
  }
}

  // The shoe object represents all cards in the decks being played. remainingCards are the cards remaining to be dealt, dealtCards are those that have been dealt. redCard is the indicator for when a shuffle is required before the next round can be dealt. decks tracks the number of decks used to create this shoe.
function Shoe(decks){
  this.decks = decks;
  this.remainingCards = [];
  this.redCard = 26;
  this.dealtCards = [];
  var cardsArray = this.remainingCards;
  for (var i = 0; i < this.decks; i++){
    suits.forEach(function(suit){
      ranks.forEach(function(rank){
        cardsArray.push(new Card(rank[0], suit[0], suit[1], rank[1], rank[2], i+1));
      })
    })
  }
  this.shuffle();
}

  //Calling the Shoe.shuffle() method removes all cards from dealtCards and places them in remainingCards. It then randomizes the order of remainingCards.
Shoe.prototype.shuffle = function(){
  var remainingCardsPointer = this.remainingCards;
  this.dealtCards.forEach(function(card){
    remainingCardsPointer.push(card);
  });
  this.dealtCards = [];
  this.remainingCards.forEach(function(card){
    card.shuffleScore = Math.random();
  });
  this.remainingCards.sort(function(a, b){
    return b.shuffleScore - a.shuffleScore;
  });
}

  //This method takes a card from remaining cards and adds it to the dealtCards and the hand parameter's cards array, updating scores as necessary.
Shoe.prototype.dealCard = function(hand){
  var currentCard = this.remainingCards.pop();
  hand.cards.push(currentCard);
  if (currentCard.rank === 'a') {
    hand.containsAce = true;
  }
  this.dealtCards.push(currentCard);
  hand.hardScore = hand.hardScore + currentCard.value;
  hand.softScore = hand.hardScore;
  if (hand.hardScore < 12 && hand.containsAce){
    hand.softScore += 10;
  }
}

//Deals two cards to the hand parameter
Shoe.prototype.dealHand = function(individual){
  individual.cards = [];
  individual.containsAce = false;
  individual.hardScore = 0;
  individual.softScore = 0;
  individual.wager;
  this.dealCard(individual);
  this.dealCard(individual);
}

  //This deals cards to the player and dealer to begin the round, shuffling first if necessary.
Shoe.prototype.dealRound = function(player, dealer, currentWager){
  if (this.redCard >= this.remainingCards.length){
    this.shuffle();
  }
  var result = ["", "", ""];
  this.dealHand(player);
  this.dealHand(dealer);
  player.wager = currentWager;
  if(dealer.softScore === 21) {
    endHand();
    dealerHandShow();
    if (player.softScore === 21) {
      result[0] = "You and the dealer both have blackjack. It's a tie.";
    } else {
      playerBankRoll -= playerHand.wager;
      result[0] = "The dealer has Blackjack. Sorry, you lose.";
    }
  } else if (player.softScore === 21) {
    dealerHandShow();
    endHand();
    playerBankRoll += (playerHand.wager * 1.5);
    result[0] = "You have blackjack!, congratulations, you get paid 3-2 on your bet."
    } else {
    result[0] = "You have " + player.softScore +" and the dealer shows a " + dealer.cards[1].rankName + ". Click hit or stay."
    result[1] = "<div class=\"card rank-blank blank\">" +
                  "<span class='rank'>&nbsp;</span>" +
                  "<span class='suit'>&nbsp;</span>"+
                  "</div>";
    result[2] = dealer.cards[1].toHTML();
  }
  return result;
}

// takes card as parameter and returns html tags to output for that card
Card.prototype.toHTML = function(){
  return "<a><div class=\"card rank-" + this.rank + " " + this.suit + "\"><span class=\"rank\">" + (this.rank + "").toUpperCase() + "</span><span class=\"suit\">" + this.suitSymbol + "</span></div></a>";
};

//FRONTEND SCRIPTS (user interface logic)
var endHand = function (){
  $(".notInPlay button").prop("disabled", false);
  $(".notInPlay button").removeClass("greyedOut");
  $(".inPlay button").prop("disabled", true);
  $(".inPlay button").addClass("greyedOut");
};

var dealerHandShow = function (){
  $("#dealerHand").text("");
  $("#dealerHand").append(dealerHand.cards[0].toHTML() + dealerHand.cards[1].toHTML());
};

$(document).ready(function(){

  $(".dealButton").click(function(event){
    event.preventDefault();
      $(".notInPlay button").prop("disabled", true);
      $(".notInPlay button").addClass("greyedOut");
      $(".inPlay button").prop("disabled", false);
      $(".inPlay button").removeClass("greyedOut");
      $("#playerHandTarget").text("");
      $("#dealerHand").text("");
      var currentWager = parseInt($('input[name="bet"]:checked').val());
      var dealResult = currentShoe.dealRound(playerHand, dealerHand, currentWager);
      $("#dealerHand").append(dealResult[1] + dealResult[2]);
      $("#playerHandTarget").append(playerHand.cards[0].toHTML() + playerHand.cards[1].toHTML());
      $("#actionOutput").text(dealResult[0]);// "You have " + playerHand.softScore +" and the dealer shows a " + dealerHand.cards[0].rank + ". click hit or stay.");
  });

  //scripts for when the player clicks the 'Hit' button
  $(".hitButton").click(function(event){
    event.preventDefault();
    currentShoe.dealCard(playerHand);
    $(".doubleButton").prop("disabled", true);
    $(".doubleButton").addClass("greyedOut");
    $("#playerHandTarget").append(playerHand.cards[playerHand.cards.length -1].toHTML());
    $("#actionOutput").text("You took a hit. You now have " + playerHand.softScore);
    //output dealt card, indicate score.
    if (playerHand.isBust()){
      playerBankRoll -= playerHand.wager;
      dealerHandShow();
      $("#actionOutput").append(". Sorry, you busted out. Your bankroll is now $" + playerBankRoll);
      endHand();
    } else {
      $("#actionOutput").append(". Click hit or stay");
    }
  });

  //scripts for when the player clicks the 'Stay' button
  $(".stayButton").click(function(event){
    event.preventDefault();
    dealerHandShow();
    $("#actionOutput").text("You stay on " + playerHand.softScore);
    hitOrStay(dealerHand);
    evaluateRound(dealerHand, playerHand,);
  });
  //scripts for when the player clicks the 'double' button
  $(".doubleButton").click(function(event){
    event.preventDefault();
    endHand();
    playerHand.wager *= 2;
    $("#actionOutput").text("You doubled on " + playerHand.softScore + ", for a total wager of $" + playerHand.wager);
    currentShoe.dealCard(playerHand);
    $("#playerHandTarget").append(playerHand.cards[playerHand.cards.length - 1].toHTML());
    dealerHandShow();
    if(playerHand.isBust()){
      playerBankRoll -= playerHand.wager;
      $("#actionOutput").append(". Sorry, you busted out. Your bankroll is now $" + playerBankRoll);
    } else {
    hitOrStay(dealerHand);
    evaluateRound(dealerHand, playerHand);
      }
  });

  //scripts for when the player clicks the 'New Game' button
  $(".playButton").click(function(event){
    event.preventDefault();
    $(".actionButtons").show();
    $("#dealerHand").show();
    $("#playerHandTarget").show();
    $("#playerHandTarget").text("");
    $("#dealerHand").text("");
    $(".playButton").hide();
    $(".actionButtons, #dealerHand, #playerHandTarget, .betBox").show();
    $("#playerHandTarget").text("");
    $("#dealerHand").text("");
    endHand();
    gameInitialized = true;
    currentShoe = new Shoe(1);
    playerHand =  new IndividualHand();
    dealerHand = new IndividualHand();
    playerBankRoll = 1000;
    $("#actionOutput").text("");
    $("#actionOutput").append("The shoe is shuffled and a new game is ready. <strong>PLACE YOUR BET!</strong>");
  });
  //scripts for when the player clicks the 'Shuffle' button. Note, this is only an option when the player is not in the middle of a hand.
  $(".shuffleButton").click(function(event){
    event.preventDefault();
    currentShoe.shuffle();
    $("#playerHandTarget, #dealerHand").text("");
    $("#actionOutput").text("The shoe is shuffled.");
  });
});
