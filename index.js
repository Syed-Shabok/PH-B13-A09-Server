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

    app.get("/ideas", async (req, res) => {
      const ideas = await ideasCollection.find().toArray();
      res.send(ideas);
    });

    app.get("/ideas/:ideaId", async (req, res) => {
      const { ideaId } = req.params;
      const idea = await ideasCollection.findOne({ _id: new ObjectId(ideaId) });
      res.send(idea);
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
