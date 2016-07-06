var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var parseUrlencoded = bodyParser.urlencoded({extended: false});
var winston = require('winston');
var config = require('../config/config');
var fs = require('fs');
var https= require('https');
var cryptoJs = require("crypto-js");

//set up logging
var logger = new (winston.Logger)({
	level: config.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logFile})
    ]
});

router.use(function(req,res,next){
	res.header("Access-Control-Allow-Origin", config.allowedConnections);
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

router.route('/')
.get(function(request, response)
{
    logger.info('Someone attempted to go to Qlik Sense first on this proxy', {module: 'routes.js.defaultRoute'});
    res.set('Content-Type', 'text/html');
    res.status(403).send('<h1>You have accessed this proxy improperly.</h1>');
});

router.route('/openDoc')
.get(function(request, response)
{
    var docId = request.query.iDocId;
    var redirectURI = 'https://' + config.destinationHostname + '/' + config.virtualProxy + '/sense/app/' + docID;
    response.redirect(redirectURI);
});

router.route('/login')
.get(function(request, response)
{
    logger.debug('default route called', {module: 'routes.js.login'});
    var token = decodeURIComponent(request.query.token);
    logger.debug('token supplied by dll:' + token, {module: 'routes.js.login'});
    var userDirectory = config.userDirectory;

    var bytes  = cryptoJs.AES.decrypt(token, config.sharedSecret);
    var decryptedData = bytes.toString(cryptoJs.enc.Utf8);

    var userId = decryptedData.split("|");

    if(userId[1] === config.handshake)
    {
        logger.info("Login user: " + userId[0] + ", Directory: " + userDirectory, 
        {module: 'routes.js.login'});

        requestticket(request, response, userId[0], userDirectory);
    }
    else
    {
        logger.error('Failed. Incorrect Handshake');
        logger.info('Someone attempted to go to Qlik Sense first on this proxy', {module: 'routes.js.defaultRoute'});
        response.set('Content-Type', 'text/html');
        response.status(403).send('<h1>You have accessed this proxy improperly.</h1>');
    }
});

router.route('/logout')
.get(function (request, response) {
	var selectedUser = request.query.userId;
    var userDirectory = config.userDirectory;
    
    logger.info("logout user: " + selectedUser + ", Directory: " + userDirectory, 
    {module: 'routes.js.logout'});
   
	logout(request,response,selectedUser,userDirectory);
	request.session.destroy();
});

//Supporting functions
function rand(length, current) {
  current = current ? current : '';
  return length ? rand(--length, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz".charAt(Math.floor(Math.random() * 60)) + current) : current;
}

function requestticket(req, res, selecteduser, userdirectory) {
    //Configure parameters for the ticket request
    
    var XRFKEY = rand(16);
    
    var options = {
        host: config.proxyHostname,
        port: config.qpsPort,
        path: 'https://' + config.proxyHostname + ':' + config.qpsPort + '/qps/' 
            + config.virtualProxy + '/ticket?xrfkey=' + XRFKEY,
        method: 'POST',
        headers: { 'X-qlik-xrfkey': XRFKEY, 'Content-Type': 'application/json' },
		cert: fs.readFileSync(config.certificates.client),
        key: fs.readFileSync(config.certificates.client_key),
		rejectUnauthorized: false,
        agent: false
    };

    logger.debug('REST API Path: ' + options.path.toString(), 
        {module: 'routes.js.requestticket'});
	
    //Send ticket request
    var ticketreq = https.request(options, function (ticketres) {
        logger.debug("Response status Code: ", ticketres.statusCode, 
        {module: 'routes.js.requestticket'});
        
        ticketres.on('data', function (d) {
            //Parse ticket response
            logger.debug(selecteduser +  " is logged in", {module: 'routes.js.requestticket'});
			logger.debug("POST Response:" +  d.toString(), {module: 'routes.js.requestticket'});
					
            var ticket = JSON.parse(d.toString());
			var redirectURI = 'https://' + config.destinationHostname + '/' + config.virtualProxy 
                + '/hub?qlikticket=' + ticket.Ticket; 
            
            logger.debug('redirecting to: ' + redirectURI, {module: 'routes.js.requestticket'});
            res.redirect(redirectURI);
        });
    });

    //Send JSON request for ticket
    var jsonrequest = JSON.stringify({ 'UserDirectory': userdirectory.toString() , 'UserId': selecteduser.toString(), 'Attributes': [] });

    ticketreq.write(jsonrequest);
    ticketreq.end();

    ticketreq.on('error', function (e) {
        console.error('Error' + e);
    });
}

module.exports = router;