var config = require('config');
var request = require('request');
var async = require('async');

var userNsid = '96303877@N06';

var q = async.queue(function (task, callback) {

    var photo = task.photo;
    var url = 'https://www.flickr.com/photos/' + userNsid + '/' + photo.id + '/play/orig/' + photo.originalsecret + '/';

    request({
    	method: 'HEAD',
    	url: url,
    	followRedirect: false
    }, function (err, response, body) {

		console.log('curl -o ' + photo.id + '.mp4 "' + response.headers.location + '"');
		callback();

    });

}, 8);

function getPage(page) {

	request.get({
		url: 'https://api.flickr.com/services/rest',
		oauth: {
			consumer_key: config.api_key,
			consumer_secret: config.api_secret,
			token: config.access_token,
			token_secret: config.access_token_secret
		},
		json: true,
		qs: {
			format: 'json',
			nojsoncallback: 1,
			method: 'flickr.photos.search',
			user_id: userNsid,
			per_page: 500,
			page: page,
			extras: 'media, original_format'
		}
	}, function(err, response, body) {

		if (response.statusCode === 200 && body && body.stat === 'ok') {

			if (body.photos.page < body.photos.pages) {
				getPage(body.photos.page + 1);
			}

			body.photos.photo.forEach(function (photo) {

    			if (photo && photo.media === 'video' && photo.media_status === 'ready') {
					q.push({photo: photo});
    			}

			});

		}

	});

}

getPage(1);
