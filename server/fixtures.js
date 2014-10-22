// On server startup, wipe out database and create states, users and transactions.
Meteor.startup(function () {

        console.log('Creating fixtures at meteor startup');
        states.remove();
        Meteor.users.remove({});  // REMOVE ALL USERS
        balanceByUser.remove();
        payoffByUserByState.remove();
        transactions.remove();
        priceAndOpenInterestHistory.remove();

        var stateId1 = states.insert("Brazil wins", 0, 0, UNIT_PAYOFF);
        var stateId2 = states.insert("Brazil loses", 0, 0, UNIT_PAYOFF);

        var seedUserId = Accounts.createUser({
            username: "Sponsor", password: "666666", profile: {isSponsor: true}
        });

        // Seed user buys uniform payoff profile
        Meteor.call("addTransaction", seedUserId, stateId1, UNIT_PAYOFF * 100);
        Meteor.call("addTransaction", seedUserId, stateId2, UNIT_PAYOFF * 100);

        var names = ["Ada Lovelace", "Grace Hopper", "Marie Curie", "Carl Friedrich Gauss", "Nikola Tesla"];
        var userId = [];
        names.forEach(function (name) {
            userId.push(Accounts.createUser({username: name, password: "666666"}));
        });

        var nUsers = names.length;
        for (var i = 0; i < 100; i++) {
            Meteor.call("addTransaction",
                userId[i % nUsers],
                (i % 2) === 0 ? stateId1 : stateId2,
                UNIT_PAYOFF * Math.ceil(3 * Math.random()) * (Math.random() < 0.25 ? -1 : 1) // skewed towards buys
            );
        }

        Accounts.createUser({username: 'superuser', password: 'forecast', profile: {isSuperUser: true}});

        console.log('There are', Meteor.users.find({}).count(), " users after startup.");
    }
);
