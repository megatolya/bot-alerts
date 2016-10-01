function updateToken(newToken) {
    chrome.runtime.sendMessage({newToken});
}

function updateMute(mute) {
    chrome.runtime.sendMessage({mute});
}

document.addEventListener('DOMContentLoaded', function () {
    var tokenInput = document.getElementById('chatBotTokenInput');
    var tokenButton = document.getElementById('chatBotTokenButton');
    var muteCheckBox = document.getElementById('muteCheckbox');

    tokenButton.addEventListener('click', function () {
        updateToken(tokenInput.value);
    });
    muteCheckbox.addEventListener('change', function () {
        updateMute(muteCheckbox.checked);
    });

    chrome.storage.sync.get({
        token: null,
        mute: false
    }, function (data) {
        var token = data.token;
        var mute = data.mute;

        if (token) {
            tokenInput.value = token;
        }

        muteCheckbox.checked = mute;
    });
});
