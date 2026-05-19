// 1. Import the Express framework
const express = require("express");

// 2. Import dotenv to manage environment variables from a .env file
const dotenv = require("dotenv");

// 3. Import CORS (Cross-Origin Resource Sharing) to allow requests from other domains
const cors = require("cors");

// 4. mongodb atlas connection
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Load environment variables from the .env file into process.env
dotenv.config();
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
let coursesCollection;
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    const db = client.db("mentoraDB");
    coursesCollection = db.collection("courses");
    app.get("/courses", async (req, res) => {
      const cursor = coursesCollection.find();
      const result = await cursor.toArray();
      console.log("result: ", result.length);
      res.send(result);
    });
    app.get("/courses/:courseID", async (req, res) => {
      // const courseID =req.params.courseID;
      const { courseID } = req.params;
      // console.log("CourseID: ", courseID);
      const query = { _id: new ObjectId(courseID) };
      const result = await coursesCollection.findOne(query);
      res.send(result);
    });
    app.get("/featured", async (req, res) => {
      const cursor = coursesCollection.find().limit(4);
      const result = await cursor.toArray();
      res.send(result);
    });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// 5. Initialize the Express application instance
const app = express();

// 6. Enable CORS middleware so your frontend (e.g., Next.js/React) can communicate with this server
app.use(cors());

// 7. Define the server port. Use the environment variable if available, otherwise default to 3001
const port = process.env.PORT || 3001;

// 8. Create a basic GET route for the root URL ("/") that responds with "Hello World!"
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// 9. Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
