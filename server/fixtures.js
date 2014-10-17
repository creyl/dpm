// On server startup, wipe out database and create states, users and transactions.
Meteor.startup(function () {

        console.log('Creating fixtures at meteor startup');
        States.remove({});
        Meteor.users.remove({});  // REMOVE ALL USERS
        BalanceByUser.remove({});
        PayoffByUserByState.remove({});
        Transactions.remove({});
        PriceAndOpenInterestHistory.remove({});

        var stateId1 = States.insert({name: "Brazil wins", payoff: 0, unitPayoffBid: 0, unitPayoffOffer: UNIT_PAYOFF});
        var stateId2 = States.insert({name: "Brazil loses", payoff: 0, unitPayoffBid: 0, unitPayoffOffer: UNIT_PAYOFF});

        var names = [
            "Seed", "Ada Lovelace", "Grace Hopper", "Marie Curie", "Carl Friedrich Gauss",
            "Nikola Tesla"];
        var userId = [, , , , ,];
        for (var i = 0; i < names.length; i++) {
            userId[i] = Accounts.createUser({username: names[i]});
        }

        // Seed user buys uniform payoff profile
        Meteor.call("addTransaction", userId[0], stateId1, UNIT_PAYOFF * 100);
        Meteor.call("addTransaction", userId[0], stateId2, UNIT_PAYOFF * 100);

        var nUsers = Meteor.users.find({}).count();
        for (i = 1; i < 100; i++) {
            Meteor.call("addTransaction",
                userId[i % nUsers],
                (i % 2) === 0 ? stateId1 : stateId2,
                UNIT_PAYOFF * Math.floor(20 * (Math.random() - 0.5)));
        }

        Accounts.createUser({username: 'creyl', password: 'forecast'});

        console.log('There are', Meteor.users.find({}).count(), " users after startup.");
    }
);
