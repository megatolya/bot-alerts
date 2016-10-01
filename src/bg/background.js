var currentToken;
var currentMute = false;

function updateToken(token) {
    chrome.storage.sync.set({token});
    currentToken = token;
}

function updateMute(mute) {
    chrome.storage.sync.set({mute});
    currentMute = mute;
}

function getOnlyFreshMessage(json) {
    return new Promise(function (resolve, reject) {
        if (!json.ok) {
            return reject('Request failed');
        }

        var validMessages = json.result.filter(function (data) {
            var message = data.message || data.edited_message;

            if (!message) {
                return false;
            }

            return /^\/alert\s.*/.test(message.text);
        });

        if (!validMessages.length) {
            return reject('No valid messages');
        }

        var lastMessage = validMessages[validMessages.length - 1]
        var lastMessageData = lastMessage.message || lastMessage.edited_message;
        var text = lastMessageData.text;
        text = text.replace(/^\/alert\s/, '');
        resolve({text, id: lastMessageData.message_id});
    });
}

chrome.storage.sync.get({
    token: null,
    mute: false
}, function (data) {
    currentToken = data.token;
    currentMute = data.mute;
    console.log('initial settings', data);
});

//example of using a message handler from the inject scripts
chrome.extension.onMessage.addListener(
  function(message, sender, sendResponse) {
      if ('newToken' in message) {
          updateToken(message.newToken);
      }

      if ('mute' in message) {
          updateMute(message.mute);
      }
});

const pollingUrl = 'https://api.telegram.org/bot{token}/getUpdates';

setInterval(function () {
    if (currentMute) {
        console.log('mute');
        return;
    }

    if (!currentToken) {
        console.warn('no token is set');
        return;
    }

    fetch(pollingUrl.replace('{token}', currentToken)).then(function (response) {
        return response.json();
    }).then(function (json) {
        return getOnlyFreshMessage(json).then(function (message) {
            chrome.tabs.query({active: true}, function(tabs) {
                for (tab of tabs) {
                    chrome.tabs.sendMessage(tab.id, {message});
                    console.log('sent', message);
                }
            });
        });
    }).catch(function (err) {
        console.log('failed!', err);
    });
}, 3000);
