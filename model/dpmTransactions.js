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

        var payoffCursor = PayoffByUserByState.find({userId: userId, stateId: stateId});
        if (((payoffCursor.count() === 0) && (payoff < 0)) ||
            (payoff + payoffCursor.fetch().payoff < 0)) {
            console.log("TRANSACTION REJECTED: Transaction would cause user ", Meteor.users.findOne(userId).username,
                " to have a negative open interest.");
            return; // TODO: Throw error
        }

        var timeStamp = new Date();
        var transactionId = Transactions.insert({
            timeStamp: timeStamp, // Should be server's timestamp, not client's
            user: userId,
            state: stateId,
            payoff: payoff
        });
        var transaction = Transactions.findOne(transactionId);
        console.log("***New transaction:", transaction.timeStamp,
            Meteor.users.findOne(userId).username,
            (transaction.payoff > 0) ? "Buys" : "Sells",
            "<", States.findOne(stateId).name, ">");

        var preTransactionInvestment = States.calcInvestment(LAMBDA);
        States.update(stateId, {$inc: {payoff: payoff}});
        var postTransactionInvestment = States.calcInvestment(LAMBDA);

        var paoihIndex = PriceAndOpenInterestHistory.find().count();
        PriceAndOpenInterestHistory.insert({
            stateId: stateId,
            index: paoihIndex + 1,
            timeStamp: timeStamp,
            openInterest: States.findOne(stateId).payoff,
            lastPrice: (payoff < 0) ? States.findOne(stateId).unitPayoffBid : States.findOne(stateId).unitPayoffOffer
        });

        if (payoffCursor.count() === 0)
            PayoffByUserByState.insert({userId: userId, stateId: stateId, payoff: payoff});
        else {
            var payoffId = payoffCursor.fetch()[0]._id;
            PayoffByUserByState.update(payoffId, {$inc: {payoff: payoff}});
        }

        // Update all unit payoff prices
        States.updateUnitPayoffPrices(LAMBDA, UNIT_PAYOFF);

        if (!BalanceByUser.findOne({userId: userId}))
            BalanceByUser.insert({userId: userId, cash: 0, liquidationValue: 0, profit: 0});

        // Update the P&L for all users
        BalanceByUser.find({}).forEach(function (bbu) {
            var payoffArraySortedByState = PayoffByUserByState.find({userId: bbu.userId}, {sort: {stateId: 1}}).fetch();
            var cash = bbu.cash;
            if (bbu.userId === userId)
                cash += preTransactionInvestment - postTransactionInvestment;
            var liquidationValue = calcLiquidationValue(payoffArraySortedByState, States, LAMBDA);
            BalanceByUser.update(bbu._id, {
                $set: {
                    cash: cash,
                    liquidationValue: liquidationValue,
                    profit: cash + liquidationValue
                }
            });
        });
    },

    /**
     * This function liquidates a user's position.
     * Must be global.
     * @param {string} bbuId
     */
    liquidate: function (bbuId) {
        check(bbuId, String);

        var userId = BalanceByUser.findOne(bbuId).userId;
        PayoffByUserByState.find({userId: userId}).forEach(
            function (pbubs) {
                Meteor.call("addTransaction", userId, pbubs.stateId, -pbubs.payoff);
            }
        );
    }
});

/**
 * This functions returns the liquidation value for a user's aggregate payoff profile
 * @param payoffArraySortedByState
 * @param {Mongo.Collection} states
 * @param {number} lambda
 * @returns {number}
 */
var calcLiquidationValue = function (payoffArraySortedByState, states, lambda) {
    var investment0 = 0, investment1 = 0;
    var userPayoff;
    var i = 0;
    states.find({}, {sort: {_id: 1}}).forEach(function (state) {
        if (payoffArraySortedByState[i] && payoffArraySortedByState[i].stateId === state._id) {
            userPayoff = payoffArraySortedByState[i].payoff;
            i++;
        }
        else {
            userPayoff = 0;
        }
        investment0 += Math.pow(state.payoff, lambda);
        investment1 += Math.pow(state.payoff - userPayoff, lambda);
    });
    investment0 = Math.pow(investment0, 1.0 / lambda);
    investment1 = Math.pow(investment1, 1.0 / lambda);
    return (investment0 - investment1);
};
