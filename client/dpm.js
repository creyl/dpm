// TODO: Clicking on 'buy' button when not logged in prompts the user to log in

Meteor.subscribe('states');
Meteor.subscribe('payoffByUserByState');
Meteor.subscribe('userData');
Meteor.subscribe('balanceByUser');

Template.dpm.helpers({
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

    users: function () {
        return BalanceByUser.find({}, {
            sort: {profit: -1},
            transform: function (bbu) {
                bbu.username = Meteor.users.findOne(bbu.userId).username;
                bbu.cash = bbu.cash.toFixed(4);
                bbu.liquidationValue = bbu.liquidationValue.toFixed(4);
                bbu.profit = bbu.profit.toFixed(4);
                return bbu;
            }
        });
    },

    myPayoff: function () {
        var payoffByUserByState = PayoffByUserByState.findOne({userId: Meteor.userId(), stateId: this._id});
        return payoffByUserByState ? payoffByUserByState.payoff : 0;
    }
});

Template.dpm.events({
    'click input.sell': function () {
        if (Meteor.user())
            Meteor.call("addTransaction", Meteor.userId(), this._id, -UNIT_PAYOFF);
    },
    'click input.buy': function () {
        if (Meteor.user())
            Meteor.call("addTransaction", Meteor.userId(), this._id, UNIT_PAYOFF);
    },
    'click input.liquidate': function () {
        if (Meteor.user())
            Meteor.call("liquidate", this._id);  // this._id is the id of the BalanceByUser
    }
});

