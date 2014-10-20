/**
 * Created by creyl on 10/20/14.
 */
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
 * Returns whether a proposed transaction is valid or not.
 * @param {string} userId
 * @param {string} stateId
 * @param {number} payoff
 * @returns {boolean}
 */
PayoffByUserByState.isTransactionInvalid = function (userId, stateId, payoff) {
    var payoffCursor = this.find({userId: userId, stateId: stateId});
    return (((payoffCursor.count() === 0) && (payoff < 0)) ||
    (payoff + payoffCursor.fetch().payoff < 0));
};

/**
 * Returns the array of payoffs sorted by state for a given user
 * @param {string} userId
 * @returns {Array}
 */
PayoffByUserByState.getPayoffArraySortedByState = function (userId) {
    return this.find({userId: userId}, {sort: {stateId: 1}}).fetch();
};

/**
 * Updates the user's payoff profile by the incremental payoff
 * @param {string} userId
 * @param {string} stateId
 * @param {number} incrementalPayoff
 */
PayoffByUserByState.updateUserPayoff = function (userId, stateId, incrementalPayoff) {
    var payoffCursor = this.find({userId: userId, stateId: stateId});
    if (payoffCursor.count() === 0)
        this.insert({userId: userId, stateId: stateId, payoff: incrementalPayoff});
    else {
        var payoffId = payoffCursor.fetch()[0]._id;
        this.update(payoffId, {$inc: {payoff: incrementalPayoff}});
    }
};