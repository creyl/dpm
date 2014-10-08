/**
 * Created by creyl on 10/8/14.
 */
Template.leaderboard.helpers({
    topParticipants: function () {
        return BalanceByUser.find({}, {
            sort: {profit: -1},
            transform: function (bbu) {
                bbu.isCurrentUser = (bbu.userId === Meteor.userId());
                bbu.username = Meteor.users.findOne(bbu.userId).username;
                bbu.cash = bbu.cash.toFixed(4);
                bbu.liquidationValue = bbu.liquidationValue.toFixed(4);
                bbu.profit = bbu.profit.toFixed(4);
                return bbu;
            },
            limit: 10 // return top 10 results
        });
    }
});

Template.leaderboard.events({
    'click input.liquidate': function () {
        if (Meteor.user())
            Meteor.call("liquidate", this._id);  // this._id is the id of the BalanceByUser
    }
});
