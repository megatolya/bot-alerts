var currentToken;

function updateToken(token) {
    chrome.storage.sync.set({token});
    currentToken = token;
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
    token: null
}, function (data) {
    currentToken = data.token;
    console.log('initial settings', data);
});

chrome.extension.onMessage.addListener(
  function(message, sender, sendResponse) {
      if ('newToken' in message) {
          updateToken(message.newToken);
      }
});

const pollingUrl = 'https://api.telegram.org/bot{token}/getUpdates';

setInterval(function () {
    if (!currentToken) {
        console.warn('no token is set');
        return;
    }

    fetch(pollingUrl.replace('{token}', currentToken)).then(function (response) {
        return response.json();
    }).then(function (json) {
        return getOnlyFreshMessage(json).then(function (message) {
            chrome.tabs.query({active: true}, function(tabs) {
                for (let tab of tabs) {
                    chrome.tabs.sendMessage(tab.id, {message});
                    console.log('sent', message);
                }
            });
        });
    }).catch(function (err) {
        console.error('failed!', err);
    });
}, 3000);
