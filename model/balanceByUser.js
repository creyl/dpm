/**
 * Created by creyl on 10/20/14.
 */
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
 * This method updates the balance attributes of all users with the latest information.
 * @param {string} userId
 * @param {number} preTransactionInvestment
 * @param {number} postTransactionInvestment
 */
BalanceByUser.updatePnL = function (userId, preTransactionInvestment, postTransactionInvestment) {
    // create an entry for a given user if it doesn't already exist
    if (!this.findOne({userId: userId}))
        this.insert({userId: userId, cash: 0, liquidationValue: 0, profit: 0});

    // Update the P&L for all users
    var self = this;
    self.find({}).forEach(function (bbu) {
        var payoffArraySortedByState = PayoffByUserByState.getPayoffArraySortedByState(bbu.userId);

        var cash = bbu.cash;
        if (bbu.userId === userId)
            cash += preTransactionInvestment - postTransactionInvestment;

        var liquidationValue = states.calcLiquidationValue(payoffArraySortedByState);

        self.update(bbu._id, {
            $set: {
                cash: cash,
                liquidationValue: liquidationValue,
                profit: cash + liquidationValue
            }
        });
    });
};
