// On server startup, wipe out database and create states, users and transactions.
Meteor.startup(function () {

  console.log('Creating fixtures at meteor startup')
  States.remove({});
  var stateId1 = States.insert({name: "Brazil wins", payoff: 0, unitPayoffBid: 0, unitPayoffOffer: unitPayoff});
  var stateId2 = States.insert({name: "Brazil loses", payoff: 0, unitPayoffBid: 0, unitPayoffOffer: unitPayoff});
  var nStates = States.find({}).count();

  Users.remove({});
  var names = [
    "Seed", "Ada Lovelace", "Grace Hopper", "Marie Curie", "Carl Friedrich Gauss",
    "Nikola Tesla"];
  var userId = [,,,,,];
  for (var i = 0; i < names.length; i++) 
    userId[i] = Users.insert({name: names[i], cash: 0, liquidationValue: 0, profit: 0});
  var nUsers = Users.find({}).count();

  Transactions.remove({});
  
  // Seed user buys uniform payoff profile
  var seedUser = Users.findOne(userId[0]);
  addTransaction(seedUser, States.findOne(stateId1), unitPayoff*100);
  addTransaction(seedUser, States.findOne(stateId2), unitPayoff*100);
  
  for (var i = 1; i < nUsers; i++) {
    addTransaction(
      Users.findOne(userId[i % nUsers]),
      States.findOne((i % 2)===0 ? stateId1 : stateId2),
      unitPayoff*10);
  }
}
              );
