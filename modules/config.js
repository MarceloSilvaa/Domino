const fs = require('fs');
const crypto = require('crypto');
const url = require('url');

const group = "bokx2lazl7z3tayrhjyi";

//-----------------------------------------------------
// Headers and messages

const headerPost = {
	'Content-Type': 'text/plain', 
	'Access-Control-Allow-Origin': '*'
};

const headerSSE = {
	'Content-Type': 'text/event-stream', 
	'Cache-Control': 'no-cache', 
	'Access-Control-Allow-Origin': '*', 
	'Connection': 'keep-alive'
};

const invalidArgs = '{ "error": "Invalid arguments"}';
const invalidPlayer = '{ "error": "Nickname not reconized"}';
const invalidPassword = '{ "error": "User registered with a different password"}';
const invalidPassGroup = '{ "error": "User registered with a different password or wrong group was given"}';
const invalidGame = '{ "error": "Game does not exist"}';
const invalidGamePlayer = '{ "error": "This player is not connected to that game"}';

//-----------------------------------------------------
// File management

function checkDataFile() {
	try {
		if(!fs.existsSync('data.json')) {
			//Create file if doesn't exist
			fs.writeFileSync('data.json', '{ }', { flag: 'w+'});
		}
	} catch (err) { console.error(err); }
}


function updateDataFile(data){
	try {
      fs.writeFileSync('data.json', JSON.stringify(data), { flag: 'w+'});
	} catch (err) { console.error(err); }
}

function checkGamesFile() {
	try {
		if(!fs.existsSync('games.json')) {
			//Create file if doesn't exist
			let aux = {
				"players": 0
			};
			fs.writeFileSync('games.json', JSON.stringify(aux), { flag: 'w+'});
		}
	} catch (err) { console.error(err); }
}

function updateGamesFile(data){
	try {
      fs.writeFileSync('games.json', JSON.stringify(data), { flag: 'w+'});
	} catch (err) { console.error(err); }
}

//-----------------------------------------------------

module.exports.register = function(query, response){
	checkDataFile();
	fs.readFile('data.json',function(err,data) { 
		if(!err) {
			let info = JSON.parse(data);
			//let info = JSON.parse(data.toString());
			
			if(!query.nick || !query.pass || Object.keys(query).length != 2) {
				response.writeHead(400, headerPost);
				response.end(invalidArgs);
				return;
			}
			//Nickname exists
			if(info[query.nick]) {
				let cipher = crypto.createHash('md5').update(query.pass).digest('hex');
				//Nick matches password
				if(info[query.nick].pass === cipher) {
					response.writeHead(200, headerPost);
					response.end();
				}
				else {
					response.writeHead(401, headerPost);
					response.end(invalidPassword);
				}
			}
			
			//Nickname does not exist = Create account
			else {
				
				var count = Object.keys(info).length;
				let cipher = crypto.createHash('md5').update(query.pass).digest('hex');
				
				let aux = {
					"pass": cipher,
					"victories": 0,
					"games": 0
				};
				info[query.nick] = aux;
				console.log(info);
				updateDataFile(info);
				response.writeHead(200, headerPost);
				response.end();
			}
		}
	});
}

//-----------------------------------------------------

module.exports.ranking = function(response){
	fs.readFile('data.json',function(err,data) { 
		if(!err) {
			let info = JSON.parse(data);
			
			// Create an array with 10 entries sorted by number of victories
			
			var count = 0;
			var names = [];
			var vals = [];
			
			for(var nick in info) {
				let wins = info[nick].victories;
				
				//Still less than 10 names
				if(count < 10) {
					names[count] = nick;
					vals[count] = wins;
					count++;
				}
				
				//Swap with some place
				else {
					//Update array in first position (min value)
					if(vals[0] < wins) {
						names[0] = nick;
						vals[0] = wins;
					}
				}
				
				let i = 0;
				//Array sort: Run at max 10 times
				for(i = 0; i < vals.length; i++) {
					let pos = 0;
					let max = vals[0];
					let name = names[0];
					let k = 0;
		
					//Search for max
					for(k = 0; k < vals.length-i; k++) {
						if(vals[k]>max) {
							max = vals[k];
							pos = k;
							name = names[k];
						}
					}
					
					//Swap
					let tempVal = vals[vals.length-i-1];
					vals[vals.length-i-1] = max;
					vals[pos] = tempVal;
					
					let tempName = names[names.length-i-1];
					names[names.length-i-1] = name;
					names[pos] = tempName;
				}
			}
			
			//Give answer
			let i = 0;
			let answer = [];
			for(i = vals.length-1; i >= 0; i--) {
				let aux = {
					"nick": names[i],
					"victories": vals[i],
					"games": info[nick].games
				};
				answer.push(aux);
			}
			
			let ranking = {
				"ranking": answer
			};
			
			console.log(ranking);
			response.writeHead(200, headerPost);
			response.end(JSON.stringify(ranking));
		}
	});
}

//-----------------------------------------------------

module.exports.join = function(query, response){
	fs.readFile('data.json',function(err,data) { 
		if(!err) {
			let info = JSON.parse(data);
			
			if(!query.group || !query.nick || !query.pass || Object.keys(query).length != 3) {
				response.writeHead(400, headerPost);
				response.end(invalidArgs);
				return;
			}
			
			//Nickname exists
			if(info[query.nick]) {
				let cipher = crypto.createHash('md5').update(query.pass).digest('hex');
				
				//Nick matches password and is the correct group
				if(info[query.nick].pass === cipher && query.group === group) {
					
					checkGamesFile();
					fs.readFile('games.json',function(gameErr,gameData) {
						 if(!gameErr) {
							 
							let gameInfo = JSON.parse(gameData);
							 
							//Check if player is already in game
							
							let countArgs = 0; 
							for(game in gameInfo) {
								//First is the number of players looking for game
								if(countArgs == 1) {
									if(gameInfo[game]["player1"] === query.nick) {
										
										let auxGame = game;
										let auxHand = gameInfo[game]["handPlayer1"];
										
										let aux = {
											"game": auxGame,
											"hand": auxHand
										};
										
										response.writeHead(200, headerPost);
										response.end(JSON.stringify(aux));
										return;
									}
								}
								countArgs = 1;
							}
							
							
							//Nobody was waiting for a game = Create new game
							if(gameInfo["players"] == 0) {
								
								//One player is now waiting for game
								gameInfo["players"] = 1;
								
								//Create game id
								let hash = crypto.createHash('md5').update(Date.now()+'').digest('hex');
								
								//Create stock pieces
								let pos = 0; let pieceStock = [];
								for(let i = 0; i <= 6; i++) {
									pieceStock[pos] = [i,i];
									pos++;
									for(let j = i+1; j <= 6; j++) {
										pieceStock[pos] = [j,i];
										pos++;
									}
								}
								
								//Create hand for player1
								let player1 = [];
								for(let i = 0; i <= 6; i++) {
									//Returns a random integer from 0 to 'pieces'
									let index = Math.floor(Math.random() * pieceStock.length); 
									player1.push(pieceStock[index]);
									//Removes element on index 'pos'
									pieceStock.splice(index, 1);
								}
								
								//Update file
								gameInfo[hash] = {
									"free": "yes",
									"player1": query.nick,
									"player2": '',
									"handPlayer1": player1,
									"handPlayer2": '',
									"stock": pieceStock
								};
								updateGamesFile(gameInfo);
								
								//Give answer (game + hand)
								
								let aux = {
									"game": hash,
									"hand": player1
								};
								
								response.writeHead(200, headerPost);
								response.end(JSON.stringify(aux));
							}
							
							//Add to the last game
							else {
								let auxNr = gameInfo["players"];
								gameInfo["players"] = auxNr-1;
								
								let count = 0; let player2 = []; let hash = '';
								for(game in gameInfo) {
									//First is the number of players looking for game
									if(count == 1) {
										if(gameInfo[game]["free"] === "yes") {
								
											let pieceStock = gameInfo[game]["stock"];
											for(let i = 0; i <= 6; i++) {
												//Returns a random integer from 0 to 'pieces'
												let index = Math.floor(Math.random() * pieceStock.length); 
												player2.push(pieceStock[index]);
												//Removes element on index 'pos'
												pieceStock.splice(index, 1);
											}
											
											hash = game;
											gameInfo[game]["free"] = "no";
											gameInfo[game]["player2"] = query.nick;
											gameInfo[game]["handPlayer2"] = player2;
											gameInfo[game]["stock"] = pieceStock;

											break;
										}
									}
									count = 1;
								}

								updateGamesFile(gameInfo);
								
								//Give answer (game + hand)
								
								let aux = {
									"game": hash,
									"hand": player2
								};
								
								response.writeHead(200, headerPost);
								response.end(JSON.stringify(aux));
								
								gameStart(hash);
							}
							
							console.log(gameInfo);
						 }
					});
				}
				else {
					response.writeHead(401, headerPost);
					response.end(invalidPassGroup);
				}
			}
			else {
				response.writeHead(401, headerPost);
				response.end(invalidPlayer);
			}
		}
	});
}

//-----------------------------------------------------

module.exports.leave = function(query, response) {
	fs.readFile('data.json',function(err,data) { 
		if(!err) {
			let info = JSON.parse(data);
			
			if(!query.nick || !query.pass || !query.game || Object.keys(query).length != 3) {
				response.writeHead(400, headerPost);
				response.end(invalidArgs);
				return;
			}
			
			//Nickname exists
			if(info[query.nick]) {
				let cipher = crypto.createHash('md5').update(query.pass).digest('hex');
				
				//Nick matches password
				if(info[query.nick].pass === cipher) {
					
					checkGamesFile();
					fs.readFile('games.json',function(gameErr,gameData) {
						 if(!gameErr) {
							 
							let gameInfo = JSON.parse(gameData);
							 
							//Game exists
							if(gameInfo[query.game]) {
								 
								//Player is in the given game
								if(gameInfo[query.game].player1 === query.nick || gameInfo[query.game].player2 === query.nick) {
									 
									//Player was just waiting for a game (Game has not started yet)
									if(gameInfo[query.game].free === "yes") {
										let auxNr = gameInfo["players"];
										gameInfo["players"] = auxNr - 1;
										
										delete gameInfo[query.game];
										updateGamesFile(gameInfo);
										
										response.writeHead(200, headerPost);
										response.end();
									}
									else {
										//Game has started = Update stats/rankings
										let leaver = query.nick;
										let winner = '';
										
										//Player 1 quit
										if(gameInfo[query.game].player1 === query.nick) {
											winner = gameInfo[query.game].player2;
										}
										else {
											winner = gameInfo[query.game].player1;
										}
										
										delete gameInfo[query.game];
										updateGamesFile(gameInfo);
										 
										//Update stats winner
										var aux1 = info[winner].victories;
										var aux2 = info[winner].games;
										
										info[winner].victories = aux1 + 1;
										info[winner].games = aux2 + 1;
										
										//Update stats leaver
										
										aux2 = info[leaver].games;
										
										info[leaver].games = aux2 + 1;
										
										updateDataFile(info);
										
										response.writeHead(200, headerPost);
										response.end();
										
										//Update game
										gameEnd(query.game, winner);
									} 
								}
								else {
									response.writeHead(401, headerPost);
									response.end(invalidGamePlayer);
								}
							}
							else {
								response.writeHead(401, headerPost);
								response.end(invalidGame);
							}
						 }
					 });
				}
				else {
					response.writeHead(401, headerPost);
					response.end(invalidPassword);
				}
			}
			else {
				response.writeHead(401, headerPost);
				response.end(invalidPlayer);
			}
		}
	});
}

//-----------------------------------------------------

module.exports.update = function(query, request, response) {
	
	fs.readFile('games.json',function(gameErr,gameData) {
		if(!gameErr) {
			let gameInfo = JSON.parse(gameData);
			
			if(!query.nick || !query.game || Object.keys(query).length != 2) {
				response.writeHead(400, headerPost);
				response.end(invalidArgs);
				return;
			}

			//Game exists
			if(gameInfo[query.game]) {
				response.writeHead(200, headerSSE);
				remember(query.game, response);
				gameStart(game);
			}
			else {
				response.writeHead(401, headerPost);
				response.end(invalidGame);
				return;
			}
		}
	});
}

var responses = {};

function remember(game,response) {
	if(!responses[game]) {
		responses[game]  = [response];
	}
	else {
		responses[game].push(response);
	}
}

function close(game) { 
	delete responses[game];
}

function gameStart(game) {
	fs.readFile('games.json',function(gameErr,gameData) {
		if(!gameErr) {
			let gameInfo = JSON.parse(gameData);

			//Define turn
			let player1 = gameInfo[game].handPlayer1;
			let player2 = gameInfo[game].handPlayer2;
						
			let max1 = 0;
			let max2 = 0;
						
			for(piece in player1) {
				let sum = piece[0]+piece[1];
				if(sum > max1) {
					max1 = sum;
				}
			}
						
			for(piece in player2) {
				let sum = piece[0]+piece[1];
				if(sum > max2) {
					max2 = sum;
				}
			}
						
			if(max1 >= max2) {
				let aux = {
					"turn": gameInfo[game].player1
				};
				update(game, JSON.stringify(aux));
			}
			else {
				let aux = {
					"turn": gameInfo[game].player2
				};
				update(game, JSON.stringify(aux));
			}
		}
	});
}

function gameEnd(game, winner) {
	let aux = {
		"winner": winner
	};
	
	update(game,JSON.stringify(aux));
	close(game);
}

function update(game, message) {
	if(!responses[game]) {
		return;
	}
	
	for(response of responses[game]) {
		response.write('data: '+ message+'\n\n');
	}
}

//-----------------------------------------------------
