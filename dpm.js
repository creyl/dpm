// testing file sync again
// TODO:
// * implement P&L for each user
// * show table of users ranked by P&L
// * implement seeding of DPM
// * disable "sell" button for users with zero payoff

// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "transactions".

// States -- {name: String,
//           payoff: Number,
//           unitPayoffBid: Number,
//           unitPayoffOffer: Number}
States = new Meteor.Collection("states");

// Users -- {name: String,
//           cash: Number,
//           liquidationValue: Number,
//           profit: Number}
Users = new Meteor.Collection("users");

// PayoffByUserByState -- {userId: String,
//                         stateId: String,
//                         payoff: Number}
PayoffByUserByState = new Meteor.Collection("payoffByUserByState");

// Transactions -- {timeStamp: String, 
//                 user: User,
//                 state: State,
//                 payoff: Number}
Transactions = new Meteor.Collection("transactions");

lambda = 5.0; // Defines the lambda-norm
unitPayoff = 1.0;

if (Meteor.isClient) {
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

  Template.dpm.transactions = function () {
    return Transactions.find({}, {sort: {timeStamp: -1}, limit: 50});
  };

  Template.dpm.states = function () {
    return States.find({}, {
      sort: {name: +1},
      transform: function (state) {
        state.unitPayoffBid = state.unitPayoffBid.toFixed(4);
        state.unitPayoffOffer = state.unitPayoffOffer.toFixed(4);
        return state;
      }
    });
  }

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
  }

  Template.dpm.myPayoff = function () {
    var payoffByUserByState = PayoffByUserByState.findOne({userId: Session.get('myId'), stateId: this._id});
    return payoffByUserByState ? payoffByUserByState.payoff : 0;
  }
  
  Template.dpm.events({
    'keyup input#myname': function (evt) {
      var name = String(evt.target.value || "");
      Users.update(Session.get('myId'), {$set: {name: name}});
    },
    'click input.sell': function () {
      addTransaction(Users.findOne(Session.get('myId')), this, -unitPayoff);
    },
    'click input.buy': function () {
      addTransaction(Users.findOne(Session.get('myId')), this, unitPayoff);
    },
    'click input.liquidate': function () {
      liquidate(Users.findOne(this, States));
    }
  });

}

// On server startup, wipe out database and create states, users and transactions.
if (Meteor.isServer) {
  Meteor.startup(function () {

    States.remove({});
    var stateId1 = States.insert({name: "Brazil wins", payoff: 0, unitPayoffBid: 0, unitPayoffOffer: unitPayoff});
    var stateId2 = States.insert({name: "Brazil loses", payoff: 0, unitPayoffBid: 0, unitPayoffOffer: unitPayoff});
    var nStates = States.find({}).count();

    Users.remove({});
    var names = [
      "Ada Lovelace", "Grace Hopper", "Marie Curie", "Carl Friedrich Gauss",
      "Nikola Tesla", "Claude Shannon"];
    var userId = [,,,,,];
    for (var i = 0; i < names.length; i++) 
      userId[i] = Users.insert({name: names[i], cash: 0, liquidationValue: 0, profit: 0});
    var nUsers = Users.find({}).count();

    Transactions.remove({});
    for (var i = 0; i < 5; i++) {
      addTransaction(
        Users.findOne(userId[i % nUsers]),
        States.findOne((i % 2)===0 ? stateId1 : stateId2),
        unitPayoff*100);
    }
  }
                );
}

// This function should be the only way to add to the Transactions collection
// in order to guarantee that the States and Users info remains in-sync
var addTransaction = function (user, state, payoff) {
  var transactionId = Transactions.insert({
        timeStamp: (new Date()).toISOString(), 
        user: user,
        state: state,
        payoff: payoff
      });
  console.log(Transactions.findOne(transactionId));
  
  var preTransactionInvestment = calcInvestment(States, lambda);
  States.update(state._id, {$inc: {payoff: payoff}});
  console.log(States.findOne(state._id));
  var postTransactionInvestment = calcInvestment(States, lambda);

  var payoffCursor = PayoffByUserByState.find({userId: user._id, stateId: state._id});
  var payoffId;
  if (payoffCursor.count() === 0)
    payoffId = PayoffByUserByState.insert({userId: user._id, stateId: state._id, payoff: payoff});
  else {
    payoffId = payoffCursor.fetch()[0]._id;
    PayoffByUserByState.update(payoffId, {$inc: {payoff: payoff}});
  }
  console.log(PayoffByUserByState.findOne(payoffId));

  // Update all unit payoff prices
  updateUnitPayoffPrices(States, lambda, unitPayoff);

  // Update the P&L for all users
  Users.find({}).forEach(function (userIt) {
    var payoffArraySortedByState = PayoffByUserByState.find({userId: userIt._id}, {sort: {stateId: 1}}).fetch();
    var cash = Users.findOne(userIt._id).cash;
    if (userIt._id === user._id)
      cash += preTransactionInvestment - postTransactionInvestment;
    var liquidationValue = calcLiquidationValue(payoffArraySortedByState, States, lambda);
    Users.update(userIt._id, {$set: {cash: cash, liquidationValue: liquidationValue, profit: cash + liquidationValue}});
    console.log(Users.findOne(userIt._id));
  });
}

// This function returns the required investment for the entire DPM
var calcInvestment = function (states, lambda) {
  var investment = 0;
  states.find({}).forEach(function (state) {
    investment += Math.pow(state.payoff, lambda);
  });
  investment = Math.pow(investment, 1.0/lambda);
  return investment;
}

// This functions returns the liquidation value for a user's aggregate payoff profile
var calcLiquidationValue = function (payoffArraySortedByState, states, lambda) {
  var investment0 = 0, investment1 = 0;
  var userPayoff;
  var i = 0;
  states.find({}, {sort: {_id: 1}}).forEach(function (state) {
    if (payoffArraySortedByState[i] && payoffArraySortedByState[i].stateId === state._id) {
      userPayoff = payoffArraySortedByState[i].payoff;
      i++;
    }
    else {
      userPayoff = 0;
    }
    investment0 += Math.pow(state.payoff, lambda);
    investment1 += Math.pow(state.payoff - userPayoff, lambda);
  });
  investment0 = Math.pow(investment0, 1.0/lambda);
  investment1 = Math.pow(investment1, 1.0/lambda);
  return (investment0 - investment1);  
}

// This function updates the unit payoff prices for each state
var updateUnitPayoffPrices = function (states, lambda, unitPayoff) {
  var investment0 = calcInvestment(states, lambda);

  var investment1, investment2;
  states.find({}).forEach(function (stateA) {
    investment1 = 0;
    investment2 = 0;
    states.find({}).forEach(function (stateB) {  
      investment1 += Math.pow(stateB.payoff + (stateA._id === stateB._id ? unitPayoff : 0), lambda);
      investment2 += Math.pow(stateB.payoff + (stateA._id === stateB._id ? -unitPayoff : 0), lambda);
    });
    investment1 = Math.pow(investment1, 1.0/lambda);
    investment2 = Math.pow(investment2, 1.0/lambda);
    states.update(stateA._id, {$set: {unitPayoffOffer: investment1 - investment0}});
    states.update(stateA._id, {$set: {unitPayoffBid: -investment2 + investment0}});
  });
}

// This function liquidates a user's position
var liquidate = function (user, states) {
  return ;
}