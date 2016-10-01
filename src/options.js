function updateToken(newToken) {
    chrome.runtime.sendMessage({newToken});
}

document.addEventListener('DOMContentLoaded', function () {
    var tokenInput = document.getElementById('chatBotTokenInput');
    var tokenButton = document.getElementById('chatBotTokenButton');

    tokenButton.addEventListener('click', function () {
        updateToken(tokenInput.value);
    });

    chrome.storage.sync.get({
        token: null
    }, function (data) {
        var token = data.token;

        if (token) {
            tokenInput.value = token;
        }
    });
});
