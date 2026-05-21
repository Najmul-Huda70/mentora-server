// 1. Import the Express framework
const express = require("express");

// 2. Import dotenv to manage environment variables from a .env file
const dotenv = require("dotenv");

// 3. Import CORS (Cross-Origin Resource Sharing) to allow requests from other domains
const cors = require("cors");
// 4. mongodb atlas connection
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

// Load environment variables from the .env file into process.env
dotenv.config();
// 5. Initialize the Express application instance
const app = express();

// 6. Enable CORS middleware so your frontend (e.g., Next.js/React) can communicate with this server
app.use(cors());
app.use(express.json());
// 7. Define the server port. Use the environment variable if available, otherwise default to 3001
const port = process.env.PORT || 3001;
const uri = process.env.MONGO_URI || "http://localhost:3001";
const JWKS = `${process.env.CLIENT_URL}/api/auth/jwks`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const logger = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};
const verifyToken = async (req, res, next) => {
  const { authorization } = req.headers;

  // হেডার বা টোকেন না থাকলে মাঝপথেই আটকে দাও
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized! Token missing." });
  }
  const token = authorization.split(" ")[1];
  // console.log("authorization token: ", token);
  // console.log(req.headers, "from verify token");
  if (!token) {
    return res.status(401).json({ message: "Unauthorize" });
  }
  try {
    const jwks = createRemoteJWKSet(new URL(JWKS));
    const { payload } = await jwtVerify(token, jwks);
    req.user = payload;
    console.log(req.user);
  } catch (error) {
    console.error("Token validation failed:", error);
    return res.status(401).json({ message: "Unauthorize" });
  }
  next();
};
let coursesCollection;
let enrollmentCollection;
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    const db = client.db("mentoraDB");
    coursesCollection = db.collection("courses");
    enrollmentCollection = db.collection("enrollment");

    app.get("/courses", async (req, res) => {
      try {
        const { search } = req.query;
        let query = {};
        if (search) {
          query = {
            title: {
              $regex: search,
              $options: "i",
            },
          };
        }

        const cursor = coursesCollection.find({
          $or: {
            title: {
              $regex: search,
              $options: "i",
            },
            instructor: {
              $regex: search,
              $options: "i",
            },
            title: {
              $regex: search,
              $options: "i",
            },
            title: {
              $regex: search,
              $options: "i",
            },
            title: {
              $regex: search,
              $options: "i",
            },
          },
        });
        const result = await cursor.toArray();

        console.log("Found courses count: ", result.length);
        res.send(result);
      } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });
    app.get("/courses/:courseId", logger, verifyToken, async (req, res) => {
      // const courseId =req.params.courseId;
      const { courseId } = req.params;
      // console.log("courseId: ", courseId);
      const query = { _id: new ObjectId(courseId) };
      const result = await coursesCollection.findOne(query);
      res.send(result);
    });
    app.get("/featured", async (req, res) => {
      const cursor = coursesCollection.find().limit(4);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/enrollment/:userId", verifyToken, async (req, res) => {
      const { userId } = req.params;
      const result = await enrollmentCollection
        .find({ userId: userId })
        .toArray();
      res.send(result);
    });

    app.patch("/enrollment/:courseId", verifyToken, async (req, res) => {
      const { courseId } = req.params;
      const enrollmentData = req.body;
      const course = await coursesCollection.findOne({
        _id: new ObjectId(courseId),
      });
      if (!course) {
        res.status(404).json({ message: "Course not found!" });
      }
      await coursesCollection.updateOne(
        { _id: new ObjectId(courseId) },
        {
          $inc: { enrollCount: 1 },
          $set: { lastEnrolledAt: new Date() },
        },
      );
      const result = await enrollmentCollection.insertOne({
        ...enrollmentData,
        enrolledAt: new Date(),
      });
      res.send(result);
    });
    app.delete("/enrollment/:id", verifyToken, async (req, res) => {
      const { id } = req.params;

      try {
        const enrollment = await enrollmentCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!enrollment) {
          return res
            .status(404)
            .send({ success: false, message: "Enrollment not found." });
        }

        const deleteResult = await enrollmentCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (deleteResult.deletedCount === 1) {
          const courseIdToUpdate = enrollment.courseId;

          if (courseIdToUpdate) {
            let updateResult = await coursesCollection.updateOne(
              { _id: courseIdToUpdate },
              { $inc: { enrollCount: -1 } },
            );

            if (updateResult.modifiedCount === 0) {
              try {
                await coursesCollection.updateOne(
                  { _id: new ObjectId(courseIdToUpdate) },
                  { $inc: { enrollCount: -1 } },
                );
              } catch (err) {
                console.error("ObjectId casting failed:", err);
              }
            }
          }

          res.send({
            success: true,
            message: "Enrollment successfully cancelled and count updated!",
          });
        } else {
          res
            .status(404)
            .send({ success: false, message: "Failed to delete enrollment." });
        }
      } catch (error) {
        console.error("Delete error:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });
    app.get("/reset-count", async (req, res) => {
      await coursesCollection.updateMany({}, { $set: { enrollCount: 0 } });
      res.send("All course enrollment counts reset to 0!");
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

// 8. Create a basic GET route for the root URL ("/") that responds with "Hello World!"
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// 9. Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
