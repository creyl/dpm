// Set up collections to contain market information. On the server,
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
