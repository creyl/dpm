/**
 * Created by creyl on 10/20/14.
 */
/**
 * Global
 * @type {BalanceByUser}
 */
balanceByUser = new BalanceByUser();

/**
 *
 * @constructor
 */
function BalanceByUser() {
    /**
     * Contains a user's cash balance, unrealized profit and liquidation value of his/her open interest
     * {string} userId
     * {number} cash
     * {number} liquidationValue
     * {number} profit
     * Private.
     * @type {Mongo.Collection}
     */
    var BalanceByUserCollection = new Mongo.Collection("balanceByUser");

    /**
     * Constant describing the minimum cash levels available to participants on the system
     * @type {number}
     */
    var MIN_CASH = -10;

    this.findAll = function () {
        return BalanceByUserCollection.find();
    };

    /**
     *
     * @returns {Mongo.Cursor}
     */
    this.leaderboardView = function () {
        return BalanceByUserCollection.find({}, {
            sort: {profit: -1},
            limit: 10, // return top 10 results
            transform: function (bbu) {
                bbu.isCurrentUser = (bbu.userId === Meteor.userId());
                bbu.username = Meteor.users.findOne(bbu.userId).username;
                bbu.cash = bbu.cash.toFixed(4);
                bbu.liquidationValue = bbu.liquidationValue.toFixed(4);
                bbu.profit = bbu.profit.toFixed(4);
                return bbu;
            }
        });
    };

    this.remove = function () {
        BalanceByUserCollection.remove({});
    };

    /**
     *
     * @param {string} userId
     * @returns {number}
     */
    this.getCashBalance = function (userId) {
        var bbu = BalanceByUserCollection.findOne({userId: userId}, {fields: {cash: 1}});
        return bbu ? bbu.cash : 0;
    };

    /**
     * Returns whether a contemplated transaction would drop a user's cash level below the minimum.
     * @param userId
     * @param cost
     * @returns {boolean}
     */
    this.isResultingCashLimitExceeded = function (userId, cost) {
        var profile = Meteor.users.findOne(userId).profile;
        if (profile && profile.isSeed)
            return false;

        var cash = this.getCashBalance(userId);
        return (cash - cost < MIN_CASH);
    };

    /**
     * This method updates the balance attributes of all users with the latest information.
     * @param {string} userId
     * @param {number} preTransactionInvestment
     * @param {number} postTransactionInvestment
     */
    this.updatePnL = function (userId, preTransactionInvestment, postTransactionInvestment) {
        // create an entry for a given user if it doesn't already exist
        if (!BalanceByUserCollection.findOne({userId: userId}))
            BalanceByUserCollection.insert({userId: userId, cash: 0, liquidationValue: 0, profit: 0});

        // Update the P&L for all users
        BalanceByUserCollection.find({}).forEach(function (bbu) {
            var payoffArraySortedByState = payoffByUserByState.getPayoffArraySortedByState(bbu.userId);

            var cash = bbu.cash;
            if (bbu.userId === userId)
                cash += preTransactionInvestment - postTransactionInvestment;

            var liquidationValue = states.calcLiquidationValue(payoffArraySortedByState);

            BalanceByUserCollection.update(bbu._id, {
                $set: {
                    cash: cash,
                    liquidationValue: liquidationValue,
                    profit: cash + liquidationValue
                }
            });
        });
    };
}

