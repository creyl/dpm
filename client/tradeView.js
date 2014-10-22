Template.tradeView.helpers({
    states: function () {
        return states.tradeView();
    },

    myPayoff: function () {
        return payoffByUserByState.getPayoff(Meteor.userId(), this._id);
    },

    enoughCash: function () {
        var userId = Meteor.userId();
        if (userId) {
            var cost = states.getUnitPayoffOffer(this._id);
            return (!balanceByUser.isResultingCashLimitExceeded(userId, cost));
        }
        else
            return false;
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

