const rows = 9;
const cols = 18;
const boardNr = 9*7*3-27;
const min = 0;
const max = 6;
const hor1 = 1;
const hor2 = 2;
const vert1 = 3;
const vert2 = 4;

var group = "bokx2lazl7z3tayrhjyi";
var url = "NO LONGER VALID";

// User info
var username;
var password;

//Game info
var oponentPlayer = 1; //0 if computer | 1 if human
var difficulty = 0; //beginner
var gameID = 0; //ID of current game (human vs human)

var computerPoints = 0;
var playerPoints = 0;

var x1 = 0;
var y1 = 0;

var x2 = 0;
var y2 = 0;

var points1 = 0;
var points2 = 0;

var first = true;
var inGame = false;
var preGame = false;

var piecesPlayed = 0;

var turn = 1; //1 = player 1 ----- 2 = player 2
var pieces = 28; //nr of pieces in stock

//Pieces of player 1 / player 2 / stock
var piecePlayer1 = [];
var piecePlayer2 = [];
var pieceStock = [];

class Piece {
	constructor(value1,value2) {
		let c1 = 127025 + value1*7 + value2;
		let c2 = 127025 + value2*7 + value1;
		let c3 = 127075 + value1*7 + value2;
		let c4 = 127075 + value2*7 + value1;
				
		this.horizontal1 = String.fromCodePoint(c1); //"&#"+
		this.horizontal2 = String.fromCodePoint(c2);
		this.vertical1 = String.fromCodePoint(c3);
		this.vertical2 = String.fromCodePoint(c4);
		
		this.value1 = value1;
		this.value2 = value2;
	}
}

// ---------------------------------------------------------------------------------
// Server requests

function register() {
	//Register and autentication
	
	var info = {
		"nick": username,
		"pass": password
	};
	
	fetch(url + "register",{
		method: "POST",
		body: JSON.stringify(info)
    })
		.then(response => registerAnswer(response));
}

function registerAnswer(response) {
	if (response.status >= 200 && response.status < 300) {
		changeToGame();
		ranking();
	} 
	else {
		document.getElementById("errorLogin").innerHTML = "Combinação username/password errada.";
	}
}

function join() {
	var info = {
		"group": group,
		"nick": username,
		"pass": password
	};
	
	console.log(info);
	
	fetch(url + "join",{
		method: "POST",
		body: JSON.stringify(info)
    })
		.then(response => joinOnAnswer(response));
}

async function joinOnAnswer(response) {
	let aux = await response.json();
	
	//Not OK
	if (response.status < 200 && response.status >= 300) {
		return;
	} 
	
	console.log(aux);

	gameID = aux.game;
	for(let i = 0; i <= 6; i++) {
		addHumanPiece(aux.hand[i]);
	}
	
	displayGameBoard();
	createSpaces();
	displayPiecesBeforeStart();
	displayPlayerPieces();
	document.getElementById("message").innerHTML = "À procura de um adversário...";
	
	preGame = true;
	piecesPlayed = 0;
	update();
}

function update() {
	var eventSource = new EventSource(url + "update?nick=" + username + "&game=" + gameID);
	
	eventSource.onmessage = function (event) {
		var info = JSON.parse(event.data);
		console.log(info);
		
		if(info.board != undefined && info.turn != undefined) {
			//console.log(info.board.count);
			var aux;
			
			for(let i = 0; i < info.board.line.length; i++) {
				aux = info.board.line[i];
			}
			
			if(piecesPlayed > 0) {
				var enemyPieces = 28 - info.board.stock - piecesPlayed - piecePlayer1.length;
				if(turn != username) {
					enemyPieces = enemyPieces + 1;
				}
				
				/*
				var help = {
					"enemyPieces": 28 - info.board.stock - piecesPlayed - piecePlayer1.length,
					"stock": info.board.stock,
					"piecesPlayed": piecesPlayed,
					"myPieces": piecePlayer1.length
				};
				console.log(help); */
				addPieceToBoard(aux[0], aux[1], info.turn, enemyPieces, info.board.side);
			}
			
			piecesPlayed = piecesPlayed + 1;
		}
		
		//Still required, because of the first play
		if(info.turn != undefined) {
			preGame = false;
			
			if(username == info.turn) {
				document.getElementById("message").innerHTML = "É você a jogar.";
			}
			else {
				document.getElementById("message").innerHTML = "É " + info.turn + " a jogar.";
			}
		}
		
		if(info.winner != undefined) {
			eventSource.close();
			
			//Left during join or game ended in draw
			if(info.winner == null) {
				document.getElementById("message").innerHTML = "Jogo empatado.";
			}
			//Someone won the game
			else {
				if(info.winner == username) {
					document.getElementById("message").innerHTML = "Você venceu o jogo!";
				}
				else {
					document.getElementById("message").innerHTML = info.winner + " venceu o jogo!";
				}
			}
			ranking();
			endGame();
		}
	}
	
	eventSource.onerror = function (event) {
		console.log("Erro: Update");
	}
}

function notify(humanPiece) {
	var aux = [humanPiece.value1, humanPiece.value2];
	
	var info = {
		"nick": username,
		"pass": password,
		"game": gameID,
		"piece": aux
	};
	
	console.log(info);
	
	fetch(url + "notify",{
		method: "POST",
		body: JSON.stringify(info)
    })
		.then(response => notifyAnswer(response));
}

function notifyAnswer(response) {
	if (response.status >= 200 && response.status < 300) {
		return;
	}
}

function leave() {
	if(inGame == false) {
		return;
	}
	
	var info = {
		"nick": username,
		"pass": password,
		"game": gameID
	};
	
	fetch(url + "leave",{
		method: "POST",
		body: JSON.stringify(info)
    })
		.then(response => leaveAnswer(response));
}

function leaveAnswer(response) {
	if (response.status >= 200 && response.status < 300) {
		//If left while waiting for a game
		if(preGame) {
			document.getElementById("message").innerHTML = "Saiu da lista de espera.";
			ranking();
			endGame();
		}
		return;
	}
}

function ranking() {
  fetch(url + "ranking", {
    method: "POST",
    body: ""
  })
    .then(response => rankingAnswer(response));
}

async function rankingAnswer(response) {
	if (response.status >= 200 && response.status < 300) {
		var rank = await response.json();
		for(let i = 1; i <= rank["ranking"].length; i++) {
			let aux = i-1;
			document.getElementById("scoreTableUser" + i).innerHTML = rank["ranking"][aux + ''].nick;
			document.getElementById("scoreTableUserPoints" + i).innerHTML = rank["ranking"][aux + ''].victories;
		}
	}
}

// End: Server requests
// ---------------------------------------------------------------------------------

function saveUser() {
	username = document.getElementById("inputUsername").value;
	password = document.getElementById("inputPassword").value;
	
	//document.getElementById("scoreTableUser").innerHTML = username;
	
	if(username === "") {
		document.getElementById("errorLogin").innerHTML = "É necessário preencher os dois campos.";
		return;
	}
	
	if(password === "") {
		document.getElementById("errorLogin").innerHTML = "É necessário preencher os dois campos.";
		return;
	}
	
	register();
}

//Play versus computer or human
function chooseOponent() {
	if(inGame) {
		return false;
	}
	
	//Default is playing versus player	
	oponentPlayer = 1;
	
	var select = document.getElementById("oponentSelect");
	var val = select.options[select.selectedIndex].value;
	oponentPlayer = val;
}

function startGame() {
	endGame();
	inGame = true;
	
	//Play versus computer
	if(oponentPlayer == 0) {
		displayGameBoard();
		createPieces();
		createSpaces();
		giveStartingPieces();
		displayPieces();
		firstPlay();
	}
	
	//Player versus computer
	else {
		join();
	}
}

function endGame() {
	piecesPlayed = 0;
	inGame = false;
	turn = 1;
	pieces = 28;
	x1 = 0;
	x2 = 0;
	y1 = 0;
	y2 = 0;
	clearArrayPieces();
}

function addPieceToBoard(val1, val2, playerName, count, side) {
	let auxPiece = new Piece(val1, val2);
	
	//First play
	if(piecesPlayed == 1) {
		x1 = 4;
		x2 = 4;
		y1 = 7;
		y2 = 9;
		
		if(playerName != username) {
			addPieceToBoardPlayer(4,8,auxPiece,hor1);
		}
		else {
			addPieceToBoardOponent(4,8,auxPiece,hor1,count);
		}
	}
	
	//Not the first play
	else {
		/*
		
		if(side == "start") {
			if(playerName != username) {
				addPieceToBoardPlayer(x1,y1,auxPiece,hor1);
			}
			else {
				addPieceToBoardOponent(x1,y1,auxPiece,hor1,count);
			}
			update1();
		}
		else {
			if(playerName != username) {
				addPieceToBoardPlayer(x2,y2,auxPiece,hor2);
			}
			else {
				addPieceToBoardOponent(x2,y2,auxPiece,hor2,count);
			}
			update2();
		} */
	}
	
	//Mutual cases
	for(var col=0; col<count; col++) {
		document.getElementById("oponent" + col).innerHTML = String.fromCodePoint(127024);
		document.getElementById("oponent" + col).style.opacity = "1.0";
	}
	for(var col=count; col<21; col++) {
		document.getElementById("oponent" + col).innerHTML = String.fromCodePoint(127024);
		document.getElementById("oponent" + col).style.opacity = "0.1";
		
	displayPlayerPieces();
}

function addPieceToBoardPlayer(i,j,auxPiece,dir) {
	//play must be possible to get here
	//The client was the one who made the play
	let aux = i*18 + j;
	let k = 0;
	
	for(k = 0; k < piecePlayer1.length; k++) {
		if(piecePlayer1[k].value1 == auxPiece.value1 && piecePlayer1[k].value2 == auxPiece.value2) {
			break;
		}
	}
	
	if(piecePlayer1[k].value1 == piecePlayer1[k].value2) {
		dir = vert1;
	}
	if(dir == hor1) {
		document.getElementById("game" + aux).innerHTML = piecePlayer1[k].horizontal1;
	}
	else if(dir == hor2) {
		document.getElementById("game" + aux).innerHTML = piecePlayer1[k].horizontal2;
	}
	else if(dir == vert1) {
		document.getElementById("game" + aux).innerHTML = piecePlayer1[k].vertical1;
	}
	else if(dir == vert2){
		document.getElementById("game" + aux).innerHTML = piecePlayer1[k].vertical2;
	}
	document.getElementById("game" + aux).style.opacity = "1.0";
	piecePlayer1.splice(k, 1);
}

function addPieceToBoardOponent(i,j,auxPiece,dir,count) {
	let aux = i*18 + j;
	
	if(auxPiece.value1 == auxPiece.value2) {
		dir = vert1;
	}
	if(dir == hor1) {
		document.getElementById("game" + aux).innerHTML = auxPiece.horizontal1;
	}
	else if(dir == hor2) {
		document.getElementById("game" + aux).innerHTML = auxPiece.horizontal2;
	}
	else if(dir == vert1) {
		document.getElementById("game" + aux).innerHTML = auxPiece.vertical1;
	}
	else if(dir == vert2){
		document.getElementById("game" + aux).innerHTML = auxPiece.vertical2;
	}
	document.getElementById("game" + aux).style.opacity = "1.0";
	}
}

function firstPlay() {
	var player1 = 0;
	var pos1 = 0;
	
	var player2 = 0;
	var pos2 = 0;
	
	for(let i = 0; i < piecePlayer1.length; i++) {
		let cur = piecePlayer1[i].value1 + piecePlayer1[i].value2;
		if(cur > player1) {
			player1 = cur;
			pos1 = i;
		}
	}
	
	for(let i = 0; i < piecePlayer2.length; i++) {
		let cur = piecePlayer2[i].value1 + piecePlayer2[i].value2;
		if(cur > player2) {
			player2 = cur;
			pos2 = i;
		}
	}
	
	if(player1 >= player2) {
		turn = 1;
		points1 = piecePlayer1[pos1].value1;
		points2 = piecePlayer1[pos1].value2;
		if(points1 == points2) {
			play(4,8,pos1,vert1);
		}
		else {
			play(4,8,pos1,hor1);
		}
		x1 = 4;
		x2 = 4;
		y1 = 7;
		y2 = 9;
		playComputer();
	}
	else if(player1 < player2) {
		turn = 2;
		points1 = piecePlayer2[pos2].value1;
		points2 = piecePlayer2[pos2].value2;
		if(points1 == points2) {
			play(4,8,pos2,vert1);
		}
		else {
			play(4,8,pos2,hor1);
		}
		x1 = 4;
		x2 = 4;
		y1 = 7;
		y2 = 9;
		playPlayer();
	}
}

function playPlayer() {
	turn = 1;
	document.getElementById("message").innerHTML = "É a sua vez";
}

function clickHumanPiece(posVal) {
	if(inGame == false) {
		return;
	}
	
	//This piece doesn't exist
	if(posVal >= piecePlayer1.length) {
		return;
	}
	
	notify(piecePlayer1[posVal]);
}

function clickPiece(e) {
	if(inGame == false) {
		return;
	}
	
	if(turn == 2) {
		if(oponentPlayer != 1) {
			return;
		}
	}
	
	var nr1 = e.srcElement.id.charAt(e.srcElement.id.length-2)
	var nr2 = e.srcElement.id.charAt(e.srcElement.id.length-1)
	
	var posVal;
	var played = false;
	
	if (nr1 >= '0' && nr1 <= '9') {
		posVal = parseInt(nr1.concat(nr2));
	}
	else {
		posVal = parseInt(nr2);
	}
	
	if(oponentPlayer == 1) {
		clickHumanPiece(posVal);
		return;
	}
	
	//check for options
	var option = false;
	for(let i = 0; i < piecePlayer1.length; i++) {
		var val1 = piecePlayer1[i].value1;
		var val2 = piecePlayer1[i].value2;
		
		if(val1 == points1 || val2 == points1) {
			option = true;
			break;
		}
		
		if(val1 == points2 || val2 == points2) {
			option = true;
			break;
		}
	}
	
	if(option==false && pieceStock.length != 0) {
		givePieceToPlayer();
		displayPlayerPieces();
		displayStockPieces();
		playPlayer();
		return;
	}
	
	checkDraw();
	if(inGame == false) {
		return;
	}
	
	if(posVal >= 0 && posVal < piecePlayer1.length) {
		var val1 = piecePlayer1[posVal].value1;
		var val2 = piecePlayer1[posVal].value2;
		
		if(val1 == points1) {
			if(x1%2==0) {
				play(x1,y1,posVal,hor2);
			}
			else if(x1%2==1) {
				play(x1,y1,posVal,hor1);
			}
			update1();
			points1 = val2;
			played = true;
		}
		if(val1 == points2 && played == false) {
			if(x2%2==0) {
				play(x2,y2,posVal,hor1);
			}
			else if(x2%2==1) {
				play(x2,y2,posVal,hor2);
			}
			update2();
			points2 = val2;
			played = true;
		}
		if(val2 == points1 && played == false) {
			if(x1%2==0) {
				play(x1,y1,posVal,hor1);
			}
			else if(x1%2==1) {
				play(x1,y1,posVal,hor2);
			}
			update1();
			points1 = val1;
			played = true;
		}
		if(val2 == points2 && played == false) {
			if(x2%2==0) {
				play(x2,y2,posVal,hor2);
			}
			else if(x2%2==1) {
				play(x2,y2,posVal,hor1);
			}
			update2();
			points2 = val1;
			played = true;
		}
	}
	
	if(played == false && option == true) {
		turn = 1;
		return;
	}
	
	if(piecePlayer1.length == 0) {
		playerPoints = playerPoints + 1;
		document.getElementById("message").innerHTML = username + " venceu o jogo";
		//document.getElementById("scoreTableUserPoints").innerHTML = playerPoints;
		inGame = false;
		return;
	}
	
	displayPlayerPieces();
	displayStockPieces();
	playComputer();
}

function playComputer() {
	if(oponentPlayer == 1) {
		return;
	}
	turn = 2;
	document.getElementById("message").innerHTML = "É o computador a jogar";
	playBeginner();
	turn = 1;
}

function playBeginner() {
	if(oponentPlayer == 1) {
		return;
	}
	var p = 0;
	var played = false;
	
	//check for options
	var option = false;
	for(let i = 0; i < piecePlayer2.length; i++) {
		var val1 = piecePlayer2[i].value1;
		var val2 = piecePlayer2[i].value2;
		
		if(val1 == points1 || val2 == points1) {
			option = true;
			break;
		}
		
		if(val1 == points2 || val2 == points2) {
			option = true;
			break;
		}
	}
	
	if(option==false && pieceStock.length != 0) {
		givePieceToOponent();
		displayOponentPieces();
		displayStockPieces();
		playComputer();
		return;
	}
	
	checkDraw();
	if(inGame == false) {
		return;
	}
	
	for(let i = 0; i < piecePlayer2.length; i++) {
		var val1 = piecePlayer2[i].value1;
		var val2 = piecePlayer2[i].value2;
		
		if(val1==points1) {
			if(x1%2==0) {
				play(x1,y1,i,hor2);
			}
			else if(x1%2==1) {
				play(x1,y1,i,hor1);
			}
			update1();
			points1 = val2;
			played = true;
			break;
		}
		if(val1==points2) {
			if(x2%2==0) {
				play(x2,y2,i,hor1);
			}
			else if(x2%2==1) {
				play(x2,y2,i,hor2);
			}
			update2();
			points2 = val2;
			played = true;
			break;
		}
		if(val2==points1) {
			if(x1%2==0) {
				play(x1,y1,i,hor1);
			}
			else if(x1%2==1) {
				play(x1,y1,i,hor2);
			}
			update1();
			points1 = val1;
			played = true;
			break;
		}
		if(val2==points2) {
			if(x2%2==0) {
				play(x2,y2,i,hor2);
			}
			else if(x2%2==1) {
				play(x2,y2,i,hor1);
			}
			update2();
			points2 = val1;
			played = true;
			break;
		}
	}

	displayOponentPieces();
	displayStockPieces();
	
	if(piecePlayer2.length==0) {
		computerPoints = computerPoints + 1;
		document.getElementById("message").innerHTML = "Computador venceu o jogo";
		//document.getElementById("scoreTableComputerPoints").innerHTML = computerPoints;
		inGame = false;
		return;
	}
	
	playPlayer();
}

function checkDraw() {
	if(oponentPlayer == 1) {
		return;
	}
	
	var player1Points = 0;
	var player2Points = 0;
	var draw = true;
	
	for(let i = 0; i < piecePlayer1.length; i++) {
		var val1 = piecePlayer1[i].value1;
		var val2 = piecePlayer1[i].value2;
		
		player1Points = player1Points + val1 + val2;
		
		if(val1 == points1 || val2 == points1) {
			draw = false;
			break;
		}
		
		if(val1 == points2 || val2 == points2) {
			draw = false;
			break;
		}
		
	}
	
	for(let i = 0; i < piecePlayer2.length; i++) {
		var val1 = piecePlayer2[i].value1;
		var val2 = piecePlayer2[i].value2;
		
		player2Points = player2Points + val1 + val2;
		
		if(val1 == points1 || val2 == points1) {
			draw = false;
			break;
		}
		
		if(val1 == points2 || val2 == points2) {
			draw = false;
			break;
		}
		
	}
	
	if(draw == true) {
		if(player1Points == player2Points) {
			document.getElementById("message").innerHTML = "Jogo Empatado.";
		}
		else if(player1Points > player2Points) {
			computerPoints = computerPoints + 1;
			//document.getElementById("scoreTableComputerPoints").innerHTML = computerPoints;
			document.getElementById("message").innerHTML = "Jogo fechado. Computador venceu o jogo";
		} 
		else if(player2Points > player1Points) {
			playerPoints = playerPoints + 1;
			let aux = "Jogo fechado. " + username;
			//document.getElementById("scoreTableUserPoints").innerHTML = playerPoints;
			document.getElementById("message").innerHTML = aux.concat(" venceu o jogo");
		}
		inGame = false;
	}
}

function play(i,j,pos,dir) {
	//play must be possible to get here
	let aux = i*18 + j;
	if(turn == 1) {
		if(piecePlayer1[pos].value1 == piecePlayer1[pos].value2) {
			dir = vert1;
		}
		
		if(dir == hor1) {
			document.getElementById("game" + aux).innerHTML = piecePlayer1[pos].horizontal1;
		}
		else if(dir == hor2) {
			document.getElementById("game" + aux).innerHTML = piecePlayer1[pos].horizontal2;
		}
		else if(dir == vert1) {
			document.getElementById("game" + aux).innerHTML = piecePlayer1[pos].vertical1;
		}
		else if(dir == vert2){
			document.getElementById("game" + aux).innerHTML = piecePlayer1[pos].vertical2;
		}
		document.getElementById("game" + aux).style.opacity = "1.0";
		piecePlayer1.splice(pos, 1);
		displayPlayerPieces();
		displayOponentPieces();
	}
	
	else {
		if(piecePlayer2[pos].value1 == piecePlayer2[pos].value2) {
			dir = vert1;
		}
		
		if(dir == hor1) {
			document.getElementById("game" + aux).innerHTML = piecePlayer2[pos].horizontal1;
		}
		else if(dir == hor2) {
			document.getElementById("game" + aux).innerHTML = piecePlayer2[pos].horizontal2;
		}
		else if(dir == vert1) {
			document.getElementById("game" + aux).innerHTML = piecePlayer2[pos].vertical1;
		}
		else if(dir == vert2){
			document.getElementById("game" + aux).innerHTML = piecePlayer2[pos].vertical2;
		}
		document.getElementById("game" + aux).style.opacity = "1.0";
		piecePlayer2.splice(pos, 1);
		displayOponentPieces();
		displayOponentPieces();
	}
}

//This is not the 'update' request
function update1() {
	//goes left
	if(x1%2==0) {
		if(y1 - 1 >= 0) {
			y1 = y1 - 1;
		}
		else if(y1 - 1 < 0) {
			x1 = x1 - 1;
			if(x1 < 0) {
				alert("error game board dimensions");
			}
			y1 = 0;
		}
	}
	//goes right
	else if(x1%2==1) {
		if(y1 + 1 < cols) { //cols = 18 
			y1 = y1 + 1;
		}
		else if(y1 + 1 >= cols) {
			x1 = x1 - 1;
			if(x1 < 0) {
				alert("error game board dimensions");
			}
			y1 = cols - 1;
		}
	}
}

function update2() {
	//goes right
	if(x2%2==0) {
		if(y2 + 1 < cols) {
			y2 = y2 + 1;
		}
		else if(y2 + 1 >= cols) {
			x2 = x2 + 1;
			if(x2 >= rows) {
				alert("error game board dimensions");
			}
			y2 = cols - 1;
		}
	}
	//goes left
	else if(x2%2==1) {
		if(y2 - 1 >= 0) {
			y2 = y2 - 1;
		}
		else if(y2 - 1 < 0) {
			x2 = x2 + 1;
			if(x2 >= rows) {
				alert("error game board dimensions");
			}
			y2 = 0;
		}
	}
}

//Put available pieces in the stock array
function createPieces() {
	let pos = 0;
	for(let i = min; i <= max; i++) {
		pieceStock[pos] = new Piece(i,i);
		pos++;
		for(let j = i+1; j <= max; j++) {
			pieceStock[pos] = new Piece(i,j);
			pos++;
		}
	}
	
	pieces = 28;
}

function giveStartingPieces() {
	for(let i = 0; i < 7; i++) {
		givePieceToOponent();
	}
	for(let i = 0; i < 7; i++) {
		givePieceToPlayer();
	}
}

function givePieceToOponent() {
	let pos = Math.floor(Math.random() * pieces); // returns a random integer from 0 to 'pieces'
	piecePlayer2.push(pieceStock[pos]);
	pieceStock.splice(pos, 1);					  //removes element on index 'pos'
	pieces = pieces - 1;
}

function givePieceToPlayer() {
	let pos = Math.floor(Math.random() * pieces);
	piecePlayer1.push(pieceStock[pos]);
	pieceStock.splice(pos, 1);					
	pieces = pieces - 1;
}

//When playing human versus human
function addHumanPiece(newPiece) {
	let pos = piecePlayer1.length;
	let val1 = newPiece[0];
	let val2 = newPiece[1];
	
	piecePlayer1[pos] = new Piece(val1, val2);
}

function clearArrayPieces() {
	piecePlayer1.splice(0,piecePlayer1.length);
	piecePlayer2.splice(0,piecePlayer2.length);
	pieceStock.splice(0,pieceStock.length);
}

function pass() {
	if(turn == 1) {
		if(pieceStock.length==0) {
			playComputer();
		}
	}
}

function quit() {
	if(inGame == false) {
		return;
	}
	
	//Human versus computer
	if(oponentPlayer == 0) {
		computerPoints = computerPoints + 1;
		document.getElementById("message").innerHTML = "Você desistiu. Computador venceu o jogo";
		//document.getElementById("scoreTableComputerPoints").innerHTML = computerPoints;
	}
	
	//Human versus human
	if(oponentPlayer == 1) {
		leave();
	}
	
	endGame();
}

function doLogout() {
	if(inGame == false) {
		return;
	}
	leave();
	endGame();
	computerPoints = 0;
	playerPoints = 0;
	turn = 1;
	pieces = 28;
	inGame = false;
}
