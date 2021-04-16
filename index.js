"use strict";

const PORT = 8164; //Group 64

const http = require('http');
const url = require('url');

const config = require('./modules/config.js');

const server = http.createServer(function(request, response){
	
	const parsedUrl = url.parse(request.url,true); 
	const pathname = parsedUrl.pathname;
	
	if(request.method == 'GET') {
		switch(pathname) {
			case '/update':
				config.update(parsedUrl.query,request,response);
				break;
			default:
				response.writeHead(404);
				response.end();  
		}
	}
	
	else if(request.method == 'POST') {
		let body = '';
		request
			.on('data', (chunk) => { body += chunk; }) 
			.on('end', () => {
				var query;
				
				try { query = JSON.parse(body); }
				catch(err) {}
				
				switch(pathname) {
					case '/register':
						config.register(query,response);
						break;
					case '/join':
						config.join(query,response);
						break;
					case '/leave':
						config.leave(query,response);
						break;
					case '/notify':
						/* Not implemented */
						response.writeHead(404);
						response.end(); 
						break;
					case '/ranking':
						config.ranking(response);
						break;
					default:
						response.writeHead(404);
						response.end();  	
				}
			})
			.on('error', (err) => { console.log(err.message); });
	}
	else {
		response.writeHead(404);
		response.end();  
	}
});

server.timeout = 100 * 1000;
server.listen(PORT);
