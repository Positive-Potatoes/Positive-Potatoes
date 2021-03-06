/*
* rooms class for dynamically storing rooms
*
* functions:
* makeRoom
* getRoom
* getRooms
*/
var Promise = require('bluebird')
var http = require('http')
var request = require('request')

var Rooms = function() {
  var roomStore = {};
  /*
  * individual room class, requires a name
  *
  *
  * if a player is removed and the room becomes
  * empty it is destroyed
  *
  * initial trivia is empty, must be populated with addTrivia
  * which is a promise, afterwords automatically repopulates trivia
  * as it is used
  * 
  * returns current trivia question with correct answer stripped via getTrivia
  *
  */
  var Room = function(name) {
    if(!name){
      return null;
    } else {
      var players = {}
      var numPlayers = Object.keys(players).length
      var trivia = [];
      var currentTrivia = null;
      this.destroy = function() {
        delete roomStore[name];
      }
      this.addTrivia = function(trivia) {
        var body = []
        var ctx = this;
        return new Promise(function(resolve, reject) {
          request.bind(ctx);
          request
            .get('https://www.opentdb.com/api.php?amount=10')
            .on('data', function(chunk) {
              body.push(chunk);
            })
            .on('end', function() {
              body = JSON.parse(Buffer.concat(body).toString());
              ctx._setTrivia(body.results);
              resolve();
            })
        })
      }
      this.newTrivia = function() {
        currentTrivia = trivia.pop();
        if(trivia.length < 5) {
          this.addTrivia();

        }
        return currentTrivia;
      }
      this.newTrivia = function() {
        currentTrivia = trivia.pop();
        return currentTrivia;
      }
      this.getTrivia = function() {
        if(!currentTrivia) {
          this.newTrivia();
        }
        if(currentTrivia) {
          var possible = currentTrivia['incorrect_answers'].slice()
          possible.push(currentTrivia['correct_answer']);
          return {
            category: currentTrivia['category'],
            question: currentTrivia['question'],
            answers: possible
          };
        } else {
          return null;
        }
      }

      this.answerQuestion = function(answer, user) {
        if(!(user && answer)) { 
          console.log('no user or answer');
          return false; 
        }
        if(!this.getPlayer(user)) {
          console.log('user not in room');
          return false;
        }
        if(!currentTrivia) { 
          return false; 
        }
        if(currentTrivia['correct_answer'] === answer) {
          this.incrementScore(user);
          this.newTrivia();
          return true;
        }
      }

      this._setTrivia = function(arr) {
        console.log(trivia, 'hey')
        if(Array.isArray(arr)) {
          arr.forEach(entry => {
            trivia.push(entry);
          });
        }
      }
      //for testing
      this._getAllTrivia = function() {

        return trivia;
      }
      this.addPlayer = function(player) {
        if(players[player] === undefined) {
          players[player] = 0;
          numPlayers = Object.keys(players).length;
        } else {
          console.log('that player exists');
        }
      }
      this.incrementScore = function(player) {
        if(players[player] !== undefined) {
          players[player]++;
          return players[player];
        } else {
          console.log('no such player')
        }
      }
      this.removePlayer =  function(player, persist) {
        delete players[player];
        if(!persist && Object.keys(players).length < 1 ) {
          this.destroy();
        }
        return this;
      }
      this.getPlayer = function(player) {
        if(players[player] === undefined) {
          return null;
        } else {
          return {name: player, score: players[player]};
        }
      }
      this.getPlayers = function() {
        var arr = []
        for(var key in players) {
          arr.push({name: key, score: players[key]})
        }
        return arr;
      }
    }
  }
  //no return value, requires at least one string input, second is optional
  //must initialize the room with
  this.makeRoom = function(room, player) {
    return new Promise(function(resolve, reject) {
      if(!((typeof room) === 'string' && room.length > 1)) {
        reject('must have a room name');
      } else if(roomStore[room]) {
        reject('that room exists')
      } else {
        roomStore[room] = new Room(room)
        console.log(roomStore);
        if(Object.keys(roomStore[room]).length < 1) {
          reject('unkown error making room');
        } else {
          if((typeof player) === 'string' && player.length > 0){
            roomStore[room].addPlayer(player);
          }
          roomStore[room].addTrivia().then(function() {
            resolve(roomStore[room])
          }, function(err) {
            reject('trivia error', err);
          })
        }
      }
      
    })
  }
  //returns undefined or room object
  this.getRoom = function(room) {
    return roomStore[room];
  }
  //returns array of room objects(may be empty)
  this.getRoomsRaw = function() {
    var arr = [];
    console.log(roomStore);
    for(var roomName in roomStore) {
      arr.push({roomname: roomName, players: roomStore[roomName].getPlayers()})
    }
    return arr;
  }
  // returns array of objects with room name and score boards
  this.getRooms = function() {
    var arr = [];
    for(var room in roomStore) {
      arr.push({
        roomname: room,
        scoreboard: roomStore[room].getPlayers()
      })
    }
    return arr;
  }
}

module.exports = new Rooms();

// var store = new Rooms();

// store.makeRoom('jigga').then(function() {
//   var myRoom = store.getRoom('jigga')
//   myRoom.addPlayer('john')
//   myRoom.incrementScore('john');
//   console.log(myRoom.getPlayers())
//   console.log(myRoom.getPlayer('john'))
//   console.log(store.getRooms());
//   console.log(myRoom._getAllTrivia(), 'my')
//   myRoom.addTrivia().then(function() {
//     console.log(myRoom.getTrivia())
//   })

// })
