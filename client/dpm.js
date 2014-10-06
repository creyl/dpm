// TODO:
// * implement seeding of DPM
// * disable "sell" and "liquidate" buttons for users with zero payoff

Meteor.subscribe('states');
Meteor.subscribe('payoffByUserByState');
Meteor.subscribe('userData');

Template.dpm.states = function () {
    return States.find({}, {
        sort: {name: +1},
        transform: function (state) {
            state.unitPayoffBid = state.unitPayoffBid.toFixed(4);
            state.unitPayoffOffer = state.unitPayoffOffer.toFixed(4);
            return state;
        }
    });
};

Template.dpm.users = function () {
    return Meteor.users.find({}, {
        sort: {profit: -1},
        transform: function (user) {
            user.cash = user.cash.toFixed(4);
            user.liquidationValue = user.liquidationValue.toFixed(4);
            user.profit = user.profit.toFixed(4);
            return user;
        }
    });
};

Template.dpm.myPayoff = function () {
    var payoffByUserByState = PayoffByUserByState.findOne({userId: Meteor.userId(), stateId: this._id});
    return payoffByUserByState ? payoffByUserByState.payoff : 0;
};

Template.dpm.events({
    'click input.sell': function () {
        Meteor.call("addTransaction", Meteor.userId(), this._id, -UNIT_PAYOFF);
    },
    'click input.buy': function () {
        Meteor.call("addTransaction", Meteor.userId(), this._id, UNIT_PAYOFF);
    },
    'click input.liquidate': function () {
        Meteor.call("liquidate", this._id);
    }
});

