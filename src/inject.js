var className = '__alerts-container';

function getAlertContainer() {
    var container = document.querySelector('.' + className);

    if (!container) {
        container = document.createElement('div');
        container.classList.add(className);
        document.body.appendChild(container);
    }

    return container;
}

function updateMessageField(freshMessages) {
    var container = getAlertContainer();
    const listItemsHTML = freshMessages.map(message => `<li>${message.text}</li>`);
    
    container.innerHTML = `<ul>${listItemsHTML}</ul>`;
}

chrome.extension.onMessage.addListener(function (request, sender, response) {
    var freshMessages = request.freshMessages;

    if (!freshMessages) {
        return;
    }

    updateMessageField(freshMessages);
});
