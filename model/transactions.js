/**
 *
 * @type {Transactions}
 */
transactions = new Transactions();

/**
 *
 * @constructor
 */
function Transactions() {
    /**
     * Contains all transactions by user by state
     * {Date} timeStamp
     * {string} userId
     * {string} stateId
     * {number} payoff
     * Private
     * @type {Mongo.Collection}
     */
    var TransactionsCollection = new Mongo.Collection("transactions");

    /**
     * Inserts new transaction.
     * @param {Date} timeStamp
     * @param {string} userId
     * @param {string} stateId
     * @param {number} payoff
     * @returns {string} transactionId
     */
    this.insertTransaction = function (timeStamp, userId, stateId, payoff) {
        return TransactionsCollection.insert({
            timeStamp: timeStamp, // Should be server's timestamp, not client's
            userId: userId,
            stateId: stateId,
            payoff: payoff
        });
    };

    this.remove = function () {
        TransactionsCollection.remove({});
    };

    /**
     * Logs the description of a given transaction on the console
     * @param {string} transactionId
     */
    this.logTransaction = function (transactionId) {
        var transaction = TransactionsCollection.findOne(transactionId);

        console.log(Meteor.users.findOne(transaction.userId).username,
            (transaction.payoff > 0) ? "buys" : "sells",
            "<", states.getName(transaction.stateId), ">",
            transaction.payoff, "times.");
    };
}

Meteor.methods({
    /**
     * This method must be the only way to add to the Transactions collection
     * in order to guarantee that the States and Users info remains in-sync.
     * Must be global.
     *
     * @param {string} userId
     * @param {string} stateId
     * @param {number} payoff - A positive or negative number
     * @returns {string} transactionId
     */
    addTransaction: function (userId, stateId, payoff) {
        check(userId, String);
        check(stateId, String);
        check(payoff, Number);

        if (payoffByUserByState.isTransactionInvalid(userId, stateId, payoff)) {
            console.log("TRANSACTION REJECTED: Transaction would cause user", Meteor.users.findOne(userId).username,
                "to have a negative open interest with incremental payoff", payoff);
            return null; // TODO: Throw error
        }

        var timeStamp = new Date();
        var transactionId = transactions.insertTransaction(timeStamp, userId, stateId, payoff);
        transactions.logTransaction(transactionId);

        var preTransactionInvestment = states.calcInvestment();
        states.updatePayoff(stateId, payoff);
        var postTransactionInvestment = states.calcInvestment();

        priceAndOpenInterestHistory.addNewEntry(stateId, timeStamp, payoff);
        payoffByUserByState.updateUserPayoff(userId, stateId, payoff);
        states.updateUnitPayoffPrices(UNIT_PAYOFF);
        balanceByUser.updatePnL(userId, preTransactionInvestment, postTransactionInvestment);

        return transactionId;
    },

    /**
     * This function liquidates a user's position.
     * Must be global.
     * @param {string} userId
     */
    liquidate: function (userId) {
        check(userId, String);

        payoffByUserByState.find(userId).forEach(
            function (pbubs) {
                Meteor.call("addTransaction", userId, pbubs.stateId, -pbubs.payoff);
            }
        );
    }
});
