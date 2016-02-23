var Hapi = require('hapi');
var Good = require('good');
var async = require('async');
var feed = require('feed-read');
var _ = require('lodash');
var moment = require('moment');


var tumblr = require('./modules/tumblr');


// Create a server with a host and port
var server = new Hapi.Server();
server.connection({
    port: 8081
});



server.route({
    method: 'GET',
    path:'/getposts/{offset}/{size}',
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
    path:'/ping',
    handler: function (request, reply) {
        reply("pong");
    }
});

// Add the route
server.route({
    method: 'GET',
    path:'/getnews',
    handler: function (request, reply) {
        async.map(rssUrls, function (i, callback) {
            feed(i, callback);
        }, function (err, result) {
            if (err) {
                // Somewhere, something went wrong…
            }
            var res = _.map(_.flattenDeep(result), function(item){
                return {
                    title: item.title,
                    link: item.link,
                    date: item.published,
                    feed: item.feed,
                    diff: moment.duration(moment().diff(moment(new Date(item.published)))).humanize()
                }
            });

            reply(_.sortByOrder(res, function(item) {return new Date(item.date);}, ['desc']));

        });
    }
});

server.route({
    method: 'GET',
    path:'/ext/{param*}',
    handler: {
        directory: {
            path: 'ext'
        }
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
