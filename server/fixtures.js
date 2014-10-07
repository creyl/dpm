// On server startup, wipe out database and create states, users and transactions.
Meteor.startup(function () {

        console.log('Creating fixtures at meteor startup');
        States.remove({});
        Meteor.users.remove({});  // REMOVE ALL USERS
        BalanceByUser.remove({});
        PayoffByUserByState.remove({});
        Transactions.remove({});

        var stateId1 = States.insert({name: "Brazil wins", payoff: 0, unitPayoffBid: 0, unitPayoffOffer: UNIT_PAYOFF});
        var stateId2 = States.insert({name: "Brazil loses", payoff: 0, unitPayoffBid: 0, unitPayoffOffer: UNIT_PAYOFF});

        // Additional fields for Meteor.users -- {
        //           cash: Number,
        //           liquidationValue: Number,
        //           profit: Number}
        var names = [
            "Seed", "Ada Lovelace", "Grace Hopper", "Marie Curie", "Carl Friedrich Gauss",
            "Nikola Tesla"];
        var userId = [, , , , ,];
        for (var i = 0; i < names.length; i++) {
            userId[i] = Accounts.createUser({username: names[i]});
            BalanceByUser.insert({userId: userId[i], cash: 0, liquidationValue: 0, profit: 0});
        }

        // Seed user buys uniform payoff profile
        Meteor.call("addTransaction", userId[0], stateId1, UNIT_PAYOFF * 100);
        Meteor.call("addTransaction", userId[0], stateId2, UNIT_PAYOFF * 100);

        var nUsers = Meteor.users.find({}).count();
        for (i = 1; i < nUsers; i++) {
            Meteor.call("addTransaction", userId[i % nUsers], (i % 2) === 0 ? stateId1 : stateId2, UNIT_PAYOFF * 10);
        }

        BalanceByUser.insert({
            userId: Accounts.createUser({username: 'creyl', password: 'forecast'}),
            cash: 0, liquidationValue: 0, profit: 0
        });

        console.log('There are', Meteor.users.find({}).count(), " users after startup.");
    }
);
