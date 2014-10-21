/**
 * Created by creyl on 10/20/14.
 */
/**
 * Global
 * @type {PriceAndOpenInterestHistory}
 */
priceAndOpenInterestHistory = new PriceAndOpenInterestHistory();

/**
 *
 * @constructor
 */
function PriceAndOpenInterestHistory() {
    /**
     * History of price and open interest for each state
     * {string} stateId
     * {number} index
     * {Date} timeStamp
     * {number} lastPrice
     * {number} openInterest The sum of all outstanding payoff on that state
     *
     * @type {Mongo.Collection}
     */
    var PriceAndOpenInterestHistoryCollection = new Mongo.Collection("priceAndOpenInterestHistory");

    /**
     *
     * @returns {Mongo.Cursor}
     */
    this.find = function () {
        return PriceAndOpenInterestHistoryCollection.find();
    };

    this.remove = function () {
        PriceAndOpenInterestHistoryCollection.remove({});
    };

    /**
     * This method adds the last price and open interest to the collection.
     * @param {string} stateId
     * @param {Date} timeStamp
     * @param {number} payoff
     * @returns {string} id of entry
     */
    this.addNewEntry = function (stateId, timeStamp, payoff) {
        var paoihIndex = PriceAndOpenInterestHistoryCollection.find().count();
        return PriceAndOpenInterestHistoryCollection.insert({
            stateId: stateId,
            index: paoihIndex + 1,
            timeStamp: timeStamp,
            openInterest: states.getPayoff(stateId),
            lastPrice: (payoff < 0) ? states.getUnitPayoffBid(stateId) : states.getUnitPayoffOffer(stateId)
        });
    };

    /**
     * Returns an array of the last 100 last prices for each state for charting purposes:
     * [{name: state0, values:
     *      [{index: 1, lastPrice: 0.1},
     *      {index: 3, lastPrice: 0.3},
     *      {index: 5, lastPrice: 0.4},
     *      ...
     *      ]},
     *  {name: state1, values:
     *    [{index: 0, lastPrice: 0.9},
     *     {index: 2, lastPrice: 0.7},
     *     {index: 4, lastPrice: 0.6},
     *     ...
     *    ]},
     *   ...
     *  ]
     * @returns {Array}
     */
    this.getLast100History = function () {
        var stateCursor = states.find(); // Not expected to change throughout life of market
        return stateCursor.map(function (state) {
            return {
                name: state.name,
                values: PriceAndOpenInterestHistoryCollection.find(
                    {stateId: state._id},
                    {fields: {index: 1, lastPrice: 1}, sort: {index: -1}, limit: 100}
                ).fetch()
            }
        });
    };
}
