var http = require('http');

var seojs = module.exports = function(tok) {

    if ((typeof(tok) != 'string') && (typeof(tok) != 'undefined')) {
        throw("You must initialize express-seojs with a secret API key. For details see: https://github.com/seojs/express-seojs#readme");
    }

    var token = tok || process.env.SEOJS_TOKEN;

    function shouldForward(req) {
        return !(req.param('_escaped_fragment_') === undefined);
    }

    function getSnapshotServer(){
        if (token) {
            return 'http://cdn.getseojs.com/snapshots/' + token + '/v3';
        } else if (process.env.SEOJS_URL) {
            return process.env.SEOJS_URL + '/v3';
        } else {
            return null;
        }
    }

    function getSnapshotUrl(req) {
        var snapshotServer = getSnapshotServer();
        var url = req.protocol + '://' + req.get('host') + req.url;
        return snapshotServer + '/' + url;
    }

    function getSnapshot(snapshotUrl, outResponse, next) {
        http.get(snapshotUrl, function(inResponse) {

            if(inResponse && inResponse.statusCode == 200) {
                outResponse.writeHead(inResponse.statusCode, inResponse.headers);

                inResponse.on('data', function (data) {
                    outResponse.write(data);
                });
                inResponse.on('end', function(){
                    outResponse.end();
                });
            } else {
                next();
            }
        }).on('error', function(e) {
            next();
        });
    }

    function isEnabled(){
        return !!(token || process.env.SEOJS_URL);
    }


    // During initialization of the module:

    if (!isEnabled()) {
        console.log("Not using express-seojs! Please set the SEOJS_TOKEN environment variable to use it.\n--- For details see: https://github.com/seojs/express-seojs#readme");
    }

    return function(req, res, next) {
        if (isEnabled() && shouldForward(req)) {
            getSnapshot(getSnapshotUrl(req), res, next);
        } else {
            return next();
        }
    }
}