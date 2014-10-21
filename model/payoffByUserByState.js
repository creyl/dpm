/**
 * Created by creyl on 10/20/14.
 */
/**
 *
 * @type {PayoffByUserByState}
 */
payoffByUserByState = new PayoffByUserByState();

/**
 *
 * @constructor
 */
function PayoffByUserByState() {
    /**
     * Contains a user's payoff, aka open interest, by state
     * {string} userId
     * {string} stateId
     * {number} payoff
     *
     * @type {Mongo.Collection}
     */
    var PayoffByUserByStateCollection = new Mongo.Collection("payoffByUserByState");

    /**
     * Returns whether a proposed transaction is valid or not.
     * @param {string} userId
     * @param {string} stateId
     * @param {number} payoff
     * @returns {boolean}
     */
    this.isTransactionInvalid = function (userId, stateId, payoff) {
        var payoffCursor = PayoffByUserByStateCollection.find({userId: userId, stateId: stateId});
        return (((payoffCursor.count() === 0) && (payoff < 0)) ||
        (payoff + payoffCursor.fetch().payoff < 0));
    };

    /**
     * Returns the array of payoffs sorted by state for a given user
     * @param {string} userId
     * @returns {Array}
     */
    this.getPayoffArraySortedByState = function (userId) {
        return PayoffByUserByStateCollection.find({userId: userId}, {sort: {stateId: 1}}).fetch();
    };

    /**
     *
     * @returns {Mongo.Cursor}
     */
    this.findAll = function () {
        return PayoffByUserByStateCollection.find();
    };

    /**
     *
     * @param {string} userId
     * @returns {Mongo.Cursor}
     */
    this.find = function (userId) {
        return PayoffByUserByStateCollection.find({userId: userId});
    };

    /**
     * Returns the payoff for a given user for a given state
     * @param {string} userId
     * @param {string} stateId
     * @returns {number}
     */
    this.getPayoff = function (userId, stateId) {
        var payoffByUserByState = PayoffByUserByStateCollection.findOne({userId: userId, stateId: stateId});
        return payoffByUserByState ? payoffByUserByState.payoff : 0;
    };

    this.remove = function () {
        PayoffByUserByStateCollection.remove({});
    };

    /**
     * Updates the user's payoff profile by the incremental payoff
     * @param {string} userId
     * @param {string} stateId
     * @param {number} incrementalPayoff
     */
    this.updateUserPayoff = function (userId, stateId, incrementalPayoff) {
        var payoffCursor = PayoffByUserByStateCollection.find({userId: userId, stateId: stateId});
        if (payoffCursor.count() === 0)
            PayoffByUserByStateCollection.insert({userId: userId, stateId: stateId, payoff: incrementalPayoff});
        else {
            var payoffId = payoffCursor.fetch()[0]._id;
            PayoffByUserByStateCollection.update(payoffId, {$inc: {payoff: incrementalPayoff}});
        }
    };
}

