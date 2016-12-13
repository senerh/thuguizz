const express = require('express');                     //Web structure (routes)
const bodyParser= require('body-parser');               //Needed for POST methods
const crypto = require('crypto');                       //Needed for md5 answer encrypt
const MongoClient = require('mongodb').MongoClient;     //Needed for Mongo database
const https = require('https');                         //Needed for https
const fs = require('fs');                               //Needed for read file

const app = express();                                  //Launch app
app.use(bodyParser.urlencoded({extended: true}))        //Allow POST
app.set('view engine', 'ejs');                          //Use EJS to have layout
app.set('views', __dirname + '/views');                 //Give path to EJS views

//Global vars
var db;           //Database
var number = 1;   //Current question number
var score = 0;    //Final score
var pseudo = "";  //Player name saved
var list = null;  //List of shuffled questions

/**
 * Connection to database
 * Use 'mongodb://localhost:27017/thuguizbd' for dev
 * Use '//mongodb://172.31.7.31:27017/thuguizbd' for prod
 */
function connect() {
  MongoClient.connect('mongodb://localhost:27017/thuguizbd', (err, database) => {
    if (err) {
      res.render('pages/error', {err: err});
      return;
    }
    db = database
  })
}

/**
 * Shuffle attribut in array
 */
function shuffle(a) {
    var j, x, i;
    if(a == null) return a;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
    return a;
}

connect();

/**
 * Index : Display best scores
 */
app.get('/', (req, res) => {

  db.collection('players').find().sort('score', 'desc').limit(10).toArray((err, r_players) => {
    if (err) {
      res.render('pages/error', {err: err});
      return;
    }

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

  db.collection('players').find().sort('score', 'desc').limit(10).toArray((err, r_players) => {
    if (err) {
      res.render('pages/error', {err: err});
      return;
    }

    //Lancement du jeu
    if(list == null) {
      number = 1;
      score = 0;
      db.collection('questions').find().toArray((err, r_questions) => {
        if (err) {
          res.render('pages/error', {err: err});
          return;
        }

        list = shuffle(r_questions);
        if(number >= list.length) {
          res.render('pages/error', {err: "L'application ne contient pas de question."});
          return;
        }
        renderGame(res, r_players);
      })
    } //Nouvelle question
    else {

      if(req.body.uid == crypto.createHash('md5').update(req.body.answer+req.body.answer).digest("hex")) {
        number++;
      } else {
        res.redirect('/gameover');
      }

      if(number >= list.length) {
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
    if(question != null) {
      var uid = crypto.createHash('md5').update(question.reponse1+question.reponse1).digest("hex");

      //Shuffle answers
      var array = [ question.reponse1, question.reponse2, question.reponse3 ];
      array = shuffle(array);
      question.reponse1 = array[0];
      question.reponse2 = array[1];
      question.reponse3 = array[2];

    } else {
      res.render('pages/error', {err: "Une erreur est survenue"});
      return;
    }

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

  db.collection('players').find().sort('score', 'desc').limit(10).toArray((err, r_players) => {
    if (err) {
      res.render('pages/error', {err: err});
      return;
    }

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
    if (err) {
      res.render('pages/error', {err: err});
      return;
    }
    res.redirect(307, '/game');    //Redirect 307 for POST
  })
})

/**
 ************** TEMP ****************
 */
app.get('/deleteScores', (req, res) => {
  db.collection('players').remove();
  db.collection('players');
})
/**
 ************** TEMP ****************
 */
app.get('/deleteQuestions', (req, res) => {
  db.collection('questions').remove();
  db.collection('questions');
})

/**
 * Server is listening on port 3000
 */
https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, app).listen(3000);
