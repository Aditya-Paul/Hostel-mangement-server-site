const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
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

        //jwt pai
        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            console.log('token', token)
            res.send({ token })
        })
        const verifyToken = async (req, res, next) => {
            console.log("verification token", req.headers.authorization)
            if (!req.headers.authorization) {
                console.log('djhdhf')
                return res.status(401).send({ message: 'forbideen access' })
            }
            const token = req.headers.authorization.split(' ')[1]
            //console.log(token)
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    console.log('no')
                    return res.status(401).send({ message: 'forbideen access' })
                }
                req.decoded = decoded;
                console.log('yes')
                next()
            })
        }

        // user related
        app.post('/users', async (req, res) => {
            const user = req.body
            //console.log(user)
            const query = { email: user.email }
            const existuser = await usercollection.findOne(query)
            if (existuser) {
                return res.send({ message: 'user already exist', insertedId: null })
            }
            const result = await usercollection.insertOne(user)
            res.send(result)
        })

        app.get('/users', async (req, res) => {
            const result = await usercollection.find().toArray()
            res.send(result)
        })

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email };
            const result = await usercollection.findOne(query)
            res.send(result)
        })

        app.patch('/users/:email', async (req, res) => {
            const user = req.body
            const email = req.params.email
            const filter = { email: email }
            const updateDoc = {
                $set: {
                    bagde: user.badge,
                },
            };
            const result = await usercollection.updateOne(filter, updateDoc)
            res.send(result)
        })
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await usercollection.findOne(query)
            let admin = false;

            if (result) {
                admin = result?.role === 'admin'
            }
            console.log("check admin", admin)
            res.send({ admin })
        })
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: `admin`
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

        app.patch('/meals/:id', async (req, res) => {
            const item = req.body
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    reviews: item.reviews,
                },
            };
            const result = await mealcollection.updateOne(filter, updateDoc)
            res.send(result)
        })
        app.delete('/meals/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await mealcollection.deleteOne(query)
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
            res.send(result)
        })
        app.delete('/upcomings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await upcommingcollection.deleteOne(query)
            res.send(result)
        })

        //update like count
        //after click on the like, like count of mealconnection will increase
        app.patch('/likesmeals/:id', async (req, res) => {
            const item = req.body
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    likes: item.likes,
                },
            };
            const result = await mealcollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        //after click on the review, review count of mealconnection will increase
        app.patch('/reviewmeals/:id', async (req, res) => {
            const item = req.body
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    reviews: item.reviews
                },
            };
            const result = await mealcollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        //after click on the like, like count of reviewcollection will increase
        app.patch('/likesreview/:id', async (req, res) => {
            const item = req.body
            const id = req.params.id;
            const filter = { meal_id: id }
            const updateDoc = {
                $set: {
                    meal_likes: item.likes,
                },
            };

            const result = await reviewcollection.updateMany(filter, updateDoc)
            res.send(result)
        })

        // request meal api
        //after click on the like, like count of requestcollection will increase
        app.patch('/reqmeals/:id', async (req, res) => {
            const item = req.body
            const id = req.params.id;
            const filter = { item_id: id }
            const updateDoc = {
                $set: {
                    item_likes: item.likes,
                },
            };
            const result = await requestcollection.updateMany(filter, updateDoc)
            res.send(result)
        })
        // for change status pending to delivered
        app.patch('/change/remeals/:id',verifyToken, async (req, res) => {
            const item = req.body
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: item.status,
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
            const query = { meal_id: id };
            const result = await reviewcollection.find(query).toArray()
            res.send(result)
        })

        app.delete('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await reviewcollection.deleteOne(query)
            res.send(result)
        })
        app.delete('/admin/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await reviewcollection.deleteOne(query)
            res.send(result)
        })

        //payment intent
        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            const amount = price * 100
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