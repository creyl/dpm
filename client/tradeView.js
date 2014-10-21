Template.tradeView.helpers({
    states: function () {
        return states.tradeView();
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

