const express = require('express');
var cors = require('cors');
const bodyParser = require("body-parser");
const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
var nodemailer = require('nodemailer');

// Express ant third parties
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

// Passwords (bcrypt and jwt)
const saltRounds = 10;

// Firebase
const serviceAccount = require('./service_account.json');
initializeApp({credential: cert(serviceAccount)});
const db = getFirestore();
const usersRef = db.collection('users');
const robotsRef = db.collection('robots');
const reservationsRef = db.collection('reservations');

// Node mailer
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "angus.paillaugue40@gmail.com",
      pass: process.env.EMAIL_PASSWORD
    }
});  


// Client routes
app.get('/', (req, res) => {res.sendFile("public/index.html", {root: "../"});});
app.get('/login', (req, res) => {res.sendFile("public/login.html", {root: "../"})});
app.get('/dashboard', (req, res) => {res.sendFile("public/dashboard.html", {root: "../"});});
app.get('/book', (req, res) => {res.sendFile("public/book.html", {root: "../"});});
app.get('/bookings', (req, res) => {res.sendFile("public/bookings.html", {root: "../"});});
app.get("/navbar", async(req, res) => {res.sendFile("public/src/navbar.html", {root: "../"})});
app.get("/admin-dashboard", async(req, res) => {res.sendFile("public/admin/adminDashboard.html", {root: "../"})});
app.get("/manage-users", async(req, res) => {res.sendFile("public/admin/manageUsers.html", {root: "../"})});
app.get("/reset-password/:id", async(req, res) => {res.sendFile("public/resetPassword.html", {root: "../"})});
app.get("/create-password/:id", async(req, res) => {res.sendFile("public/createPassword.html", {root: "../"})});

app.post("/login", async(req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const users = await usersRef.where('username', '==', username).get();
    if (!users.empty){
        users.forEach(doc => {
            let user = doc.data();
            bcrypt.compare(password, user.password, function(err, compare) {
                if(compare){
                    res.send({status:200, data: generateAccessToken(username)});
                }else{
                    res.send({status:400, data: "Incorrect credentials"});
                }
            });
        });
    }else{
        res.send({status:400, data:"User with this username doesn't exists!"});
    }
});
app.post("/auth", (req, res) => {
    const token = req.body.token;
    if (token == null) return res.send({status:200, data:"Error"})
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, username) => {
        if (err) return res.send({status:400, data:"Invalid token"});
        const users = await usersRef.where('username', '==', username).get();
        users.forEach(doc => {res.send({status:200, data:{id:doc.id, username:doc.data().username, isAdmin:doc.data().isAdmin}})});
    });
});

app.get("/availableRobots", async(req, res) => {
    let robots = await robotsRef.get();
    robots = robots.docs.map(doc => {return {id:doc.id, data:doc.data()}});
    res.send({status:200, data:robots});
}); 

app.get("/bookings/:id", async(req, res) => {
    const robotId = req.params.id;
    let send = [];
    let robots = await reservationsRef.where("robot", "==", `${robotId}`).get();
    robots.forEach(reservation => {send.push(reservation.data());});
    res.send({status:200, data:send});
}); 

app.get("/myBookings", async(req, res) => {
    const token = req.query.token;
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, username) => {
        if (err) return res.send({status:400, data:"Invalid token"});
        const users = await usersRef.where('username', '==', username).get();
        users.forEach(async (doc) => {
            const bookings = await reservationsRef.where('userId', '==', doc.id).get();
            let send = [];
            bookings.forEach(async (doc) => {
                delete doc.data().code;
                send.push({id:doc.id, data:doc.data()});
            });
            res.send({status:200, data:send});
        });
    });
}); 

app.post("/book", async(req, res) => {
    const token = req.body.token;
    const robot = req.body.robot;
    const date = req.body.date;
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, username) => {
        if (err) return res.send({status:400, data:"Invalid token"});
        const users = await usersRef.where('username', '==', username).get();
        users.forEach(async (doc) => {
            const code = Math.floor(1000 + (9999 - 1000) * Math.random());
            await reservationsRef.add({userId:doc.id, robot:robot, date:date, code:code});
            res.send({status:200, data:"Ok"});
        });
    });
});

app.get("/robotInfo/:id", async(req, res) => {
    try {
        const id = req.params.id;
        const robot = await robotsRef.doc(`${id}`).get();
        res.send({status:200, data:{robot:id, shedNo:robot.data().shedNo, name:robot.data().name}});
    } catch (err) {
        res.send({status:400, data:err});
    }
}); 

app.post("/deleteBooking", (req, res) => {
    const token = req.body.token;
    const id = req.body.id;
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, username) => {
        if (err) return res.send({status:400, data:"Invalid token"});
        await reservationsRef.doc(`${id}`).delete();
        res.send({status:"200", data:"OK"});
    });
})

app.get("/shedCode/:reservationId", async(req, res) => {
    try {
        const reservationId = req.params.reservationId;
        const token = req.query.token;
        jwt.verify(token, process.env.TOKEN_SECRET, async (err, username) => {
            if (err) return res.send({status:400, data:"Invalid token"});
            const booking = await reservationsRef.doc(`${reservationId}`).get();
            res.send({status:200, data:booking.data().code})
        });
    } catch (err) {
        res.send({status:400, data:err});
    }
}); 

app.post("/checkCode", async(req, res) => {
    try {
        const shedNo = req.body.shedNo;
        const code = req.body.code;
        if(!code || code > 9999) res.status(400).send("Please provide a code"); else{
            const robot = await robotsRef.where("shedNo", "==", shedNo).get();
            const bookings = await reservationsRef.where("robot", "==", `${robot.docs[0].id}`).get();
            bookings.forEach(doc => {
                if(new Date(doc.data().date).toLocaleDateString() == new Date().toLocaleDateString()){
                    if(doc.data().code == code) res.status(200).send("Code OK"); else res.status(400).send("Code not OK");
                }
            });
        }
    } catch (err) {
        res.send({status:400, data:err});
    }
});

app.get("/allUsers", async(req, res) => {
    try {
        const token = req.query.token;
        jwt.verify(token, process.env.TOKEN_SECRET, async (err, username) => {
            if (err) return res.send({status:400, data:"Invalid token"});
            const user = await usersRef.where("username", "==", `${username}`).get();
            if(user.docs[0].data().isAdmin){
                const allUsers = await usersRef.get();
                let send = [];
                allUsers.forEach(user => {
                    if(user.id !== "Do not delete") send.push({id:user.id, username: user.data().username, isAdmin:user.data().isAdmin});
                })
                res.send({status:200, data:send})
            }else{
                res.send({status:400, data:"Auth error"});
            }
        });
    } catch (err) {
        res.send({status:400, data:err});
    }
}); 

app.post("/changeAdminRights", async(req, res) => {
    try {
        const token = req.body.token;
        const id = req.body.id;
        const value = req.body.value == "true" ? true : false;
        jwt.verify(token, process.env.TOKEN_SECRET, async (err, username) => {
            if (err) return res.send({status:400, data:"Invalid token"});
            const user = await usersRef.where("username", "==", `${username}`).get();
            if(user.docs[0].data().isAdmin){
                usersRef.doc(`${id}`).update({isAdmin:value});
                res.send({status:200, data:"Done!"});
            }else{
                res.send({status:400, data:"Auth error"});
            }
        });
    } catch (err) {
        res.send({status:400, data:err});
    }
});

app.post("/resetPassword", async(req, res) => {
    try {
        const token = req.body.token;
        const id = req.body.id;
        jwt.verify(token, process.env.TOKEN_SECRET, async (err, username) => {
            if (err) return res.send({status:400, data:"Invalid token"});
            const user = await usersRef.where("username", "==", `${username}`).get();
            if(user.docs[0].data().isAdmin){
                const userToReset = await usersRef.doc(`${id}`).get();
                var mailOptions = {
                    from: process.env.email,
                    to: userToReset.data().email,
                    subject: 'Reset your password',
                    text: `You'll find below the link to reset your password. This link is only available for 5 minutes. http://localhost:8000/reset-password/${userToReset.id}`
                };
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) res.send({status:400, data:"Mail error"}); else res.send({status:200, data:"Mail sent"});
                });
            }else{
                res.send({status:400, data:"Auth error"});
            }
        });
    } catch (err) {
        res.send({status:400, data:err});
    }
});

app.post("/newPassword", async(req, res) => {
    try {
        const id = req.body.id;
        const password = req.body.password;
        bcrypt.genSalt(saltRounds, (err, salt) => {
            bcrypt.hash(password, salt, async(err, hash) => {
                usersRef.doc(`${id}`).update({password:hash});
                let user = usersRef.doc(`${id}`).get()
                res.send({status:200, data:generateAccessToken((await user).data().username)});
            });
        });
    } catch (err) {
        res.send({status:400, data:err});
    }
});

app.post("/deleteUser", async(req, res) => {
    try {
        const token = req.body.token;
        const id = req.body.id;
        jwt.verify(token, process.env.TOKEN_SECRET, async (err, username) => {
            if (err) return res.send({status:400, data:"Invalid token"});
            const user = await usersRef.where("username", "==", `${username}`).get();
            if(user.docs[0].data().isAdmin){
                await usersRef.doc(`${id}`).delete();
                res.send({status:200, data:"Done"});
            }else{
                res.send({status:400, data:"Auth error"});
            }
        });
    } catch (err) {
        res.send({status:400, data:err});
    }
});

app.post("/createUser", async(req, res) => {
    try {
        const token = req.body.token;
        const createdUserUsername = req.body.username;
        const email = req.body.email;
        jwt.verify(token, process.env.TOKEN_SECRET, async (err, username) => {
            if (err) return res.send({status:400, data:"Invalid token"});
            const user = await usersRef.where("username", "==", `${username}`).get();
            if(user.docs[0].data().isAdmin){
                let check1 = await usersRef.where("username", "==", `${createdUserUsername}`).get();
                let check2 = await usersRef.where("email", "==", `${email}`).get();
                if(check1.docs.length == 0 && check2.docs.length == 0){
                    let createdUser = await usersRef.add({username:createdUserUsername, email:email, password:null, isAdmin:false});
                    var mailOptions = {
                        from: process.env.email,
                        to: email,
                        subject: 'Account created',
                        text: `You'll find below the link to create your password. http://localhost:8000/create-password/${createdUser.id}`
                    };
                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) res.send({status:400, data:"Mail error"}); else res.send({status:200, data:"Mail sent"});
                    });
                }
            }else{
                res.send({status:400, data:"Auth error"});
            }
        });
    } catch (err) {
        res.send({status:400, data:err});
    }
});

setInterval(checkBookingsDates, 10000);
async function checkBookingsDates(){
    let bookings = await reservationsRef.where("robot", "!=", "null").get();
    bookings.forEach(async(doc) => {
        if(new Date(doc.data().date).toLocaleDateString() < new Date().toLocaleDateString()){
            await reservationsRef.doc(`${doc.id}`).delete();
        }
    });
}


function generateAccessToken(username) {return jwt.sign(username, process.env.TOKEN_SECRET);}

app.listen(8000 || process.env.PORT, () => {
    console.log(`Listening on http://localhost:${8000 || process.env.PORT}`);
});