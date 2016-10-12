
var qrsInteract = require('qrs-interact');
var config = require('../config/config');
var winston = require('winston');
var Promise = require('bluebird');

//set up logging
var logger = new (winston.Logger)({
	level: 'debug',
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logging.logFile})
    ]
});

var qrsConfig = {
    hostname: config.qrs.hostname,
    localCertPath: config.certificates.certPath
};

var qrs = new qrsInteract(qrsConfig);

var body = {
    "prefix": config.proxy.virtualProxy,
    "description": config.proxy.virtualProxy,
    "authenticationModuleRedirectUri":"https://" + config.thisServer.hostname + ":" + config.thisServer.port + "/",
    "sessionModuleBaseUri":"",
    "loadBalancingModuleBaseUri":"",
    "authenticationMethod":0,
    "anonymousAccessMode":0,
    "windowsAuthenticationEnabledDevicePattern":"Windows",
    "sessionCookieHeaderName":"X-Qlik-Session-" + config.proxy.virtualProxy,
    "sessionCookieDomain":"",
    "additionalResponseHeaders":"",
    "sessionInactivityTimeout":30,
    "extendedSecurityEnvironment":false,
    "websocketCrossOriginWhiteList":[config.thisServer.hostname],
    "defaultVirtualProxy":false,
    "tags":[]
};



function createVirtualProxy(body)
{
    var x ={};
    var path = "servernodeconfiguration";
    path +=  "?filter=name eq 'Central'";
    qrs.Get(path)
    .then(function(result)
    {
       logger.info('servicenodeconfiguration: ' + JSON.stringify(result), {module:'createVirtualProxy'}); 
       return result.body[0].id; 
    })
    .then(function(result)
    {
       
        logger.info('passed result id: '+ result, {module: 'createVirtualProxy'});
        var postPath =  "VirtualProxyConfig";
        postPath +=  "?privileges=true";

        if(result !== undefined)
        {
            body.loadBalancingServerNodes =
            [
                {
                    "id": result
                }
            ];
        }

        qrs.Post(postPath,body,'json')
        .then(function(result)
        {
            x.virtualProxy = JSON.parse(JSON.stringify(result.body));
            //logger.debug('Result from Server::' + JSON.stringify(JSON.parse(result)), {module: 'createVirtualProxy'});
            logger.info('Virtual Proxy created', {module: 'createVirtualProxy'});
            logger.debug('Virtual Proxy id: ' + x.virtualProxy.id, {module:'createVirtualProxy'});
            
        })
        .then(function()
        {
            //get the proxy to set link up virtualproxy
            var proxyPath = "proxyservice/local";
            logger.debug('proxyPath:: ' + proxyPath,{module: 'createVirtualProxy'});
            qrs.Get(proxyPath)
            .then(function(result)
            {
                x.proxyID = result.body.id;
                logger.debug('The proxy service id is: ' + result.body.id, {module: 'createVirtualProxy'});
                return result.body.id;
            })
            .then(function(proxyID)
            {
                var selectionPath = "selection";
                logger.debug('selectionPath::' + selectionPath, {module: 'createVirtualProxy'});
                var selectionBody = {
                    "items": [
                        {
                            "type": "ProxyService",
                            "objectID": proxyID
                        }
                    ]
                };
                logger.debug('selectionBody:' + JSON.stringify(selectionBody), {module: 'createVirtualProxy'});
                qrs.Post(selectionPath,selectionBody,'json')
                .then(function(result)
                {
                    x.Selection = JSON.parse(JSON.stringify(result.body));
                    logger.debug('selectionID::' + result.body.id, {module: 'createVirtualProxy'});
                    return x.Selection.id
                })
                .then(function(selectionID)
                {
                    var putPath = "selection";
                    putPath += "/" + selectionID + "/ProxyService/synthetic";
                    logger.debug('putPath::' + putPath, {module: 'createVirtualProxy'});
                    logger.debug('virtual proxy id::' + x.virtualProxy.id, {module:'createVirtualProxy'});
                    var putBody = {
                        "type":"ProxyService",
                        "children": [
                            {
                                "name":"settings",
                                "properties": [
                                    {
                                        "name": "refList_VirtualProxyConfig",
                                        "value": {
                                            "added": [
                                                x.virtualProxy.id
                                            ],
                                            "removed": []
                                        },
                                        "valueIsDifferent": false,
                                        "valueIsModified": true
                                    }],
                                "type":"ProxyService.Settings"
                            }],
                        "properties": [
                            {
                                "name":"serverNodeConfiguration",
                                "value": null,
                                "valueIsDifferent": false,
                                "valueIsModified": false
                            }],
                        "latestModifiedDate": buildModDate()      
                    };
                    qrs.Put(putPath,putBody)
                    .then(function()
                    {
                        logger.info('virtual proxy: ' + x.virtualProxy.id+ ' linked to proxy: ' + x.proxyID, {module: 'createVirtualProxy'});
                    })
                    .catch(function(error)
                    {
                       logger.error(error,{module: 'createVirtualProxy'}); 
                    });
                })
                .catch(function(error)
                {
                     logger.error(error,{module: 'createVirtualProxy'});
                });
            })
            .catch(function(error)
            {
                 logger.error(error,{module: 'createVirtualProxy'});
            })
        })
        .catch(function(error)
        {
             logger.error(error,{module: 'createVirtualProxy'});
           return error; 
        });
    })
    .catch(function(error)
    {
         logger.error(error,{module: 'createVirtualProxy'});
       return error;
    });    

    
}

function buildModDate()
{   
    var d = new Date();
    return d.toISOString();
}

createVirtualProxy(body);
