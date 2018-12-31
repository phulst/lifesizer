
function supportsWebStorage() {
    return
}


ImageRefCache = function(userId) {

}





function simpleAjax(options) {
    var dataStr = '';
    if (data) {
        for (var k in data) {
            dataStr = dataStr + k + "=" + encodeURI(data[k]) + "&";
        }
        dataStr.slice(0, -1);
    }
    var opts = {
        type:       options.type || 'GET', // supports 'GET' or 'POST'
        url:        options.url,
        data:       dataStr,
        success:    options.success,
        dataType:   options.dataType || 'text' // supports 'json', 'jsonp' or 'text'
    };
    // Create ajax request object
	var requestObject;
	try {
		requestObject = new XMLHttpRequest();
	}
	catch (e) {
		requestObject = new ActiveXObject('Microsoft.XMLHTTP');
	}
	// This runs when request is complete
	var onReadyStateChange = function () {
		if (requestObject.readyState == 4) {
            var d;
            if (opts.dataType == 'json') {
                // parse json
                d = eval('(' + requestObject.responseText + ')');
            } else {
                // handle as simple text
                d = requestObject.responseText;
            }
			success.callback();
		}
	};

    // Send the request
	if (config.method.toUpperCase() == 'POST') {
		requestObject.open('POST', opts.url, true);
		requestObject.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		requestObject.onreadystatechange = onReadyStateChange;
		requestObject.send(opts.data);
	}
	else {
        var fullUrl = opts.url + ((opts.data.length > 0) ? ('?'+opts.data) : '');
		requestObject.open('GET', fullUrls, true);
		requestObject.onreadystatechange = onReadyStateChange;
		requestObject.send(null);
	}
}

// By Andreas Lagerkvist (andreaslagerkvist.com)
function superSimpleAjax (conf, updateID) {
	// Create config
	var config = {
		method:		conf.method || 'get',
		url:		conf.url,
		data:		conf.data || '',
		callback:	conf.callback || function (data) {
			if (updateID) {
				document.getElementById(updateID).innerHTML = data;
			}
		}
	};

	// Create ajax request object
	var requestObject;

	try {
		requestObject = new XMLHttpRequest();
	}
	catch (e) {
		requestObject = new ActiveXObject('Microsoft.XMLHTTP');
	}

	// This runs when request is complete
	var onReadyStateChange = function () {
		if (requestObject.readyState == 4) {
			config.callback(requestObject.responseText);
		}
	};

	// Send the request
	if (config.method.toUpperCase() == 'POST') {
		requestObject.open('POST', config.url, true);
		requestObject.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		requestObject.onreadystatechange = onReadyStateChange;
		requestObject.send(config.data);
	}
	else {
		requestObject.open('GET', config.url + '?' + config.data, true);
		requestObject.onreadystatechange = onReadyStateChange;
		requestObject.send(null);
	}
}

/**
 * store image refs for given user in local cache
 * @param userId user id
 * @param refs array of image refs
 */
function storeUserImages(userId, refs) {
    var key = "user.Img_" + userId;
    localStorage[key] = refs.join(',');
}

function retrieveUserImages(userId) {
    return localStorage["userImg_" + userId];
}
