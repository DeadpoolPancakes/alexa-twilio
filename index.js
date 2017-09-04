'use strict';

const Alexa = require('alexa-sdk');
const qs = require('querystring');
const https = require('https');

const APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

const languageStrings = {
    'en-GB': {
        translation: {
            SKILL_NAME: 'alexa twilio',
            WELCOME_MESSAGE:'Hello, You can ask me to send a text to a predefined contact',
            DISPLAY_CARD_TITLE: "Alexa Twilio",
            HELP_MESSAGE: 'If you tell me your message i can send it via text',
            HELP_REPROMPT: 'Im sorry could you please repeat that?',
            STOP_MESSAGE: 'Goodbye',
        }
    }
};

const handlers = {
    'LaunchRequest': function () {
        this.attributes['speechOutput'] = this.t("WELCOME_MESSAGE", this.t("SKILL_NAME"));
        // If the user either does not reply to the welcome message or says something that is not
        // understood, they will be prompted again with this text.
        this.attributes['repromptSpeech'] = this.t("WELCOME_REPROMPT");
        this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech'])
    },
    'MessageIntent': function () {
        this.emit('SendSms');
    },
    'SendSms': function () {
        var itemSlot = this.event.request.intent.slots.reason;
        var itemName;
        if (itemSlot && itemSlot.value) {
            //doesnt need to be converted to lowercase
            itemName = itemSlot.value.toLowerCase();
        }

        // Create the api call to send to twilio
        var req;
        var post_options = {
        method: 'POST',
        hostname: 'api.twilio.com',
        port: '443',
        path: '/2010-04-01/Accounts/"account id here"/Messages.json',
        //authorization is your username and api token base64 encoded
        headers: {
            'authorization': 'basic "base64 encoded username and password here"',
            'content-type': 'application/x-www-form-urlencoded',
        }};
        const postData = qs.stringify(
            { 
                From: '',
                To: '',
                Body: itemName
            } 
        )
        //leaving console logs in as they are useful to check that everything is running and can be seen on the cloudwatch for aws
        var post_req = https.request(post_options, res => {
            var returnData = '';
            var response = '';
            res.on('data', function (chunk) {
                returnData += chunk;
                //console.log('response' + chunk)
            });
            res.on('end', () => {
            response = JSON.parse(returnData);
            //replace i and am so the response sounds more natural
            itemName = itemName.replace('i', 'you');
            itemName = itemName.replace('am', 'are');
            var cardTitle = this.t("DISPLAY_CARD_TITLE", this.t("SKILL_NAME"), itemName);
            const speechOutput = 'Your message ' + itemName + ' has been sent';
            this.emit(':tellWithCard', speechOutput, cardTitle, speechOutput, itemName);
            //console.log('end' + response);

        });
        //console.log('message sent');
    })
        //console.log(post_req);
        post_req.write(postData);
        //console.log(postData);
        post_req.end();
        //console.log("request ended");

    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};