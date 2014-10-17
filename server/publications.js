/**
 * Created by creyl on 10/2/14.
 */
Meteor.publish('states', function () {
    return States.find();
});

Meteor.publish('payoffByUserByState', function () {
    return PayoffByUserByState.find();
});

Meteor.publish("userData", function () {
    return Meteor.users.find({}, {fields: {'username': 1}});
});

Meteor.publish("balanceByUser", function () {
    return BalanceByUser.find();
});

Meteor.publish("priceAndOpenInterestHistory", function () {
    return PriceAndOpenInterestHistory.find();
});
