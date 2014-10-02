// TODO:
// * implement seeding of DPM
// * disable "sell" and "liquidate" buttons for users with zero payoff

Meteor.subscribe('states');
Meteor.subscribe('users');
Meteor.subscribe('payoffByUserByState');
Meteor.subscribe('transactions');

Meteor.startup(function () {
    // Allocate a new player id.
    //
    // XXX this does not handle hot reload. In the reload case,
    // Session.get('player_id') will return a real id. We should check for
    // a pre-existing player, and if it exists, make sure the server still
    // knows about us.
    var myId = Users.insert({name: "Your name", cash: 0, liquidationValue: 0, profit: 0});
    Session.set('myId', myId);
    console.log(Users.findOne(myId));
});

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
    return Users.find({}, {
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
    var payoffByUserByState = PayoffByUserByState.findOne({userId: Session.get('myId'), stateId: this._id});
    return payoffByUserByState ? payoffByUserByState.payoff : 0;
};

Template.dpm.events({
    'keyup input#myname': function (evt) {
        var name = String(evt.target.value || "");
        Users.update(Session.get('myId'), {$set: {name: name}});
    },
    'click input.sell': function () {
        Meteor.call("addTransaction", Session.get('myId'), this._id, -UNIT_PAYOFF);
    },
    'click input.buy': function () {
        Meteor.call("addTransaction", Session.get('myId'), this._id, UNIT_PAYOFF);
    },
    'click input.liquidate': function () {
        Meteor.call("liquidate", this._id);
    }
});

