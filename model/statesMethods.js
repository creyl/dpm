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
