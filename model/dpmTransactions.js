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

        var preTransactionInvestment = calcInvestment(States, LAMBDA);
        States.update(stateId, {$inc: {payoff: payoff}});
        var postTransactionInvestment = calcInvestment(States, LAMBDA);

        var paoihIndex = PriceAndOpenInterestHistory.find().count();
        PriceAndOpenInterestHistory.insert({
            stateId: stateId,
            index: paoihIndex + 1,
            timeStamp: timeStamp,
            openInterest: States.findOne(stateId).payoff,
            lastPrice: (payoff < 0) ? States.findOne(stateId).unitPayoffBid : States.findOne(stateId).unitPayoffOffer
        });

        var payoffCursor = PayoffByUserByState.find({userId: userId, stateId: stateId});
        if (payoffCursor.count() === 0)
            PayoffByUserByState.insert({userId: userId, stateId: stateId, payoff: payoff});
        else {
            var payoffId = payoffCursor.fetch()[0]._id;
            PayoffByUserByState.update(payoffId, {$inc: {payoff: payoff}});
        }

        // Update all unit payoff prices
        updateUnitPayoffPrices(States, LAMBDA, UNIT_PAYOFF);

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
 * This function returns the required investment for the entire DPM
 * @param {Mongo.Collection} states
 * @param {number} lambda
 * @returns {number}
 */
var calcInvestment = function (states, lambda) {
    var investment = 0;
    states.find({}).forEach(function (state) {
        investment += Math.pow(state.payoff, lambda);
    });
    investment = Math.pow(investment, 1.0 / lambda);
    return investment;
};

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

/**
 * This function updates the unit payoff prices for each state.
 * @param {Mongo.Collection} states
 * @param {number} lambda
 * @param {number} unitPayoff
 */
var updateUnitPayoffPrices = function (states, lambda, unitPayoff) {
    var investment0 = calcInvestment(states, lambda);

    var investment1, investment2;
    states.find({}).forEach(function (stateA) {
        investment1 = 0;
        investment2 = 0;
        states.find({}).forEach(function (stateB) {
            investment1 += Math.pow(stateB.payoff + (stateA._id === stateB._id ? unitPayoff : 0), lambda);
            investment2 += Math.pow(stateB.payoff + (stateA._id === stateB._id ? -unitPayoff : 0), lambda);
        });
        investment1 = Math.pow(investment1, 1.0 / lambda);
        investment2 = Math.pow(investment2, 1.0 / lambda);
        states.update(stateA._id, {$set: {unitPayoffOffer: investment1 - investment0}});
        states.update(stateA._id, {$set: {unitPayoffBid: -investment2 + investment0}});
    });
};
