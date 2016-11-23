const express = require('express');
const MongoClient = require('mongodb').MongoClient

const app = express();
//mongodb://userepul:epul@172.31.7.31:27017/
var db;
var arr_players;
var arr_questions;
MongoClient.connect('mongodb://localhost:27017/thuguizbd', (err, database) => {
  if (err) return console.log(err)
  db = database
})

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', (req, res) => {
  db.collection('questions').find().toArray((err, result) => {
    if (err) return console.log(err);
    arr_questions = result;
  });

  db.collection('players').find().toArray((err, result) => {
    if (err) return console.log(err);
    arr_players = result;
  });

    res.render('pages/index', {questions: arr_questions, players: arr_players})
})

app.get('/game', (req, res) => {

  db.collection('questions').find().toArray((err, result) => {
    if (err) return console.log(err);
    arr_questions = result[0];
  });

  db.collection('players').find().toArray((err, result) => {
    if (err) return console.log(err);
    arr_players = result;
  });

  res.render('pages/game', {question: arr_questions, players: arr_players})
})

app.listen(3000, function() {
  console.log('listening on 3000');
})