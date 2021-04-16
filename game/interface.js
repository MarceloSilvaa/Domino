function createSpaces() {
	createOponentSpaces();
	createPlayerSpaces();
	createStockSpaces();
	createBoardSpaces();
}

function createOponentSpaces() {
	var base = document.getElementById("oponentPieces");
	for(var col=0; col<21; col++) {
		var elem = document.createElement("div");
		elem.className = "oponentBoard";
		elem.id = "oponent" + col;
		base.appendChild(elem);
	}
}

function createPlayerSpaces() {
	var base = document.getElementById("playerPieces");
	for(var col=0; col<21; col++) {
		var elem = document.createElement("div");
		elem.className = "playerBoard";
		elem.id = "player" + col;
		elem.addEventListener('click',clickPiece);
		base.appendChild(elem);
	}
}

function createStockSpaces() {
	var base = document.getElementById("stockPieces");
	for(var col=0; col<14; col++) {
		var elem = document.createElement("div");
		elem.className = "stockBoard";
		elem.id = "stock" + col;
		base.appendChild(elem);
	}
}

function createBoardSpaces() {
	var base = document.getElementById("gameBoard");
	for(var col=0; col<boardNr; col++) {
		var elem = document.createElement("div");
		elem.className = "gameplayZone";
		elem.id = "game" + col;
		base.appendChild(elem);
	}
}

// Human versus Human

function displayPiecesBeforeStart() {
	for(var col=0; col<7; col++) {
		document.getElementById("oponent" + col).innerHTML = String.fromCodePoint(127024);
		document.getElementById("oponent" + col).style.opacity = "1.0";
	}
	for(var col=7; col<21; col++) {
		document.getElementById("oponent" + col).innerHTML = String.fromCodePoint(127024);
		document.getElementById("oponent" + col).style.opacity = "0.1";
	}
	
	for(var col=0; col<14; col++) {
		document.getElementById("stock" + col).innerHTML = String.fromCodePoint(127024);
		document.getElementById("stock" + col).style.opacity = "1.0";
	}
	
	displayBoardPieces();
	
	var message = document.getElementById("message");
	message.style.display = "block";
}

// Human versus Computer

function displayPieces() {
	displayOponentPieces();
	displayPlayerPieces();
	displayStockPieces();
	displayBoardPieces();
}

function displayOponentPieces() {
	for(var col=0; col<piecePlayer2.length; col++) {
		document.getElementById("oponent" + col).innerHTML = String.fromCodePoint(127024);
		document.getElementById("oponent" + col).style.opacity = "1.0";
	}
	for(var col=piecePlayer2.length; col<21; col++) {
		document.getElementById("oponent" + col).innerHTML = String.fromCodePoint(127024);
		document.getElementById("oponent" + col).style.opacity = "0.1";
	}
}

function displayPlayerPieces() {
	for(var col=0; col<piecePlayer1.length; col++) {
		document.getElementById("player" + col).innerHTML = piecePlayer1[col].horizontal1;
		document.getElementById("player" + col).style.opacity = "1.0";
	}
	for(var col=piecePlayer1.length; col<21; col++) {
		document.getElementById("player" + col).innerHTML = String.fromCodePoint(127024);
		document.getElementById("player" + col).style.opacity = "0.1";
	}
}

function displayStockPieces() {
	for(var col=0; col<pieceStock.length; col++) {
		document.getElementById("stock" + col).innerHTML = String.fromCodePoint(127024);
		document.getElementById("stock" + col).style.opacity = "1.0";
	}
	for(var col=pieceStock.length; col<14; col++) {
		document.getElementById("stock" + col).innerHTML = String.fromCodePoint(127024);
		document.getElementById("stock" + col).style.opacity = "0.1";
	}
}

function displayBoardPieces() {
	for(var col=0; col<boardNr; col++) {
		document.getElementById("game" + col).innerHTML = String.fromCodePoint(127024);
		document.getElementById("game" + col).style.opacity = "0.05";
	}
}

// Interface Show/Hide

function changeToGame() {
	clearAutentication();
	displayInformation();
}

function changeToAutentication() {
	clearInformation();
	clearConfiguration();
	clearInstruction();
	clearGameBoard();
	doLogout();
	displayAutentication();
}

function displayAutentication() {
	var aut = document.getElementsByClassName("autentication");
	var i;
	for (i = 0; i < aut.length; i++) {
		aut[i].style.display = "block";
	}
}

function clearAutentication() {
	var aut = document.getElementsByClassName("autentication");
	var i;
	for (i = 0; i < aut.length; i++) {
		aut[i].style.display = "none";
	}
	document.getElementById("inputUsername").value = "";
	document.getElementById("inputPassword").value = "";
}

function displayInformation() {
	//Logout + New Game + Instructions + Score Board
	var inf = document.getElementsByClassName("information");
	var i;
	for (i = 0; i < inf.length; i++) {
		inf[i].style.display = "block";
	}
	
	var title = document.getElementById("title");
	title.style.fontSize = "40px";
}

function clearInformation() {
	//Logout + New Game + Instructions + Score Board
	var inf = document.getElementsByClassName("information");
	var i;
	for (i = 0; i < inf.length; i++) {
		inf[i].style.display = "none";
	}
	
	//Pass + Quit
	var ctr = document.getElementsByClassName("gameControl");
	var i;
	for (i = 0; i < ctr.length; i++) {
		ctr[i].style.display = "none";
	}
	
	var title = document.getElementById("title");
	title.style.fontSize = "60px";
}

function displayConfiguration() {
	var cnf = document.getElementsByClassName("config");
	var i;
	for (i = 0; i < cnf.length; i++) {
		cnf[i].style.display = "block";
	}
	clearInstruction();
}

function clearConfiguration() {
	var cnf = document.getElementsByClassName("config");
	var i;
	for (i = 0; i < cnf.length; i++) {
		cnf[i].style.display = "none";
	}
}

function displayInstruction() {
	var inst = document.getElementsByClassName("instruction");
	var i;
	for (i = 0; i < inst.length; i++) {
		inst[i].style.display = "block";
	}
	clearConfiguration();
}

function clearInstruction() {
	var inst = document.getElementsByClassName("instruction");
	var i;
	for (i = 0; i < inst.length; i++) {
		inst[i].style.display = "none";
	}
}

function displayGameBoard() {
	var board = document.getElementsByClassName("gameZone");
	var i;
	for (i = 0; i < board.length; i++) {
		board[i].style.display = "block";
	}
	
	var ctr = document.getElementsByClassName("gameControl");
	var i;
	for (i = 0; i < ctr.length; i++) {
		ctr[i].style.display = "block";
	}
	
	var message = document.getElementById("message");
	message.style.display = "block";
}

function clearGameBoard() {
	var board = document.getElementsByClassName("gameZone");
	var i;
	for (i = 0; i < board.length; i++) {
		board[i].style.display = "none";
	}
	
	var ctr = document.getElementsByClassName("gameControl");
	var i;
	for (i = 0; i < ctr.length; i++) {
		ctr[i].style.display = "none";
	}
	
	var message = document.getElementById("message");
	message.style.display = "none";
	
	endGame();
}

