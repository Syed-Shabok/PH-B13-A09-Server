const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const JWKS = createRemoteJWKSet(new URL("http://localhost:3000/api/auth/jwks"));

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log("Payload: ", payload);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

async function run() {
  try {
    await client.connect();

    // await client.db("admin").command({ ping: 1 });

    const db = client.db("ideaVault");
    const ideasCollection = db.collection("ideas");
    const commentCollection = db.collection("comments");

    app.get("/ideas", async (req, res) => {
      const ideas = await ideasCollection.find().toArray();
      res.send(ideas);
    });

    app.get("/ideas/user/:email", async (req, res) => {
      const { email } = req.params;
      const ideas = await ideasCollection
        .find({ "author.authorEmail": email })
        .toArray();
      res.send(ideas);
    });

    app.patch("/ideas/:ideaId", async (req, res) => {
      const { ideaId } = req.params;
      const updatedFields = req.body;

      const result = await ideasCollection.updateOne(
        { _id: new ObjectId(ideaId) },
        { $set: updatedFields },
      );

      res.send(result);
    });

    app.delete("/ideas/:ideaId", async (req, res) => {
      const { ideaId } = req.params;

      const result = await ideasCollection.deleteOne({
        _id: new ObjectId(ideaId),
      });
      // comnts delete
      await commentCollection.deleteMany({ ideaId: ideaId });

      res.send(result);
    });

    app.get("/ideas/:ideaId", verifyToken, async (req, res) => {
      const { ideaId } = req.params;
      const idea = await ideasCollection.findOne({
        _id: new ObjectId(ideaId),
      });

      if (!idea) return res.status(404).send({ message: "Not found" });

      res.send(idea);
    });

    app.post("/ideas", async (req, res) => {
      const ideaData = req.body;
      const result = await ideasCollection.insertOne(ideaData);

      res.send(result);
    });

    app.post("/comment", verifyToken, async (req, res) => {
      const commentData = req.body;
      const result = await commentCollection.insertOne(commentData);

      res.json(result);
    });

    app.get("/comment/:ideaId", async (req, res) => {
      const { ideaId } = req.params;
      const result = await commentCollection.find({ ideaId: ideaId }).toArray();

      res.json(result);
    });

    app.get("/comment/user/:userId", async (req, res) => {
      const { userId } = req.params;
      const comments = await commentCollection
        .find({ userId: userId })
        .toArray();
      res.json(comments);
    });

    app.delete("/comment/:commentId", verifyToken, async (req, res) => {
      const { commentId } = req.params;
      const result = await commentCollection.deleteOne({
        _id: new ObjectId(commentId),
      });

      res.json(result);
    });

    app.patch("/comment/:commentId", verifyToken, async (req, res) => {
      const { commentId } = req.params;
      const { text } = req.body;

      const result = await commentCollection.updateOne(
        { _id: new ObjectId(commentId) },
        {
          $set: {
            text: text,
          },
        },
      );

      res.json(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
