var express = require('express');
var router = express.Router();
var request = require('request');
var fs = require('fs');

var APP_NAME = 'AddYourRepresentatives';

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {'title' : 'Add your Representatives'});
});

/* GET list of representatives and actions. */
router.get('/representatives', function(req, res, next) {
    var baseUrl = 'https://congress.api.sunlightfoundation.com/legislators/locate?zip=';
    var url = baseUrl + req.query.zip;
    request(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            var processedResults = processRepresentativeResults(data);
            res.send(processedResults);
        } else {
            // TODO: Handle the error.
        }
    });
})

function processRepresentativeResults(data) {
    var representativeData = {};
    var rawRepresentatives = sortRepresentativesByChamber(data['results']);
    var representatives = [];
    for (var rep of rawRepresentatives) {
        var repData = {}
        repData['display_name'] = formatRepresentativeName(rep);
        repData['bioguide_id'] = rep['bioguide_id'];
        repData['actions'] = getSiteActions(rep);
        repData['photo_url'] = formatPhotoUrl(rep);
        repData['display_party'] = formatDisplayParty(rep.party);
        repData['display_subtitle'] = formatDisplayTitle(rep);
        representatives.push(repData);
    }
    return representatives;
}

function sortRepresentativesByChamber(reps) {
    return reps.sort(function(rep1, rep2) {
        if (rep1.chamber < rep2.chamber) {
            return -1;
        } else if (rep1.chamber > rep2.chamber) {
            return 1;
        } else {
            return 0;
        }
    });
}

function formatRepresentativeName(representativeData) {
    return representativeData['title'] + '. ' + representativeData['first_name'] + ' ' + representativeData['last_name'];
}

function getSiteActions(representativeData) {
    var actions = [];

    var contactAction = {
        'name' : 'Add to Contacts',
        'link' : '/contact-card?id=' + representativeData['bioguide_id']
    };
    actions.push(contactAction);

    if (representativeData.twitter_id) {
        var twitterAction = {
            'name' : 'Follow on Twitter',
            'link' : 'https://twitter.com/intent/follow?screen_name=' + representativeData.twitter_id,
            'className' : 'twitter'
        };
        actions.push(twitterAction);
    }

    if (representativeData.facebook_id) {
        var facebookAction = {
            'name' : 'Like on Facebook',
            'link' : 'https://facebook.com/' + representativeData.facebook_id,
            'className' : 'facebook'
        };
        actions.push(facebookAction);
    }
    return actions;
}

function formatPhotoUrl(representativeData) {
    return 'https://theunitedstates.io/images/congress/225x275/' + representativeData['bioguide_id'] + '.jpg';
}

function formatDisplayParty(party) {
    if (party == 'D') {
        return 'Democratic Party';
    } else if (party == 'R') {
        return 'Republican Party';
    } else {
        return 'Independent';
    }
}

function formatDisplayTitle(representativeData) {
    if (representativeData.chamber == "senate") {
        return capitalize(representativeData.state_rank) + " Senator from " + representativeData.state_name
    } else {
        return "Representative from " + representativeData.state_name + ", District " + representativeData.district;
    }
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/* GET contact card given ID. */
router.get('/contact-card', function(req, res, next) {
    var vCard = require('vcards-js');

    var representativeId = req.query.id;
    var baseUrl = 'https://congress.api.sunlightfoundation.com/legislators?bioguide_id=';
    var url = baseUrl + representativeId;

    request(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            if (data.results.length > 0) {
                var repData = data.results[0];
                var repCard = generateVCardFromRepresentativeData(repData);

                var photoUrl = formatPhotoUrl(repData);
                downloadPhoto(photoUrl, 'temp.jpg', function() {
                    repCard.photo.embedFromFile('./temp.jpg');
                    repCard.logo.embedFromFile('./temp.jpg');
                    //set content-type and disposition including desired filename
                    var fileName = capitalize(repData.first_name) + capitalize(repData.last_name) + '.vcf'; 
                    res.set('Content-Type', 'text/x-vcard; name="' + fileName + '"');
                    res.set('Content-Disposition', 'attachment; filename="' + fileName + '"');

                    res.send(repCard.getFormattedString());
                });
            } else {
                // TODO: Show a 404 error here.
            }
        } else {
            // TODO: Handle the error.
        }
    });
});

function generateVCardFromRepresentativeData(representativeData) {
    var vCard = require('vcards-js');

    var card = vCard();
    card.firstName = representativeData.title + '. ' + representativeData.first_name;
    card.lastName = representativeData.last_name;
    card.organization = 'US ' + getFormattedChamber(representativeData.chamber);

    card.workPhone = representativeData.phone;
    card.url = representativeData.website;
    card.email = representativeData.oc_email;

    card.workAddress.label = representativeData.office;
    card.workAddress.street = representativeData.office;
    card.workAddress.city = 'Washington';
    card.workAddress.stateProvince = 'District of Columbia';

    card.note = generateContactNote(representativeData);
    
    if (representativeData.facebook_id) {
        card.socialUrls['facebook'] = 'https://facebook.com/' + representativeData.facebook_id;
    }
    if (representativeData.twitter_id) {
        card.socialUrls['twitter'] = 'https://twitter.com/@' + representativeData.twitter_id;
    }

    card.version = '3.0';

    return card;
}

function getFormattedChamber(chamber) {
    if (chamber == 'house') { 
        return 'House of Representatives';
    } else {
        return 'Senate';
    }
}

function generateContactNote(representativeData) {
    var noteString = 'Member of Congress\n';
    noteString += formatDisplayTitle(representativeData) + '\n\n';
    noteString = noteString + 'Created using the ' + APP_NAME + ' app';
    return noteString;
}

function downloadPhoto(url, filename, callback) {
    request.head(url, function(err, res, body) {
        console.log('Content-Type:', res.headers['content-type']);
        console.log('Content-Length:', res.headers['content-length']);
        request(url).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
}

module.exports = router;
