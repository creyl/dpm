/**
 * Created by creyl on 10/2/14.
 */
Meteor.publish('states', function () {
    return States.find();
});

Meteor.publish('payoffByUserByState', function () {
    return PayoffByUserByState.find();
});

Meteor.publish('transactions', function () {
    return Transactions.find();
});

Meteor.publish("userData", function () {
    return Meteor.users.find({},
        {fields: {'username': 1, 'cash': 1, 'liquidationValue': 1, 'profit': 1}});
});
