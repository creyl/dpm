/**
 * Created by creyl on 10/8/14.
 */
Template.leaderboard.helpers({
    topParticipants: function () {
        return balanceByUser.leaderboardView();
    },
    currentBbu: function () {
        return balanceByUser.currentBbuView();
    },
    maxBorrow: function () {
        return -balanceByUser.getMinCash();
    }
});

Template.leaderboard.events({
    'click input.liquidate': function () {
        if (Meteor.user()) {
            var userId = this.userId;
            Meteor.call("liquidate", userId);
        }
    }
});
