var path = require('path');
var extend = require('extend');

var certPath = 'C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates';
var routePath = path.join(__dirname, 'server/routes/');
var publicPath = path.join(__dirname, 'public/');
var logPath = path.join(__dirname,'/../log/');

var logFile = logPath + 'qsticketepicmodule.log';

var config = extend(true, {
    serverPort: 3001,
    qpsPort: 4243,
    hostname: 'senseServerName',
    virtualProxy: 'epic',
    allowedConnections: 'domainOfEpicsystems',
    userDirectory: 'epic',
    certificates: {
        client: path.resolve(certPath, 'client.pem'),
		client_key: path.resolve(certPath,'client_key.pem'),
		server: path.resolve(certPath, 'server.pem'),
		server_key: path.resolve(certPath, 'server_key.pem'),
		root: path.resolve(certPath,'root.pem')
	},
    routePath: routePath,
    publicPath: publicPath,
    logPath: logPath,
    logFile: logFile,
    logLevel: 'debug'
});

module.exports = config;