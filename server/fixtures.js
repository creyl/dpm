// On server startup, wipe out database and create states, users and transactions.
Meteor.startup(function () {

        //if (states.find().count() === 0) {
        console.log('Creating fixtures at meteor startup');
        states.remove();
        Meteor.users.remove({});  // REMOVE ALL USERS
        balanceByUser.remove();
        payoffByUserByState.remove();
        transactions.remove();
        priceAndOpenInterestHistory.remove();

        var stateId1 = states.insert("The S&P500 closes at or above 2000 on 12/31/2014", 0, 0, UNIT_PAYOFF);
        var stateId2 = states.insert("The S&P500 closes below 2000 on 12/31/2014", 0, 0, UNIT_PAYOFF);

        var sponsorUserId = Accounts.createUser({
            username: "Sponsor", password: "666666", profile: {isSponsor: true}
        });

        // Seed user buys uniform payoff profile
        Meteor.call("addTransaction", sponsorUserId, stateId1, UNIT_PAYOFF * 100);
        Meteor.call("addTransaction", sponsorUserId, stateId2, UNIT_PAYOFF * 100);

        var names = ["Ada Lovelace", "Grace Hopper", "Marie Curie", "Carl Friedrich Gauss", "Nikola Tesla"];
        var userId = [];
        names.forEach(function (name) {
            userId.push(Accounts.createUser({username: name, password: "666666", profile: {}}));
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
    //}
);
