/**
 * Created by creyl on 10/19/14.
 */
/**
 * This method returns the required investment for the entire DPM.
 * @param {number} lambda
 * @returns {number}
 */
States.calcInvestment = function (lambda) {
    var investment = 0;
    this.find({}).forEach(function (state) {
        investment += Math.pow(state.payoff, lambda);
    });
    investment = Math.pow(investment, 1.0 / lambda);
    return investment;
};

/**
 * This method updates the unit payoff prices for each state.
 * @param {number} lambda
 * @param {number} unitPayoff
 */
States.updateUnitPayoffPrices = function (lambda, unitPayoff) {
    var investment0 = this.calcInvestment(lambda);
    var totalValue = Math.pow(investment0, lambda);
    var states = this;

    states.find({}).forEach(function (stateA) {
        var unbumpedValue = Math.pow(stateA.payoff, lambda);
        var posBumpedValue = Math.pow(stateA.payoff + unitPayoff, lambda);
        var negBumpedValue = Math.pow(stateA.payoff - unitPayoff, lambda);
        var investment1 = Math.pow(totalValue - unbumpedValue + posBumpedValue, 1.0 / lambda);
        var investment2 = Math.pow(totalValue - unbumpedValue + negBumpedValue, 1.0 / lambda);
        states.update(stateA._id, {$set: {unitPayoffOffer: investment1 - investment0}});
        states.update(stateA._id, {$set: {unitPayoffBid: -investment2 + investment0}});
    });
};

/**
 * This method returns the liquidation value for a user's aggregate payoff profile.
 * @param {Object} payoffArraySortedByState
 * @param {number} lambda
 * @returns {number}
 */
States.calcLiquidationValue = function (payoffArraySortedByState, lambda) {
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
        investment0 += Math.pow(state.payoff, lambda);
        investment1 += Math.pow(state.payoff - userPayoff, lambda);
    });
    investment0 = Math.pow(investment0, 1.0 / lambda);
    investment1 = Math.pow(investment1, 1.0 / lambda);
    return (investment0 - investment1);
};
