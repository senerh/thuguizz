const express = require('express');                     //Web structure (routes)
const bodyParser= require('body-parser');               //Needed for POST methods
const crypto = require('crypto');                       //Needed for md5 answer encrypt
const MongoClient = require('mongodb').MongoClient;     //Needed for Mongo database

const app = express();                                  //Launch app
app.use(bodyParser.urlencoded({extended: true}))        //Allow POST

//Global vars
var db;           //Database
var number = 1;   //Current question number
var score = 0;    //Final score
var pseudo = "";  //Player name saved
var list = null;  //List of shuffled questions


/**
 * Connection to database
 * Use 'mongodb://localhost:27017/thuguizbd' for dev
 * Use '//mongodb://userepul:epul@172.31.7.31:27017/' for prod
 */
MongoClient.connect('mongodb://localhost:27017/thuguizbd', (err, database) => {
  if (err) return console.log(err)
  db = database
})

app.set('view engine', 'ejs');              //Use EJS to have layout
app.set('views', __dirname + '/views');     //Give path to EJS views


/**
 * Shuffle attribut in array
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
    return a;
}

/**
 * Index : Display best scores
 */
app.get('/', (req, res) => {
  db.collection('players').find().sort('score', 'desc').toArray((err, r_players) => {
    if (err) return console.log(err);

    number = 1;
    score = 0;
    list = null;

    res.render('pages/index', {players: r_players})
  })
})

/**
 * Game : Display game page
 */
app.post('/game', (req, res) => {

  db.collection('players').find().sort('score', 'desc').toArray((err, r_players) => {
    if (err) return console.log(err);

    if(list == null) {
      number = 1;
      score = 0;
      db.collection('questions').find().toArray((err, r_questions) => {
        if (err) return console.log(err);

        list = shuffle(r_questions);

        renderGame(res, r_players);
      })
    } else {

      if(req.body.uid == crypto.createHash('md5').update(req.body.answer+req.body.answer).digest("hex")) {
        number++;
      } else {
        res.redirect('/gameover');
      }

      renderGame(res, r_players);
    }
  })
})

/**
 * Send new question to game page
 */
function renderGame(res, r_players) {

    //Get current question and current answer
    var question = list[number-1];
    var uid = crypto.createHash('md5').update(question.reponse1+question.reponse1).digest("hex");

    //Shuffle answers
    var array = [ question.reponse1, question.reponse2, question.reponse3 ];
    array = shuffle(array);
    question.reponse1 = array[0];
    question.reponse2 = array[1];
    question.reponse3 = array[2];

    res.render('pages/game', {
      players: r_players,
      question: question,
      uid: uid,
      number : number
    })
}


/**
 * Game over : Display final score
 */
app.get('/gameover', (req, res) => {

  list = null;
  score = number;
  number = 1;

  db.collection('players').find().sort('score', 'desc').toArray((err, r_players) => {
    if (err) return console.log(err);

    res.render('pages/gameover', {
      number: score,
      pseudo: pseudo,
      players: r_players
    })
  })
})


/**
 * Retry : Save game and redirect to new game
 */
app.post('/retry', (req, res) => {

  pseudo = req.body.pseudo;
  if(pseudo == "") pseudo = "Guest";

  var player = { pseudo : pseudo, score : score }
  
  db.collection('players').save(player, (err, result) => {
    if (err) return console.log(err)
    console.log(player)
    res.redirect(307, '/game');    //Redirect 307 for POST
  })
})

app.get('/deleteScores', (req, res) => {
  db.collection('players').remove();
})

/**
 * Server is listening on port 3000
 */
app.listen(3000, function() {
  console.log('listening on 3000');
})