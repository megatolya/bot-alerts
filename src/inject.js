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

var entityMap = {
    '&': "&amp;",
    '<': "&lt;",
    '>': "&gt;",
    '"': '&quot;',
    '\'': '&#39;',
    '/': '&#x2F;'
};

function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
        return entityMap[s];
    });
}

function updateMessageField(freshMessages) {
    var container = getAlertContainer();
    freshMessages.slice().forEach(function (message) {
        if (message.text.length > 28) {
            message.text = message.text.slice(0, 26) + '…';
        }
    });
    const listItemsHTML = freshMessages.map(message => (
        `<li class="__alerts-message">
            <span class="__alerts-from">${escapeHtml(message.from)}: </span>
            <span class="__alerts-text">${escapeHtml(message.text)}</span>
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
