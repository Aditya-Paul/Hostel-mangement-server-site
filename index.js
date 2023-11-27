const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const port = process.env.PORT || 3000;

//middlewire
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.exrbbd1.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        //database collection

        const database = client.db("Hmanagement");
        const usercollection = database.collection("user");
        const mealcollection = database.collection("meals");
        const requestcollection = database.collection("requestmeals");
        const upcommingcollection = database.collection("upcomings");
        const reviewcollection = database.collection("reviews");

        // user related
        app.post('/users', async (req, res) => {
            const user = req.body
            console.log(user)
            const query = { email: user.email }
            const existuser = await usercollection.findOne(query)
            if (existuser) {
                return res.send({ message: 'user already exist', insertedId: null })
            }
            const result = await usercollection.insertOne(user)
            res.send(result)
        })

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email };
            const result = await usercollection.findOne(query)
            console.log(result)
            res.send(result)
        })

        app.patch('/users/:email', async (req, res) => {
            const user = req.body
            console.log(user)
            const email = req.params.email
            console.log(email)
            const filter = { email: email }
            console.log(filter)
            const updateDoc = {
                $set: {
                    bagde: user.badge,
                },
            };
            const result = await usercollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        // meal realated 
        // app.get('/meals', async (req, res) => {
        //     const result = await mealcollection.find().toArray()
        //     res.send(result)
        // })

        // Meal related api + filter by title
        app.get('/meals', async (req, res) => {
            let query = {}
            const category = req.query.category
            const title = req.query.title
            if (category) {
                query.category = category
            }
            if (title) {
                query.title = title
            }
            const result = await mealcollection.find(query).toArray()
            res.send(result)
        })

        app.post('/meals', async (req, res) => {
            const user = req.body
            const result = await mealcollection.insertOne(user)
            res.send(result)
        })

        app.get('/meals/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await mealcollection.findOne(query)
            res.send(result)
        })

        // upcoming meals collection
        app.post('/upcomings', async (req, res) => {
            const user = req.body
            const result = await upcommingcollection.insertOne(user)
            res.send(result)
        })
        app.get('/upcomings', async (req, res) => {
            const result = await upcommingcollection.find().toArray()
            res.send(result)
        })
        app.get('/upcomings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await upcommingcollection.findOne(query)
            res.send(result)
        })
        app.patch('/upcomings/:id', async (req, res) => {
            const item = req.body
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    likes: item.likes,
                },
            };
            const result = await upcommingcollection.updateOne(filter, updateDoc)
            console.log('upco',result)
            res.send(result)
        })

        //update like count
        app.patch('/meals/:id', async (req, res) => {
            const item = req.body
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    likes: item.likes,
                    reviews: item.reviews
                },
            };
            const result = await mealcollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        // request meal api
        app.patch('/reqmeals/:id', async (req, res) => {
            const item = req.body
            const id = req.params.id;
            const filter = { item_id : id}
            const updateDoc = {
                $set: {
                    item_likes: item.likes,
                },
            };
            const result = await requestcollection.updateMany(filter, updateDoc)
            res.send(result)
        })

        app.post('/reqmeals', async (req, res) => {
            const user = req.body
            const result = await requestcollection.insertOne(user)
            res.send(result)
        })
        app.get('/reqmeals', async (req, res) => {
            const result = await requestcollection.find().toArray()
            res.send(result)
        })
        app.get('/reqmeals/:email', async (req, res) => {
            const email = req.params.email
            const query = { request_usermail: email };
            const result = await requestcollection.find(query).toArray()
            console.log(result)
            res.send(result)
        })

        //review related api
        app.post('/reviews', async (req, res) => {
            const user = req.body
            const result = await reviewcollection.insertOne(user)
            res.send(result)
        })
        app.get('/reviews', async (req, res) => {
            const result = await reviewcollection.find().toArray()
            res.send(result)
        })

        app.get('/reviews/:meal_id', async (req, res) => {
            const id = req.params.meal_id
            console.log(id)
            const query = { meal_id: id };
            console.log(query)
            const result = await reviewcollection.find(query).toArray()
            res.send(result)    
            console.log(result)
        })

        //payment intent
        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            const amount = price * 100

            // const amount = parseInt(price * 100)
            console.log(amount, "inside the intent")
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: [
                    "card"
                ],
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hmanagment running')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})