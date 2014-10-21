/**
 * Contains all transactions by user by state
 * {Date} timeStamp
 * {string} userId
 * {string} stateId
 * {number} payoff
 *
 * @type {Mongo.Collection}
 */
Transactions = new Meteor.Collection("transactions");

Meteor.methods({
    /**
     * This method must be the only way to add to the Transactions collection
     * in order to guarantee that the States and Users info remains in-sync.
     * Must be global.
     *
     * @param {string} userId
     * @param {string} stateId
     * @param {number} payoff - A positive or negative number
     */
    addTransaction: function (userId, stateId, payoff) {
        check(userId, String);
        check(stateId, String);
        check(payoff, Number);

        if (payoffByUserByState.isTransactionInvalid(userId, stateId, payoff)) {
            console.log("TRANSACTION REJECTED: Transaction would cause user", Meteor.users.findOne(userId).username,
                "to have a negative open interest with incremental payoff", payoff);
            return; // TODO: Throw error
        }

        var timeStamp = new Date();
        var transactionId = Transactions.insert({
            timeStamp: timeStamp, // Should be server's timestamp, not client's
            userId: userId,
            stateId: stateId,
            payoff: payoff
        });
        Transactions.logTransaction(transactionId);

        var preTransactionInvestment = states.calcInvestment();
        states.updatePayoff(stateId, payoff);
        var postTransactionInvestment = states.calcInvestment();

        priceAndOpenInterestHistory.addNewEntry(stateId, timeStamp, payoff);
        payoffByUserByState.updateUserPayoff(userId, stateId, payoff);
        states.updateUnitPayoffPrices(UNIT_PAYOFF);
        BalanceByUser.updatePnL(userId, preTransactionInvestment, postTransactionInvestment);
    },

    /**
     * This function liquidates a user's position.
     * Must be global.
     * @param {string} bbuId
     */
    liquidate: function (bbuId) {
        check(bbuId, String);

        var userId = BalanceByUser.findOne(bbuId).userId;
        payoffByUserByState.find(userId).forEach(
            function (pbubs) {
                Meteor.call("addTransaction", userId, pbubs.stateId, -pbubs.payoff);
            }
        );
    }
});

/**
 * Logs the description of a given transaction on the console
 * @param {string} transactionId
 */
Transactions.logTransaction = function (transactionId) {
    var transaction = this.findOne(transactionId);

    console.log(Meteor.users.findOne(transaction.userId).username,
        (transaction.payoff > 0) ? "buys" : "sells",
        "<", states.getName(transaction.stateId), ">",
        transaction.payoff, "times.");
};
