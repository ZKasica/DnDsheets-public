// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const {Stitch, AnonymousCredential} = require('mongodb-stitch-server-sdk');
const dbClient = Stitch.initializeDefaultAppClient('dndsheets-lukpd');

const attrbuteSetString = "character name, class, level, background, player name, race, alignment, strength, dexterity, constitution, intelligence, wisdom, charisma, inspiration, proficiency bonus, passive wisdom, saving throw strength, saving throw dexterity, saving throw constitution, saving throw intelligence, saving throw wisdom, saving throw charisma, acrobatics, animal handling, arcana, athletics, deception, history, insight, intimidation, investigation, medicine, nature, perception, performance, persuasion, religion, sleight of hand, stealth, survival, armour class, initiative, speed, hit points, CP, SP, EP, GP, PP, personality traits, ideals, bonds, flaws, attacks and spellcasting, other proficiencies and languages, equipment, features and traits";
 
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
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
}

function replaceSpaces(value) {
    return value.split(" ").join("_");
}

function replaceUnderscores(value) {
    return value.split("_").join(" ");
}

function createCharacter(agent) {
    var name = replaceSpaces(agent.parameters.characterName);
    
	var characterNameObject = characterObject;
	characterNameObject.character_name = name.toLowerCase();

   dbClient.auth.loginWithCredential(new AnonymousCredential()).then(user => {
        dbClient.callFunction("createCharacter", [characterNameObject]).then(result => {
            dbClient.close();
        }).catch(err => {
             dbClient.close();
        });
      
    }).catch(err => {
        console.log(err);
        dbClient.close();
    });
    
    agent.add("Ok I created a new character, " + replaceUnderscores(name));
}

function getCharacterMessage() {
    return dbClient.auth.loginWithCredential(new AnonymousCredential())
    .then(user => {
        return dbClient.callFunction("getAllCharacterNames", []);
    })
    .then(result => {
            dbClient.close();
            return result;
    })
    .then(result => {
        var string = "You have " + result.length + " saved characters: ";
        for(var i = 0; i < result.length; i++) {
            string += result[i].character_name;
            if(i == result.length - 2) {
                string += ",and";
            } else if(i < result.length - 2) {
                string += ", ";
            }
        }

        return string;
    })
    .catch(err => {
        dbClient.close();
        throw err;
    });
}

function getCharacters(agent)  {
    return getCharacterMessage().then((output) => {
       agent.add(output);
    }).catch((err) => {
        agent.add("Unable to get characters from MongoDB");
    });
}

function getCharacterAttributeMessage(characterName, attribute) {
    var newName = replaceSpaces(characterName.replace(" underscore ", "_"));
    var newAttr = replaceSpaces(attribute.replace(" underscore ", "_"));
    
    console.log("Get attribute for character: " + newName + " attribute: " + newAttr);

    
     return dbClient.auth.loginWithCredential(new AnonymousCredential())
    .then(user => {
        return dbClient.callFunction("getValue", [newName.toLowerCase(), newAttr.toLowerCase()]);
    })
    .then(result => {
        dbClient.close();
        return result;
    })
    .then(result => {
        var attributeValue = result[attribute];
        console.log("Attribute Value: " + attributeValue);
        return characterName + "'s " + attribute + " has value " + attributeValue;
    })
    .catch(err => {
        dbClient.close();
        throw err;
    });
}

function getAttribute(agent) {
    var name = replaceSpaces(agent.parameters.name);
    var attr = replaceSpaces(agent.parameters.attribute);
    
    console.log("Name: " + name + ", attr: " + attr);
    
    return getCharacterAttributeMessage(name, attr).then((output) => {
        agent.add(replaceUnderscores(output));
    }).catch((err) => {
        agent.add("Unable to get " + replaceUnderscores(name) + "'s " + replaceUnderscores(attr) + " attribute.");
    });
}

function listAttributes() {
    agent.add("Here is a list of attributes that are on the character sheet: " + replaceUnderscores(attrbuteSetString));
}

function changeCharacterAttribute(name, attr, newValue) {
     return dbClient.auth.loginWithCredential(new AnonymousCredential())
    .then(user => {
        return dbClient.callFunction("updateAttribute", [name, attr, newValue]);
    })
    .then(result => {
        dbClient.close();
        console.log("Result: " + result);
        return result;
    })
    .then(result => {
        return "Ok, I updated " + name + "'s attribute, " + attr + " to " + newValue;
    })
    .catch(err => {
        dbClient.close();
        throw err;
    });
}

function changeAttribute(agent) {
    var name = replaceSpaces(agent.parameters.characterName);
    var attr = replaceSpaces(agent.parameters.attribute);
    var newValue = replaceSpaces(agent.parameters.newValue);
    
    console.log("Change attribute: name: " + name + " attr: " + attr + " newValue: " + newValue);
    
    return changeCharacterAttribute(name, attr, newValue).then((output) => {
        agent.add(replaceUnderscores(output));
    }).catch((err) => {
        console.log("Error: " + err);
        agent.add("Unable to update " + replaceUnderscores(name) + "'s " + replaceUnderscores(attr) + " attribute.");
    });
}

function getAndSayCharacterSheet(name) {
    return dbClient.auth.loginWithCredential(new AnonymousCredential())
    .then(user => {
        return dbClient.callFunction("getCharacterSheet", [name]);
    })
    .then(result => {
        dbClient.close();
        return result;
    })
    .then(result => {
        var msg = "The character sheet for " + name + " contains the following values: ";
        
        for(var key in result) {
            if(result[key] !== "") {
                msg += replaceUnderscores(key) + ", " + replaceUnderscores(result[key]) + ". ";
            }
        }
       
        console.log(msg);
       
        return msg;
    })
    .catch(err => {
        dbClient.close();
        throw err;
    });
}

function sayCharacterSheet(agent) {
    var name = replaceSpaces(agent.parameters.characterName).toLowerCase();
    
    return getAndSayCharacterSheet(name).then((output) => {
        agent.add(replaceUnderscores(output));
    }).catch((err) => {
        console.log("Error: " + err);
        agent.add("Unable to print " + replaceUnderscores(name) + "'s character sheet");
    });
}

 
  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('CreateCharacter', createCharacter);
  intentMap.set('SayCharacters', getCharacters);
  intentMap.set('GetCharacterAttribute', getAttribute);
  intentMap.set('ListAttributes', listAttributes);
  intentMap.set('ChangeAttribute', changeAttribute);
  intentMap.set('SayCharacterSheet', sayCharacterSheet);

  agent.handleRequest(intentMap);
});
