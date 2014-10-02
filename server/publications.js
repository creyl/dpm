/**
 * Created by creyl on 10/2/14.
 */
Meteor.publish('states', function () {
    return States.find();
});

Meteor.publish('users', function () {
    return Users.find();
});

// TODO: Remove this with proper user management
Users.allow({
    insert: function () {
        return true;
    },
    update: function () {
        return true;
    }
});

Meteor.publish('payoffByUserByState', function () {
    return PayoffByUserByState.find();
});

Meteor.publish('transactions', function () {
    return Transactions.find();
});
