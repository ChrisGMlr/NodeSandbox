var fs = require('fs');
var GoogleSpreadsheet = require("google-spreadsheet");
var my_sheet = new GoogleSpreadsheet('1ow9_wzWVvHA0p_0OeHxwUqX82b22wWGBkLwOJk-03ck');

my_sheet.getRows(1, function(err, row_data) {
	console.log(row_data[0]);
});
// var OAuth2 = google.auth.OAuth2;

// var config = JSON.parse(fs.readFileSync('config.json'));
// var oauth2Client = new auth.OAuth2(config.default.clientID, config.default.clientSecret, 'urn:ietf:wg:oauth:2.0:oob');