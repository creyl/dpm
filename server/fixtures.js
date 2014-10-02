// On server startup, wipe out database and create states, users and transactions.
Meteor.startup(function () {

        console.log('Creating fixtures at meteor startup');
        States.remove({});
        var stateId1 = States.insert({name: "Brazil wins", payoff: 0, unitPayoffBid: 0, unitPayoffOffer: UNIT_PAYOFF});
        var stateId2 = States.insert({name: "Brazil loses", payoff: 0, unitPayoffBid: 0, unitPayoffOffer: UNIT_PAYOFF});

        Users.remove({});
        var names = [
            "Seed", "Ada Lovelace", "Grace Hopper", "Marie Curie", "Carl Friedrich Gauss",
            "Nikola Tesla"];
        var userId = [, , , , ,];
        for (var i = 0; i < names.length; i++)
            userId[i] = Users.insert({name: names[i], cash: 0, liquidationValue: 0, profit: 0});
        var nUsers = Users.find({}).count();

        Transactions.remove({});

        // Seed user buys uniform payoff profile
        Meteor.call("addTransaction", userId[0], stateId1, UNIT_PAYOFF * 100);
        Meteor.call("addTransaction", userId[0], stateId2, UNIT_PAYOFF * 100);

        for (i = 1; i < nUsers; i++) {
            Meteor.call("addTransaction", userId[i % nUsers], (i % 2) === 0 ? stateId1 : stateId2, UNIT_PAYOFF * 10);
        }
    }
);
