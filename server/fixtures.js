// On server startup, wipe out database and create states, users and transactions.
Meteor.startup(function () {

        console.log('Creating fixtures at meteor startup');
        states.remove();
        Meteor.users.remove({});  // REMOVE ALL USERS
        BalanceByUser.remove({});
        PayoffByUserByState.remove({});
        Transactions.remove({});
        PriceAndOpenInterestHistory.remove({});

        var stateId1 = states.insert("Brazil wins", 0, 0, UNIT_PAYOFF);
        var stateId2 = states.insert("Brazil loses", 0, 0, UNIT_PAYOFF);

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
                UNIT_PAYOFF * Math.ceil(3 * Math.random()) * (Math.random() < 0.25 ? -1 : 1) // skewed towards buys
            );
        }

        Accounts.createUser({username: 'creyl', password: 'forecast'});

        console.log('There are', Meteor.users.find({}).count(), " users after startup.");
    }
);
