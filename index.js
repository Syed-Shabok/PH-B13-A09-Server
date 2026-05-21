const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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

    app.post("/ideas", async (req, res) => {
      const ideaData = req.body;
      const result = await ideasCollection.insertOne(ideaData);

      res.send(result);
    });

    app.get("/ideas/:ideaId", async (req, res) => {
      const { ideaId } = req.params;
      const idea = await ideasCollection.findOne({ _id: new ObjectId(ideaId) });

      if (!idea) return res.status(404).send({ message: "Not found" });

      res.send(idea);
    });

    app.post("/comment", async (req, res) => {
      const commentData = req.body;
      const result = await commentCollection.insertOne(commentData);

      res.json(result);
    });

    app.get("/comment/:ideaId", async (req, res) => {
      const { ideaId } = req.params;
      const result = await commentCollection.find({ ideaId: ideaId }).toArray();

      res.json(result);
    });

    app.delete("/comment/:commentId", async (req, res) => {
      const { commentId } = req.params;
      const result = await commentCollection.deleteOne({
        _id: new ObjectId(commentId),
      });

      res.json(result);
    });

    app.patch("/comment/:commentId", async (req, res) => {
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
