const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Payload } =require("dialogflow-fulfillment");
const app = express();

const MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var randomstring = require("randomstring"); 
var user_name="";

app.post("/dialogflow", express.json(), (req, res) => {
    const agent = new WebhookClient({ 
		      request:req, response:res 
		});


async function identify_user(agent)
{
  const phone = agent.parameters.phone;
  const client = new MongoClient(url);
  await client.connect();
  const snap = await client.db("chatbot").collection("userdetails").findOne({"phone":phone});
  if(snap==null){
    await agent.add("Please try again if you are a registered user");
    await agent.add("If not a registered user, Please head to our main page to register to one of our services");

  }
  else
  {
  user_name=snap.user;
  await agent.add("Welcome  "+user_name+ "!!  \n How can I help you?");}
}

function report_issue(agent)
{
 
  var issue_vals={1:"Broadband plan details and update plan",2:"Slow Internet",3:"Buffering problem",4:"No connectivity",5:"Router Problem",6:"Other"};
  
  const intent_val=agent.parameters.issue_num;
  
  var val=issue_vals[intent_val];
  
  var trouble_ticket=randomstring.generate(6);

  //Generating trouble ticket and storing it in Mongodb
  //Using randomstring module
  MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("chatbot");
    
	var u_name = user_name;    
    var issue_val=  val; 
    var status="pending";

	let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();

    var time_date=year + "-" + month + "-" + date;

	var myobj = { username:u_name, issue:issue_val,status:status,time_date:time_date,trouble_ticket:trouble_ticket };
  if(intent_val==5 || intent_val==4 || intent_val==3 || intent_val==2 ){
    dbo.collection("issues").insertOne(myobj, function(err, res) {
    if (err) throw err;
    db.close();    
  });
}
 });
 if(intent_val<7){
  if(intent_val==6){
    agent.add("Please follow the following steps for other questons: \n1.Head to our Home page\n2.Select on Help Center\n3.Click on FAQ's\n4.Search for your related query");
  }
  else{
    if(intent_val==1){
      agent.add("Please follow the following steps: \n1.Head to our main page\n2.Click on My Account\n3.Select View Broadband plan\n4.Select on update to update your plan");
    }
    else{
      if(intent_val==5 || intent_val==4 || intent_val==3 || intent_val==2 ){
        agent.add("The issue reported is: "+ val +"\nThe ticket number is: "+trouble_ticket);
        agent.add("We will get back to you within the next 48 hours");
        agent.add("Please use the ticket number mentioned for further enquiries on the mentioned issue");
      }
    }
  }
 }
 else{
  agent.add("Please enter one of the above mentioned issues");
  }
}

//trying to load rich response
function custom_payload(agent)
{
	var payLoadData=
		{
  "richContent": [
    [
      {
        "type": "list",
        "title": "Broadband plan details and update",
        "subtitle": "Enter '1' for Broadband plan details",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "Slow Internet",
        "subtitle": "Enter '2' Slow Internet",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
	  {
        "type": "divider"
      },
	  {
        "type": "list",
        "title": "Buffering problem",
        "subtitle": "Enter '3' for Buffering problem",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "No connectivity",
        "subtitle": "Enter '4' for No connectivity",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "Router problem",
        "subtitle": "Enter '5' for Router problem",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "Other",
        "subtitle": "Enter '6' ",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      }
    ]
  ]
}
agent.add(new Payload(agent.UNSPECIFIED,payLoadData,{sendAsMessage:true, rawPayload:true }));
}

var intentMap = new Map();
intentMap.set("service_intent", identify_user);
intentMap.set("service_intent - custom - custom", report_issue);
intentMap.set("service_intent - custom", custom_payload);

agent.handleRequest(intentMap);

})
app.get('/dialogflow', (req, res) => res.send('Running'));
app.listen(process.env.PORT || 8000);
console.log("listening...");

