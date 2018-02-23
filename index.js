var express = require('express');
var app = express();
var url = require('url');
var request = require('request');

var format = ".json";

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//use port is set in the environment variable, or 9001 if it isn’t set.
app.set('port', (process.env.PORT || 9001));

//for testing that the app is running
app.get('/', function(req, res){
  res.send('Running!!');
});

//app.post is triggered when a POST request is sent to the URL ‘/post’
app.post('/post', function(req, res){
  //take a message from Slack slash command
  var query = req.body.text;

  var player_url = url.format({
    pathname: 'http://mlb.mlb.com//lookup/json/named.search_player_all.bam?sport_code=\'mlb\'&name_part=\'' + req.body.text + '\''
  });

  request(player_url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var data = JSON.parse(body);
      if(data.search_player_all.queryResults.row.player_id !== undefined) {
        var player_id = data.search_player_all.queryResults.row.player_id;
        var player_stats_url = 'http://mlb.mlb.com/lookup/json/named.sport_career_hitting.bam?league_list_id=\'mlb\'&game_type=\'R\'&player_id=\'' + player_id + '\'';
        if (player_stats_url) {
          request(player_stats_url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
              var stats = JSON.parse(body);
              var body = {
                response_type: "in_channel",
                "attachments": [
                  {
                    "text": stats.sport_career_hitting.queryResults.row.avg + ' | ' + stats.sport_career_hitting.queryResults.row.obp + ' | ' + stats.sport_career_hitting.queryResults.row.slg,
                  }
                ]
              };
              res.send(body);
            }
          });
        }
      } else {
        res.send('No results for that guy');
        return;
      }
    }
  });

});

//tells Node which port to listen on
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});