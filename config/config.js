var path = require('path');
var extend = require('extend');
var fs = require('fs');
var installConfig;

var configPath = path.join(__dirname,'/../config/');
var dir = fs.readdirSync(configPath);
dir.forEach(function(file)
{
    if(file==='installConfig.js')
    {
        installConfig = require('./installConfig');
    }
});

var certPath = path.join(process.env.programdata, '/Qlik/Sense/Repository/Exported Certificates/.Local Certificates');
var routePath = path.join(__dirname, 'server/routes/');
var publicPath = path.join(__dirname, 'public/');
var logPath = path.join(__dirname,'/../log/');
var utilsPath = path.join(__dirname, '/../utils/');

var logFile = logPath + 'qsticketepicmodule.log';

var globalHostname = "localhost";
var friendlyHostname;
var qrsHostname;
var qpsHostname;
var certPathBackup;

if(certPathBackup !== undefined)
{
	certPath = certPathBackup;
} 

var config = {
    certificates: {
        certPath: certPath,
		client: path.resolve(certPath, 'client.pem'),
		client_key: path.resolve(certPath,'client_key.pem'),
		server: path.resolve(certPath, 'server.pem'),
		server_key: path.resolve(certPath, 'server_key.pem'),
		root: path.resolve(certPath,'root.pem')
    },
    logging: {
		logPath: logPath,
		logFile: logFile,
		logLevel: 'info'
	},
    thisServer: {
        allowedConnections: '*',
        port: 3001,
        hostname: friendlyHostname !== undefined ? friendlyHostname : globalHostname,
        userDirectory: 'epic',
        sharedSecret: 'secret',
        handshake: 'secret',
        routePath: routePath,
        publicPath: publicPath,
        logPath: logPath,
        logFile: logFile,
        utilsPath: utilsPath
    },
    qrs: {
		hostname: qrsHostname !== undefined ? qrsHostname : globalHostname
	},
    proxy:
    {
        hostname: qpsHostname !== undefined ? qpsHostname : globalHostname,
        virtualProxy: 'epic',
    }
};


if(friendlyHostname !==undefined || qrsHostname !== undefined || certPathBackup !== undefined || qpsHostname !==undefined)
{
	var mergedConfig = config;
}
else if(installConfig !== undefined)
{
	var mergedConfig = extend(true, config, installConfig);
}
else
{
	var mergedConfig = config;
}

module.exports = mergedConfig;