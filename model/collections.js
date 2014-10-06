// Set up collections to contain market information. On the server,
// it is backed by MongoDB collections.

// States -- {name: String,
//           payoff: Number,
//           unitPayoffBid: Number,
//           unitPayoffOffer: Number}
States = new Meteor.Collection("states");

// PayoffByUserByState -- {userId: String,
//                         stateId: String,
//                         payoff: Number}
PayoffByUserByState = new Meteor.Collection("payoffByUserByState");

// Transactions -- {timeStamp: String, 
//                 userId: String,
//                 stateId: String,
//                 payoff: Number}
Transactions = new Meteor.Collection("transactions");
