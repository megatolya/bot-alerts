var FRESH_MESSAGES_NUM = 4;
var currentToken;

function updateToken(token) {
    chrome.storage.sync.set({token});
    currentToken = token;
}

function getOnlyFreshMessages(json) {
    return new Promise(function (resolve, reject) {
        if (!json.ok) {
            return reject('Request failed');
        }

        var freshMessages = json.result.reverse().reduce((memo, data) => {
            var messageData = data.message || data.edited_message;

            if (!messageData || !messageData.text) {
                return memo;
            }

            messageData.update_id = data.update_id;
            memo.push(messageData);
            return memo;
        }, []).reverse();

        if (!freshMessages.length) {
            return reject('No valid messages');
        }

        resolve(freshMessages);
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

var currentOffset = -1;
var currentMessages = [];

var pollingUrl = 'https://api.telegram.org/bot{token}/getUpdates?offset={offset}';

setInterval(function () {
    if (!currentToken) {
        console.warn('no token is set');
        return;
    }

    fetch(pollingUrl.replace('{token}', currentToken).replace('{offset}', currentOffset)).then(function (response) {
        return response.json();
    }).then(function (json) {
        return getOnlyFreshMessages(json).then(function (messages) {
            var freshMessages = messages.map(messageData => ({
                id: messageData.message_id,
                text: messageData.text,
                from: messageData.from
                    ? (
                        (messageData.from.username ? ('@' + messageData.from.username) : null)
                        || messageData.from.first_name
                        || ''
                    )
                    : '',
                updateId: messageData.update_id
            }));

            var ids = [];

            currentMessages = currentMessages.concat(freshMessages).filter(function (message) {
                if (ids.indexOf(message.updateId) !== -1) {
                    return false;
                }

                ids.push(message.updateId);
                return true;
            });
            currentOffset = currentMessages[currentMessages.length - 1].updateId;
            var messagesToShow = currentMessages.slice().reverse().slice(0, FRESH_MESSAGES_NUM).reverse();

            chrome.tabs.query({active: true}, function(tabs) {
                for (var tab of tabs) {
                    chrome.tabs.sendMessage(tab.id, {messagesToShow});
                }
                console.log('sent', messagesToShow);
                console.log('all messages', currentMessages);
            });
        });
    }).catch(function (err) {
        console.error('failed!', err);
    });
}, 500);
