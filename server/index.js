const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Filter = require('bad-words');
const rateLimit = require("express-rate-limit");
require('dotenv').config();

const app = express();
const filter = new Filter();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'Meower!'
    })
});

//* Connect To DB

mongoose.connect(
    process.env.MONGO_URI,
    { useNewUrlParser: true },
    () => console.log('Connected to DB!')
);

const mewsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

var mews = mongoose.model('Mews', mewsSchema);


function isValidMew(mew) {
    return mew.name && mew.name.toString().trim() !== '' &&
        mew.content && mew.content.toString().trim() !== '';
}

app.get('/mews', (req, res) => {
    mews
        .find()
        .then(mews => {
            res.json(mews);
        })
});


app.use(rateLimit({
    windowMs: 30 * 1000, // 15 minutes
    max: 1 // limit each IP to 100 requests per windowMs
}));

app.post('/mews', (req, res) => {
    if (isValidMew(req.body)) {
        var mew = new mews({
            _id: new mongoose.Types.ObjectId(),
            name: filter.clean(req.body.name.toString()),
            content: filter.clean(req.body.content.toString()),
            created: new Date()
        });
        mew.save(function (err) {
            if (err) throw err;

            res.json(mew);
            console.log('Mew successfully saved.');
        });
    } else {
        res.status(422);
        res.json({
            message: 'Hey! Name and Content are required!'
        });
    }
});

app.listen(5000, () => {
    console.log('Listening on http://localhost:5000');
});