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

function updateMessage(text, isNew) {
    var container = getAlertContainer();
    container.innerText = text;
}

chrome.extension.onMessage.addListener(function (request, sender, response) {
    var message = request.message;

    if (!message) {
        return;
    }

    updateMessage(message.text);
});
