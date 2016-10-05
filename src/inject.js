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
    const listItemsHTML = freshMessages.map(message => (
        `<li>
            <span class="__alerts-from">${message.from}: </span>
            <span class="__alerts-text">${message.text}</span>
        </li>`
    )).join('');
    container.innerHTML = `<ul>${listItemsHTML}</ul>`;
}

chrome.extension.onMessage.addListener(function (request, sender, response) {
    var messagesToShow = request.messagesToShow;

    if (!messagesToShow) {
        return;
    }

    updateMessageField(messagesToShow);
});
