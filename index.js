const express = require('express');
const bodyParser= require('body-parser');
const crypto = require('crypto');
const MongoClient = require('mongodb').MongoClient;

const app = express();
app.use(bodyParser.urlencoded({extended: true}))
//mongodb://userepul:epul@172.31.7.31:27017/
var db;

var number = 1;
var pseudo = "";

MongoClient.connect('mongodb://localhost:27017/thuguizbd', (err, database) => {
  if (err) return console.log(err)
  db = database
})

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', (req, res) => {
  db.collection('questions').find().toArray((err, r_questions) => {
    if (err) return console.log(err);
    db.collection('players').find().toArray((err, r_players) => {
      if (err) return console.log(err);
      res.render('pages/index', {questions: r_questions, players: r_players})
    })
  })
})

app.get('/game', (req, res) => {

  db.collection('questions').find().toArray((err, r_questions) => {
    if (err) return console.log(err);
    db.collection('players').find().toArray((err, r_players) => {
      if (err) return console.log(err);

      var question = r_questions[0];

      res.render('pages/game', {
        question: question,
        uid: crypto.createHash('md5').update(
          question.reponse1+question.reponse1
          ).digest("hex"),
        players: r_players,
        number : number
      })
    })
  })
})

app.post('/answer', (req, res) => {
  if(req.body.uid == crypto.createHash('md5').update(req.body.answer+req.body.answer).digest("hex")) {
    number++;
    res.redirect('/game');
  }
  res.redirect('/gameover');
})

app.get('/gameover', (req, res) => {

  db.collection('players').find().toArray((err, r_players) => {
    if (err) return console.log(err);

    res.render('pages/gameover', {
      number: number,
      pseudo: pseudo,
      players: r_players
    })
  })
})

app.post('/retry', (req, res) => {

  var player = { pseudo : req.body.pseudo, score : number }
  console.log(player)

  db.collection('players').save(player, (err, result) => {
    if (err) return console.log(err)

    console.log('saved to database')
    pseudo = req.body.pseudo;
    number = 1;

    res.redirect('/game');
  })
})

app.listen(3000, function() {
  console.log('listening on 3000');
})