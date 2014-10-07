/**
 * Created by creyl on 10/7/14.
 */
// Assumes that the uer is brand new with no existing profile
Accounts.onCreateUser(function (options, user) {
    BalanceByUser.insert({userId: user._id, cash: 0, liquidationValue: 0, profit: 0});
    if (options.profile)
        user.profile = options.profile;
    return user;
});
