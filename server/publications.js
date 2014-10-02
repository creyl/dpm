/**
 * Created by creyl on 10/2/14.
 */
Meteor.publish('states', function () {
    return States.find();
});

Meteor.publish('users', function () {
    return Users.find();
});

Meteor.publish('payoffByUserByState', function () {
    return PayoffByUserByState.find();
});

Meteor.publish('Transactions', function () {
    return Transactions.find();
});
