var fs = require('fs');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var DICTIONARY = require('./union.txt.json');
var GAME_STATE = {
  points: [0,0],
  words: [],
  currentWordValue: 1
};

app.use(express.static(__dirname));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var puzzle = DICTIONARY
.filter(e => e.indexOf("ine") !== -1)
.sort((a,b) => a < b ? -1 : 1)
// .filter((e,i) => i > 0 && i < 100);

function setGameState() {
  for(var i = 0; i < puzzle.length; i++) {
    if (i == 0 || i == puzzle.length - 1) {
      var t = "locked";
    } else {
      var t = "";
    }
    GAME_STATE.words[i] = {
      word: puzzle[i],
      team: t
    }
  }
}

setGameState();

var correctGuesses = [];
var concurrentUsers = 0;

io.on('connection', function(socket){
  console.log('a user connected');
  concurrentUsers++;

  //reply to socket with current data
  socket.emit('welcome', {
    state: GAME_STATE,
    userCount: concurrentUsers
  })

  socket.on('disconnect', function(){
    console.log('a user disconnected');
    concurrentUsers--;
  });

  socket.on('guess', function(data){
    if(puzzle.indexOf(data.word) !== -1) {
      var index = puzzle.indexOf(data.word);
      if(GAME_STATE.words[index].team == "") {
        GAME_STATE.words[index].team = data.team;
        var scorer = data.team == "blue" ? 0 : 1;
        GAME_STATE.points[scorer] += GAME_STATE.currentWordValue;
        GAME_STATE.currentWordValue++;
        var dataObject = {
          index: index,
          word: GAME_STATE.words[index].word,
          team: GAME_STATE.words[index].team,
          newScore: GAME_STATE.points,
          wordCount: GAME_STATE.currentWordValue - 1
        }
        console.log("correct guess");
        socket.emit("correct-guess-you", dataObject)
        io.sockets.emit("correct-guess-other", dataObject);
      } else {
        //word already found
        console.log("already found");
        socket.emit("already-found", {
          index: index
        });
      }
    } else {
      console.log("incorrect");
      socket.emit("incorrect-guess");
    }
  })
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
