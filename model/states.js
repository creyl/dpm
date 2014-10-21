/**
 * Created by creyl on 10/19/14.
 */
/**
 * Global variable containing all state info and access methods.
 * @type {States}
 */
states = new States();

/**
 *
 * @constructor
 */
function States() {
    var self = this;

    /**
     * Defines the lambda-norm constant.
     * Private.
     * @type {number} */
    var LAMBDA = 10.0;

    /**
     * Contains the states describing all possible outcomes for a given market.
     * Private.
     * @type {Mongo.Collection}
     */
    var StatesCollection = new Mongo.Collection("states");

    this.remove = function () {
        StatesCollection.remove({});
    };

    /**
     * Each item in the collection contains the following fields:
     * @param {string} name Description of state
     * @param {number} payoff Open interest for that state
     * @param {number} unitPayoffBid Bid price for a $1-contract
     * @param {number} unitPayoffOffer Offer price for a $1-contract
     * @returns {string} stateId
     */
    this.insert = function (name, payoff, unitPayoffBid, unitPayoffOffer) {
        return StatesCollection.insert({
            name: name, payoff: payoff,
            unitPayoffBid: unitPayoffBid, unitPayoffOffer: unitPayoffOffer
        });
    };

    /**
     * Increases payoff on stateId by incremental payoff
     * @param {string} stateId
     * @param {number} incrementalPayoff
     */
    this.updatePayoff = function (stateId, incrementalPayoff) {
        StatesCollection.update(stateId, {$inc: {payoff: incrementalPayoff}});
    };

    /**
     *
     * @returns {Mongo.Cursor}
     */
    this.find = function () {
        return StatesCollection.find();
    };

    /**
     *
     * @returns {Mongo.Cursor}
     */
    this.tradeView = function () {
        return StatesCollection.find({}, {
            sort: {name: +1},
            transform: function (state) {
                state.unitPayoffBid = state.unitPayoffBid.toFixed(4);
                state.unitPayoffOffer = state.unitPayoffOffer.toFixed(4);
                return state;
            }
        });
    };

    /**
     * Returns array of state names
     * @returns {Array}
     */
    this.getNames = function () {
        return StatesCollection.find({}, {fields: {name: 1}})
            .map(function (s) {
                return s.name;
            });
    };

    /**
     *
     * @param {string} stateId
     * @returns {string}
     */
    this.getName = function (stateId) {
        return StatesCollection.findOne(stateId).name;
    };

    /**
     *
     * @param {string} stateId
     * @returns {number}
     */
    this.getPayoff = function (stateId) {
        return StatesCollection.findOne(stateId).payoff;
    };

    /**
     *
     * @param {string} stateId
     * @returns {number}
     */
    this.getUnitPayoffBid = function (stateId) {
        return StatesCollection.findOne(stateId).unitPayoffBid;
    };

    /**
     *
     * @param {string} stateId
     * @returns {number}
     */
    this.getUnitPayoffOffer = function (stateId) {
        return StatesCollection.findOne(stateId).unitPayoffOffer;
    };

    /**
     * This method returns the required investment for the entire DPM.
     * @returns {number}
     */
    this.calcInvestment = function () {
        var investment = 0;
        StatesCollection.find({}).forEach(function (state) {
            investment += Math.pow(state.payoff, LAMBDA);
        });
        investment = Math.pow(investment, 1.0 / LAMBDA);
        return investment;
    };

    /**
     * This method updates the unit payoff prices for each state.
     * @param {number} unitPayoff
     */
    this.updateUnitPayoffPrices = function (unitPayoff) {
        var investment0 = self.calcInvestment();
        var totalValue = Math.pow(investment0, LAMBDA);

        StatesCollection.find({}).forEach(function (state) {
            var unbumpedValue = Math.pow(state.payoff, LAMBDA);
            var posBumpedValue = Math.pow(state.payoff + unitPayoff, LAMBDA);
            var negBumpedValue = Math.pow(state.payoff - unitPayoff, LAMBDA);
            var investment1 = Math.pow(totalValue - unbumpedValue + posBumpedValue, 1.0 / LAMBDA);
            var investment2 = Math.pow(totalValue - unbumpedValue + negBumpedValue, 1.0 / LAMBDA);
            StatesCollection.update(state._id, {$set: {unitPayoffOffer: investment1 - investment0}});
            StatesCollection.update(state._id, {$set: {unitPayoffBid: -investment2 + investment0}});
        });
    };

    /**
     * This method returns the liquidation value for a user's aggregate payoff profile.
     * @param {Array} payoffArraySortedByState
     * @returns {number}
     */
    this.calcLiquidationValue = function (payoffArraySortedByState) {
        var investment0 = 0, investment1 = 0;
        var userPayoff;
        var i = 0;
        StatesCollection.find({}, {sort: {_id: 1}}).forEach(function (state) {
            if (payoffArraySortedByState[i] && payoffArraySortedByState[i].stateId === state._id) {
                userPayoff = payoffArraySortedByState[i].payoff;
                i++;
            }
            else {
                userPayoff = 0;
            }
            investment0 += Math.pow(state.payoff, LAMBDA);
            investment1 += Math.pow(state.payoff - userPayoff, LAMBDA);
        });
        investment0 = Math.pow(investment0, 1.0 / LAMBDA);
        investment1 = Math.pow(investment1, 1.0 / LAMBDA);
        return (investment0 - investment1);
    };

}
