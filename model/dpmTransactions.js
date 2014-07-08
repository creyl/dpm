/**
 * This function should be the only way to add to the Transactions collection
 * in order to guarantee that the States and Users info remains in-sync.
 * Must be global.
 *
 * @param {number} userId
 * @param {number} stateId
 * @param {number} payoff - A positive or negative number
 */
addTransaction = function (user, state, payoff) {
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
// Must be global
liquidate = function (user, states) {
  PayoffByUserByState.find({userId: user._id}).forEach(function (pbubs) {
    addTransaction(pbubs.userId, pbubs.stateId, -pbubs.payoff);
  }
                                                      );
}
