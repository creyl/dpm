// Set up collections to contain market information. On the server,
// it is backed by MongoDB collections.

/**
 * Contains the states describing all possible outcomes for a given market
 * {string} name Description of state
 * {number} payoff Open interest for that state
 * {number} unitPayoffBid Bid price for a $1-contract
 * {number} unitPayoffOffer Offer price for a $1-contract
 *
 * @type {Mongo.Collection}
 */
States = new Meteor.Collection("states");

/**
 * Contains a user's payoff, aka open interest, by state
 * {string} userId
 * {string} stateId
 * {number} payoff
 *
 * @type {Mongo.Collection}
 */
PayoffByUserByState = new Meteor.Collection("payoffByUserByState");

/**
 * Contains a user's cash balance, unrealized profit and liquidation value of his/her open interest
 * {number} cash
 * {number} liquidationValue
 * {number} profit
 *
 * @type {Mongo.Collection}
 */
BalanceByUser = new Meteor.Collection("balanceByUser");

/**
 * Contains all transactions by user by state
 * {string} timeStamp
 * {string} userId
 * {string} stateId
 * {number} payoff
 *
 * @type {Mongo.Collection}
 */
Transactions = new Meteor.Collection("transactions");

/**
 * History of price and open interest for each state
 * {string} stateId
 * {string} timeStamp
 * {number} lastPrice
 * {number} openInterest The sum of all outstanding payoff on that state
 *
 * @type {Mongo.Collection}
 */
PriceAndOpenInterestHistory = new Meteor.Collection("priceAndOpenInterestHistory");