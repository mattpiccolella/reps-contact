var ERROR_MESSAGE = $('<h2 class="error-message">Sorry, but it appears you may have entered an incorrect Zip Code. Please edit your search and try again.</h2>');

$(document).ready(function() {
    $('#search-button').click(handleSearchClick);
});

function handleSearchClick() {
    $('#search-results').empty();
    var zipCode = $('#search-box').val();
    if (zipCode == '') {
        console.log('Incorrect!');
    }
    var url = '/representatives?zip=' + zipCode;
    $.get(url, function(data) {
        if (data.length == 0) {
            $('#search-results').append(ERROR_MESSAGE);
        } else {
            for (result of data) {
                var card = createRepresentativeCard(result);
                $('#search-results').append(card);
            }
        }
    })
}

function handleErrorImageLoad() {
    $(this).attr('src', '/images/person-placeholder.jpg');
}

function createRepresentativeCard(representativeData) {
    var result = $('<div>', {"class": "rep-result"});
    result.append(createRepresentativeInfo(representativeData));
    result.append(createRepresentativeActions(representativeData));
    return result;
}

function createRepresentativeInfo(representativeData) {
    var grid = $('<div>', {"class": "pure-g"});

    var imgCol = $('<div>', {"class": "pure-u-1 pure-u-sm-1-8"});
    imgCol.append($('<img>', {"src": representativeData.photo_url, "class": "rep-photo", "width": "100%"}).on('error', handleErrorImageLoad));

    var infoCol = $('<div>', {"class": "pure-u-1 pure-u-sm-7-8"});
    var repInfo = $('<div>', {"class": "rep-info"});
    repInfo.append($('<h1>' + representativeData.display_name + '</h1>'));
    repInfo.append($('<h2>' + representativeData.display_party + '</h2>'));
    repInfo.append($('<h2>' + representativeData.display_subtitle + '</h2>'));
    infoCol.append(repInfo);

    grid.append(imgCol);
    grid.append(infoCol);

    return grid;
}

function createRepresentativeActions(representativeData) {
    var grid = $('<div>', {"class": "pure-g action-bar"});
    var numberOfActions = (representativeData.actions.length == 1) ? 3 : representativeData.actions.length;
    var classString = 'pure-u-md-1-' + numberOfActions;
    for (var i = 0; i < representativeData.actions.length; i++) {
        var action = representativeData.actions[i];
        var buttonClassString = "pure-button full action-button";
        var actionName = action.className ? action.className : '';
        var buttonGrid = $('<div>', {"class": "pure-u-1 " + classString});

        var buttonContainerClass = 'action-container ';
        if (i > 0) {
            buttonContainerClass += 'action-container-left ';
        }
        if (i < representativeData.actions.length - 1) {
            buttonContainerClass += 'action-container-right';
        }
        var buttonContainer = $('<div>', {"class": buttonContainerClass});

        var button = $('<button/>', {"class" : buttonClassString + ' ' + actionName});
        var buttonLink = $("<a target='_blank' class='" + actionName + "' " + "href='" + action.link + "'>" + action.name + "</a>");

        button.append(buttonLink);
        buttonContainer.append(button);
        buttonGrid.append(buttonContainer);
        grid.append(buttonGrid);
    }

    return grid;
}