const express = require('express');
const twilio = require('twilio');
const MessagingResponse = twilio.twiml.MessagingResponse;
const bodyParser = require('body-parser');
const request = require('request');

const {Stitch, AnonymousCredential} = require('mongodb-stitch-server-sdk');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());       // to support JSON-encoded bodies

const attributeSet = new Set(["character_name", "class", "level", "background", "player_name", "race", "alignment",
	"strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma",
	"inspiration", "proficiency_bonus", "passive_wisdom",
	"saving_throw_strength", "saving_throw_dexterity", "saving_throw_constitution", "saving_throw_intelligence", "saving_throw_wisdom", "saving_throw_charisma",
   	"acrobatics", "animal_handling", "arcana", "athletics", "deception", "history", "insight", "intimidation", "investigation", "medicine", "nature", "perception", "performance", "persuasion", "religion", "sleight_of_hand", "stealth", "survival",
   	"armour_class", "initiative", "speed", "hit_points",
   	"CP", "SP", "EP", "GP", "PP",
   	"personality_traits", "ideals", "bonds", "flaws", "attacks_and_spellcasting", "other_proficiencies_and_languages", "equipment", "features_and_traits"
]);

const characterObject = {
	"character_name": "",
    "class": "",
    "level": "",
    "background": "",
    "player_name": "",
    "race": "",
    "alignment": "",
    "strength": "",
    "dexterity": "",
    "constitution": "",
    "intelligence": "",
    "wisdom": "",
    "charisma": "",
    "inspiration": "",
    "proficiency_bonus": "",
    "passive_wisdom": "",
    "saving_throw_strength": "",
    "saving_throw_dexterity_": "",
    "saving_throw_constitution": "",
    "saving_throw_intelligence": "",
    "saving_throw_wisdom": "",
    "saving_throw_charisma": "",
    "acrobatics": "",
    "animal_handling": "",
    "arcana": "",
    "athletics": "",
    "deception": "",
    "history": "",
    "insight": "",
    "intimidation": "",
    "investigation": "",
    "medicine": "",
    "nature": "",
    "perception": "",
    "performance": "",
    "persuasion": "",
    "religion": "",
    "sleight_of_hand": "",
    "stealth": "",
    "survival": "",
    "armour_class": "",
    "initiative": "",
    "speed": "",
    "hit_points": "",
    "CP": "",
    "SP": "",
    "EP": "",
    "GP": "",
    "PP": "",
    "personality_traits": "",
    "ideals": "",
    "bonds": "",
    "flaws": "",
    "attacks_and_spellcasting": "",
    "other_proficiencies_and_languages": "",
    "equipment": "",
    "features_and_traits": ""
};

const attrbuteSetString = "character_name, class, level, background, player_name, race, alignment, strength, dexterity, constitution, intelligence, wisdom, charisma, inspiration, proficiency_bonus, passive_wisdom, saving_throw_strength, saving_throw_dexterity, saving_throw_constitution, saving_throw_intelligence, saving_throw_wisdom, saving_throw_charisma, acrobatics, animal_handling, arcana, athletics, deception, history, insight, intimidation, investigation, medicine, nature, perception, performance, persuasion, religion, sleight_of_hand, stealth, survival, armour_class, initiative, speed, hit_points, CP, SP, EP, GP, PP, personality_traits, ideals, bonds, flaws, attacks_and_spellcasting, other_proficiencies_and_languages, equipment, features_and_traits";

const helpString = "These are all of the commands:\n\n? (lists all the commands)\n\nlist characters (lists all the character names)\n\n'character_name' sheet (lists all the attributes and values of a character.)\n\ncreate 'character_name' (creates a new character sheet.)\n\nlist attributes (lists all mutable attributes.)\n\n'character_name' 'attribute'   (shows the value of that character's attribute)\n\nset 'character_name' 'attribute' 'value' (sets that character's attribute to that value.)";

// object that is inserted into db
var dbInsertObject = {};

// Twilio stuff
var accountSid = 'twilio-account-sid'; // Your Account SID from www.twilio.com/console
var authToken = 'twilio-auth-token';

var twilioSendMessage = function(message, req, res) {
	const twiml = new MessagingResponse();

	twiml.message(message);

	res.writeHead(200, {'Content-Type': 'text/xml'});
	res.end(twiml.toString());
}

var twilioSendValue = async function(characterName, attribute, req, res) {
	dbClient.callFunction("getValue", [characterName, attribute]).then(result => {
		if (result === null) {
			twilioSendMessage("Go to the DnDsheets website to create " + characterName + "!", req, res);
		}
		else if (!attributeSet.has(attribute)) {
			twilioSendMessage(attribute + " is not a valid attribute. To see attributes text: list attributes", req, res);
		}
		else if (result[attribute] === "") {
			twilioSendMessage("This attribute is not set for " + characterName + ".", req, res);
		}
		else {
			twilioSendMessage(result[attribute], req, res);
		}
	});
}

var twilioUpdateValue = async function(characterName, attribute, value, req, res) {
	if (!attributeSet.has(attribute)) {
		twilioSendMessage(attribute + " is not a valid attribute. To see attributes text: list attributes", req, res);
	}
	else {
		dbClient.callFunction("updateAttribute", [characterName, attribute, value]).then(result => {
			console.log(result);
			if (result.matchedCount === 0) {
				twilioSendMessage("Go to the DnDsheets website to create " + characterName + "!", req, res);
			}
			else {
				twilioSendMessage("Update to " + characterName + " complete.", req, res);
			}
		});
	}
}

var twilioCreateCharacter = async function(characterName, req, res) {
		var characterNameObject = characterObject;
		characterNameObject.character_name = characterName;
		dbClient.callFunction("createCharacter", [characterNameObject]).then(result => {
			console.log(result);
			twilioSendMessage(characterName + " has been created!", req, res);
		});
}

var twilioSendCharacterSheet = async function(characterName, req, res) {
		// var characterNameObject = characterObject;
		// characterNameObject.character_name = characterName;
		dbClient.callFunction("getCharacterSheet", [characterName]).then(result => {
			console.log(result);
			if (result === null) {
				twilioSendMessage("Character doesn't exist.", req, res);
			}
			else {
				var temp = "";
				for (var key in result) {
					temp += key + ":     " + result[key]+'\n';
				}
				twilioSendMessage(temp, req, res);
			}
			return result;
		});
}

var populateCharacters = function(response) {
	characters = response;
}

async function getAllCharacterNames(callback) {
	dbClient.callFunction("getAllCharacters", []).then(result => {
			// console.log(result);
			callback(result);
			return result;
		});
}


var client = new twilio(accountSid, authToken);

var characters = [];
// Actual event listener
app.post('/sms', (req, res) => {
	var request = req.body.Body.trim().toLowerCase().split(" ");

	console.log(request);



	getAllCharacterNames(populateCharacters);

	if (request[0] === '?') {
		twilioSendMessage(helpString, req, res);
	}
	else if (request.length === 2 && request[0] === "create") { // Create character
		var characterName = request[1];
		twilioCreateCharacter(characterName, req, res);
	}
	else if (request.length === 2 && request[0] === "list" && request[1] === "attributes") { // list attributes
		twilioSendMessage(attrbuteSetString, req, res);
	}
	else if (request.length === 2 && request[0] === "list" && request[1] === "characters") { // list characters
		var temp = "";
		for (var i =0; i<characters.length; i++) {
			temp += (characters[i].character_name + "\n");
		}
		twilioSendMessage("The number of characters is " + characters.length + ":\n" + temp, req, res);
	}
	else if (request.length === 2 && request[1] === "sheet") {		// get character sheet
		var characterName = request[0];
		twilioSendCharacterSheet(characterName, req, res);
	}
	else if (request.length === 2) { 	// get attribute value
		var characterName = request[0];
		var attribute = request[1];
		twilioSendValue(characterName, attribute, req, res);
	}
	else if (request.length === 3) {	// error for creating characters
		twilioSendMessage("Character names cannot contain spaces or any other white space. Use _ for spaces.", req, res);
	}
	else if (request.length >= 4 && request[0] === "set") {	// set attributes
		var characterName = request[1];
		var attribute = request[2];
		var value = request.slice(3,request.length).join(' ');
		twilioUpdateValue(characterName, attribute, value, req, res);
	}
	else {														// default error message
		twilioSendValue("Command not recognized.", req, res);
	}
});

app.post('/receiveSMS', (req, res) => {
  console.log("Received request: /" + req.body.Body + "/");
  if(req.body.Body.toLowerCase() === '?') {
    const twiml = new MessagingResponse();
    twiml.message('Available Commands:\n1. List Characters');
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
  } else {
    res.send("Bye");
  }
});

// End of Twilio stuff

// Start of MangoDB

const dbClient = Stitch.initializeDefaultAppClient('mongodb-stitch-db');
dbClient.auth.loginWithCredential(new AnonymousCredential()).then(user => {
  // const mdb = dbClient.getServiceClient(RemoteMongoClient.factory, 'mongodb-atlas');
    // dbClient.close();

  // dbClient.callFunction("createCharacter", ["Hello world!"]).then(echoedResult => {
  // console.log(`Echoed result: ${echoedResult}`);
// })

}).catch(err => {
    console.log(err);
    dbClient.close();
})

dbClient.callFunction("getAllCharacters", []).then(result => {
	console.log(result);
	characters = result;
	return result;
});

app.post('/submitForm', (req, res) => {
  for(var key in req.body) {
  	if (key === "character_name") {
  		dbInsertObject[key] = req.body[key].split(' ').join('_').toLowerCase();
  	}
  	else {
  		dbInsertObject[key] = req.body[key];
  	}
  }

  dbClient.callFunction("createCharacter", [dbInsertObject]).then(result => {
    console.log(result);
  });

  res.redirect("https://carlschader.github.io/DnDsheets/");
  // res.send("Worked!");

});

app.get('/', (req, res) => {
  res.send("Hello world");
});


// Webhook Example
// app.get('/', (req, res) => {
//   console.log("Received text");
//   res.send('Hello World!');
// });


app.listen(port, () => console.log(`Example app listening on port ${port}!`));
