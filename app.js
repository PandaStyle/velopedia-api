var Hapi = require('hapi');
var Good = require('good');
var async = require('async');
var feed = require('feed-read');
var _ = require('lodash');
var moment = require('moment');
var request = require('request');

var tumblr = require('./modules/tumblr');
var strava = require('strava-v3');


var RIVER_URL = "https://river.velopedia.co/";



// Create a server with a host and port
var server = new Hapi.Server();
server.connection({
    port: 8081,
    routes: {
        cors: true
    }
});



server.route({
    method: 'GET',
    path:'/inspiration/{offset}/{size}',
    handler: function (request, reply) {

        var offset = request.params.offset,
            limit = request.params.size;

        tumblr.getPosts(offset, limit, function(err, res){
            if(err){
                throw err;
                reply(err);
            }

            reply(res);
        })
    }
});



server.route({
    method: 'GET',
    path:'/strava/activities',
    handler: function (request, reply) {
        strava.activities.listFriends({'access_token': request.state.strava_access_token},function(err,payload) {
            if(!err) {
                reply(payload);
            }
            else {
                console.error(err);
                throw err;
            }
        });
    }
});


server.route({
    method: 'GET',
    path:'/news',
    handler: function (req, reply) {
        request(RIVER_URL + "getfeed" , {json: true}, function (error, response, body) {
            if (error) {
                throw error
                reply(error)
            }

           reply(body);
        })
    }
});

server.route({
    method: 'GET',
    path:'/ping',
    handler: function (request, reply) {
        reply("pong hahaha");
    }
});


server.register({
    register: Good,
    options: {
        reporters: [{
            reporter: require('good-console'),
            events: {
                response: '*',
                log: '*'
            }
        }]
    }
}, function (err) {
    if (err) {
        throw err; // something bad happened loading the plugin
    }

    server.start(function () {
        server.log('info', 'Server running at: ' + server.info.uri);
    });
});
