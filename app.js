console.log('Node version = ' + process.version);
var express = require('express');
var path = require('path');
var bodyParser = require("body-parser");

var app = express();

app.set('view engine', 'ejs')

app.set('port', process.env.PORT || 3000);

//app.use(express.static("public"));
app.use(express.static(path.join(__dirname,'public')));
app.use(bodyParser.urlencoded({ extended: true }));

//INSECURE
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var request = require('request');

var service_path = 'https://ibm-watson-ml.mybluemix.net'
var username = '4be82790-d71b-4c9f-ac4e-5af3c4b9c9b1'
var password = '47571902-8632-47e8-9590-323f49975136'
var token_path = '/v3/identity/token'


function tokenGet(username, password, service_path, token_path, loadCallback, errorCallback){
  request({
    method: "GET",
    url: service_path + token_path,
    auth: {
      'user': username,
      'pass': password
      }
    },
    function(error, response, body){
      console.log('error:', error); // Print the error if one occurred 
      console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
      // console.log('result:', body);
      var token = JSON.parse(body).token;
      console.log('TOKEN = ' + token);
      loadCallback(token);
    });
}



function score(scoring_url, token, payload, loadCallback, errorCallback){
  request({
    method: "POST",
    headers: {'Content-Type': 'application/json', 'Authorization': token},
    url: service_path + scoring_url,
    body: JSON.stringify(payload)
    //body: payload
    },
    function(error, response, body){
      console.log('error:', error); // Print the error if one occurred
      console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      console.log('result:', body);

      var scoreResponse = JSON.parse(body);
      // console.log(scoreResponse);
      // console.log('probability = ' + scoreResponse["result"]["probability"]["values"][0]);
      loadCallback(scoreResponse);
    }, function (error) {
      console.log(error);
    });
}

// tokenGet(service_path, username, password, token_path)



app.get('/', function(req, res){
  res.render('input');
});

app.post('/', function (req, res) {
  RETIRE = Number(req.body.RETIRE)
  MORTGAGE = req.body.MORTGAGE
  LOC = req.body.LOC
  GENDER = req.body.GENDER
  CHILDREN = req.body.CHILDREN
  WORKING = req.body.WORKING
  HighMonVal = req.body.HighMonVal
  AgeRange = req.body.AgeRange
  Frequency_score = Number(req.body.Frequency_score)

  //console.log(typeof RETIRE);
  //console.log(payload)

tokenGet(username, password, service_path, token_path,
    function (token) {
      //console.log(token);

      var wmlToken = "Bearer " + token;

      var payload =   
        {
          "fields": [
            "Retire",
            "Mortgage",
            "LOC",
            "GENDER",
            "CHILDREN",
            "WORKING",
            "HighMonVal",
            "AgeRange",
            "Frequency_score"
          ],
          "values": [
            [
              RETIRE,
              MORTGAGE,
              LOC,
              GENDER,
              CHILDREN,
              WORKING,
              HighMonVal,
              AgeRange,
              Frequency_score
            ]
          ]
        };


      var scoring_url = "/v3/wml_instances/d360e86c-6ddd-45f7-a908-d1ebf83a211d/deployments/bc639f91-8694-489b-8517-d7d3dcde368d/online";

      score(scoring_url, wmlToken, payload, function (scoreResponse) {
              prediction = scoreResponse.values[0][0];
              probability = scoreResponse.values[0][1][0];
              res.send(scoreResponse);
              console.log(prediction);
              console.log(probability);
              // res.render("index", { scoreResponse: scoreResponse, prediction:prediction, probability: probability })
      }, function (error) {
        console.log(error);
      });

    }, function (err) {
      console.log(err);
    });

});


app.listen(app.get('port'), function(){
  console.log('Express started on port' + app.get('port') + ' press Ctrl-C to terminate');
});
