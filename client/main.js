/**
 * Created by creyl on 10/10/14.
 */
// TODO: Throw errors
// TODO: Make sure that liquidate triggers chart refresh
// TODO: Implement test suite
// TODO: Link to invite your friends

Meteor.subscribe('states');
Meteor.subscribe('payoffByUserByState');
Meteor.subscribe('userData');
Meteor.subscribe('balanceByUser');
Meteor.subscribe('priceAndOpenInterestHistory');
