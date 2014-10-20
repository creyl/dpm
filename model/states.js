/**
 * Created by creyl on 10/19/14.
 */
/**
 * Contains the states describing all possible outcomes for a given market.
 * Each item in the collection contains the following fields:
 * {string} name Description of state
 * {number} payoff Open interest for that state
 * {number} unitPayoffBid Bid price for a $1-contract
 * {number} unitPayoffOffer Offer price for a $1-contract
 *
 * @type {Mongo.Collection}
 */
States = new Meteor.Collection("states");

/**
 * Defines the lambda-norm
 * @type {number} */
States.LAMBDA = 10.0;

/**
 * This method returns the required investment for the entire DPM.
 * @returns {number}
 */
States.calcInvestment = function () {
    var investment = 0;
    this.find({}).forEach(function (state) {
        investment += Math.pow(state.payoff, States.LAMBDA);
    });
    investment = Math.pow(investment, 1.0 / States.LAMBDA);
    return investment;
};

/**
 * This method updates the unit payoff prices for each state.
 * @param {number} unitPayoff
 */
States.updateUnitPayoffPrices = function (unitPayoff) {
    var investment0 = this.calcInvestment();
    var totalValue = Math.pow(investment0, States.LAMBDA);
    var states = this;

    states.find({}).forEach(function (stateA) {
        var unbumpedValue = Math.pow(stateA.payoff, States.LAMBDA);
        var posBumpedValue = Math.pow(stateA.payoff + unitPayoff, States.LAMBDA);
        var negBumpedValue = Math.pow(stateA.payoff - unitPayoff, States.LAMBDA);
        var investment1 = Math.pow(totalValue - unbumpedValue + posBumpedValue, 1.0 / States.LAMBDA);
        var investment2 = Math.pow(totalValue - unbumpedValue + negBumpedValue, 1.0 / States.LAMBDA);
        states.update(stateA._id, {$set: {unitPayoffOffer: investment1 - investment0}});
        states.update(stateA._id, {$set: {unitPayoffBid: -investment2 + investment0}});
    });
};

/**
 * This method returns the liquidation value for a user's aggregate payoff profile.
 * @param {Object} payoffArraySortedByState
 * @returns {number}
 */
States.calcLiquidationValue = function (payoffArraySortedByState) {
    var investment0 = 0, investment1 = 0;
    var userPayoff;
    var i = 0;
    this.find({}, {sort: {_id: 1}}).forEach(function (state) {
        if (payoffArraySortedByState[i] && payoffArraySortedByState[i].stateId === state._id) {
            userPayoff = payoffArraySortedByState[i].payoff;
            i++;
        }
        else {
            userPayoff = 0;
        }
        investment0 += Math.pow(state.payoff, States.LAMBDA);
        investment1 += Math.pow(state.payoff - userPayoff, States.LAMBDA);
    });
    investment0 = Math.pow(investment0, 1.0 / States.LAMBDA);
    investment1 = Math.pow(investment1, 1.0 / States.LAMBDA);
    return (investment0 - investment1);
};
