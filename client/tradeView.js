Template.tradeView.helpers({
    states: function () {
        return states.tradeView();
    },

    myPayoff: function () {
        return payoffByUserByState.getPayoff(Meteor.userId(), this._id);
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

