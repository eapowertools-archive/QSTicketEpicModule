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
	level: config.logging.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logging.logFile})
    ]
});

router.use(function(req,res,next){
	res.header("Access-Control-Allow-Origin", config.thisServer.allowedConnections);
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

router.param('path', function(req, res, next, id)
{
    console.log(req.path);
    next();
});

router.route('/iframe')
.get(function(request, response)
{
    // Acceptable path querystring parameters
    //  path = the path to redirect to (needs to be urlencoded so that querystring params for single objects may be passed)
    //  token = the token from Epic dll

    var path = buildPath(request.query);
    var userDirectory = config.userDirectory;

    // Decrypt token
    var iv = cryptoJs.enc.Hex.parse('00000000000000000000000000000000');
    var token = decodeURIComponent(request.query.token);
                logger.debug(token, {module: 'routes.js.iframe'});
                
                // Decrypt needs a word array for the key; parse() does the job here
    var bytes = cryptoJs.AES.decrypt(token, cryptoJs.enc.Utf8.parse(config.sharedSecret), { iv : iv } );    
    var decryptedData = bytes.toString(cryptoJs.enc.Utf8);

    // Get decrypted items: userid, handshake, and timestamp
    var decryptedItems = decryptedData.split("|");
    var userId = decryptedItems[0];
    var handshake = decryptedItems[1];
    logger.debug('token supplied by epic:' + token, {module: 'routes.js.iframe'});

    //check the handshake
    if ( handshake === config.handshake )
    {
            //good to go
            logger.info("Login user: " + userId + ", Directory: " + userDirectory, 
            {module: 'routes.js.iframe'});
    
            //requestticket(request, response, userId, userDirectory, '/hub/');
            requestticket(request, response, userId, userDirectory, path);
    }
    else
    {
            //failed because of time and handshake
            logger.error('Authentication failed: incorrect handshake.', {module: 'routes.js.iframe'});
            response.status(403).send('<h1>You have accessed this proxy improperly. Incorrect Handshake.</h1>');
    }              
});


router.route('/openDoc')
.get(function(request, response)
{
    var docId = request.query.iDocID;
    var redirectURI = 'https://' + config.thisServer.hostname + '/' + config.proxy.virtualProxy + '/sense/app/' + docId;
    response.redirect(redirectURI);
});

router.route('/login')
.get(function(request, response)
{
    logger.debug('default route called', {module: 'routes.js.login'});
    var token = decodeURIComponent(request.query.token);
    logger.debug('token supplied by dll:' + token, {module: 'routes.js.login'});
    var userDirectory = config.thisServer.userDirectory;

    var bytes  = cryptoJs.AES.decrypt(token, config.thisServer.sharedSecret);
    var decryptedData = bytes.toString(cryptoJs.enc.Utf8);

    var userId = decryptedData.split("|");

    if(userId[1] === config.thisServer.handshake)
    {
        logger.info("Login user: " + userId[0] + ", Directory: " + userDirectory, 
        {module: 'routes.js.login'});

        requestticket(request, response, userId[0], userDirectory, '/hub/');
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
    var userDirectory = config.thisServer.userDirectory;
    
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

function requestticket(req, res, selecteduser, userdirectory, destPath) {
    //Configure parameters for the ticket request
    
    var XRFKEY = rand(16);
    
    var options = {
        host: config.proxy.hostname,
        port: 4243,
        path: 'https://' + config.proxy.hostname + ':' + 4243 + '/qps/' 
            + config.proxy.virtualProxy + '/ticket?xrfkey=' + XRFKEY,
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
			var redirectURI = 'https://' + config.thisServer.hostname + '/' + config.proxy.virtualProxy 
                + destPath + (destPath.includes("?") ? "&" : "?") + 'qlikticket=' + ticket.Ticket; 
            
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


function buildPath(queryParams)
{
    var path;
    var pathArr = []
    for(var propName in queryParams)
    {
        if (queryParams.hasOwnProperty(propName))
        {
            if(propName == 'token')
            {
                //do nothing
            }
            else if(propName == 'path')
            {
                pathArr.unshift(propName + "=" + queryParams[propName]);
            }
            else
            {
                pathArr.push(propName + "=" + queryParams[propName]);
            }
        }
    }
    
    pathArr.forEach(function(item,index)
    {
        if(index==0)
        {
            var splitPath;
            splitPath = item.split("=");
            path = "/" + splitPath[1];
        }
        else if(index==1)
        {
            path += "?" + item;
        }
        else
        {
            path += "&" + item;
        }
    })
    return path;
}