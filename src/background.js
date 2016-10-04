const FRESH_MESSAGES_NUM = 3;
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

        const freshMessages = json.result.reverse().reduce((memo, data) => {
            var messageData = data.message || data.edited_message;

            if (!messageData || !messageData.text) {
                return memo;
            }

            if (memo.length >= FRESH_MESSAGES_NUM) {
                return memo;
            }

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

const pollingUrl = 'https://api.telegram.org/bot{token}/getUpdates';

setInterval(function () {
    if (!currentToken) {
        console.warn('no token is set');
        return;
    }

    fetch(pollingUrl.replace('{token}', currentToken)).then(function (response) {
        return response.json();
    }).then(function (json) {
        return getOnlyFreshMessages(json).then(function (messages) {
            const freshMessages = messages.map(messageData => ({
                id: messageData.message_id,
                text: messageData.text,
                from: messageData.from
                    ? (
                        (messageData.from.username ? ('@' + messageData.from.username) : null)
                        || messageData.from.first_name
                        || ''
                    )
                    : ''
            }));

            chrome.tabs.query({active: true}, function(tabs) {
                for (let tab of tabs) {
                    chrome.tabs.sendMessage(tab.id, {freshMessages});
                    console.log('sent', freshMessages);
                }
            });
        });
    }).catch(function (err) {
        console.error('failed!', err);
    });
}, 3000);
