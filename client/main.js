/**
 * Created by creyl on 10/10/14.
 */
// TODO: Don't allow for overall and individual negative open interest
// TODO: Limit virtual cash to -10
// TODO: Show chart of price and open interest with limit to first 100 transactions
// TODO: Make sure that liquidate triggers chart refresh
// TODO: Link to invite your friends

Meteor.subscribe('states');
Meteor.subscribe('payoffByUserByState');
Meteor.subscribe('userData');
Meteor.subscribe('balanceByUser');
Meteor.subscribe('priceAndOpenInterestHistory');
