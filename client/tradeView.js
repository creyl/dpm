// TODO: Limit virtual cash to -10
// TODO: Show chart of price and open interest
// TODO: Link to invite your friends

Meteor.subscribe('states');
Meteor.subscribe('payoffByUserByState');
Meteor.subscribe('userData');
Meteor.subscribe('balanceByUser');

Template.tradeView.helpers({
    states: function () {
        return States.find({}, {
            sort: {name: +1},
            transform: function (state) {
                state.unitPayoffBid = state.unitPayoffBid.toFixed(4);
                state.unitPayoffOffer = state.unitPayoffOffer.toFixed(4);
                return state;
            }
        });
    },

    myPayoff: function () {
        var payoffByUserByState = PayoffByUserByState.findOne({userId: Meteor.userId(), stateId: this._id});
        return payoffByUserByState ? payoffByUserByState.payoff : 0;
    }
});

Template.tradeView.events({
    'click input.sell': function () {
        if (Meteor.user())
            Meteor.call("addTransaction", Meteor.userId(), this._id, -UNIT_PAYOFF);
    },
    'click input.buy': function () {
        if (Meteor.user())
            Meteor.call("addTransaction", Meteor.userId(), this._id, UNIT_PAYOFF);
    }
});

