/**
 * Created by creyl on 10/20/14.
 */
/**
 * History of price and open interest for each state
 * {string} stateId
 * {number} index
 * {Date} timeStamp
 * {number} lastPrice
 * {number} openInterest The sum of all outstanding payoff on that state
 *
 * @type {Mongo.Collection}
 */
PriceAndOpenInterestHistory = new Meteor.Collection("priceAndOpenInterestHistory");

/**
 * This method adds the last price and open interest to the collection.
 * @param {string} stateId
 * @param {Date} timeStamp
 * @param {number} payoff
 */
PriceAndOpenInterestHistory.addNewEntry = function (stateId, timeStamp, payoff) {
    var paoihIndex = this.find().count();
    this.insert({
        stateId: stateId,
        index: paoihIndex + 1,
        timeStamp: timeStamp,
        openInterest: States.findOne(stateId).payoff,
        lastPrice: (payoff < 0) ? States.findOne(stateId).unitPayoffBid : States.findOne(stateId).unitPayoffOffer
    });
};
