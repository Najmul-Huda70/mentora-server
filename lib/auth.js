const { mongodbAdapter } = require("@better-auth/mongo-adapter");
const { betterAuth } = require("better-auth");
const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI || "http://localhost:3001";
const client = new MongoClient(uri);
console.log("server-uri: ", uri);
const db = client.db("mentoraDB");
const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET,
});

module.exports = { auth };
