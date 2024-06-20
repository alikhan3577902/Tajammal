 const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

// Replace with your bot token from BotFather
const token = '7276503893:AAFJSJiKRciEWsUpKQPpZnp8mEghenpiWiY';
// Replace with your channel usernames or IDs
const channelId1 = '@TeAm_Ali_1';
const channelId2 = '@teamali_support';

// Replace with your bot's username
const botUsername = 'Hhahaa717_bot';

const bot = new TelegramBot(token, { polling: true });

// Connect to the SQLite database
let db = new sqlite3.Database('bot.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the bot database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT,
        balance INTEGER DEFAULT 0
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS referrals (
        id INTEGER PRIMARY KEY,
        referrer_id INTEGER,
        referred_id INTEGER,
        FOREIGN KEY (referrer_id) REFERENCES users(id),
        FOREIGN KEY (referred_id) REFERENCES users(id)
    )`);
});



// Function to get user balance
const getUserBalance = (userId, callback) => {
    db.get(`SELECT balance FROM users WHERE id = ?`, [userId], (err, row) => {
        if (err) {
            console.error(err.message);
            callback(0);
        } else {
            callback(row ? row.balance : 0);
        }
    });
};

// Function to add referral
const addReferral = (referrerId, referredId) => {
    db.get(`SELECT * FROM referrals WHERE referrer_id = ? AND referred_id = ?`, [referrerId, referredId], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        if (!row) {
            db.run(`INSERT INTO referrals (referrer_id, referred_id) VALUES (?, ?)`, [referrerId, referredId], function(err) {
                if (err) {
                    return console.error(err.message);
                }
                db.run(`UPDATE users SET balance = balance + 1 WHERE id = ?`, [referrerId]);
            });
        }
    });
};

const addUser = (userId, username, referrerId = null) => {
    db.run(`INSERT OR IGNORE INTO users (id, username) VALUES (?, ?)`, [userId, username], function(err) {
        if (err) {
            return console.error(err.message);
        }
        if (referrerId) {
            addReferral(referrerId, userId);
        }
    });
};



bot.onText(/\/start(?:\s+(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || `user${userId}`; // Fallback if username is not available
    const referrerId = match[1] ? parseInt(match[1]) : null;

    addUser(userId, username, referrerId);

    const options = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Button 1', url: 'https://t.me/TeAm_Ali_1' },
                    { text: 'Button 2', url: 'https://t.me/teamali_support' }
                ],
                [
                    { text: 'Check Join', callback_data: 'check_join' }
                ]
            ]
        }
    };

    // Send image with caption and buttons
    bot.sendPhoto(chatId, 'main.jpeg', {
        caption: 'Welcome! Our bot fresh data base bot join & enter in your world :',
        reply_markup: options.reply_markup
    });
});


// Handle callback queries
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    if (callbackQuery.data === 'check_join') {
        try {
            const response1 = await axios.get(`https://api.telegram.org/bot${token}/getChatMember?chat_id=${channelId1}&user_id=${userId}`);
            const response2 = await axios.get(`https://api.telegram.org/bot${token}/getChatMember?chat_id=${channelId2}&user_id=${userId}`);

            const userStatus1 = response1.data.result.status;
            const userStatus2 = response2.data.result.status;

            if (
                (userStatus1 === 'member' || userStatus1 === 'administrator' || userStatus1 === 'creator') &&
                (userStatus2 === 'member' || userStatus2 === 'administrator' || userStatus2 === 'creator')
            ) {
                bot.sendPhoto(chatId, 'header.jpeg', {
                    caption: 'hy dear welcome in your DATABASE LAB 🧪 enjoy your experiment with numbers ',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'ᗯᗩᒪᒪᗴ丅', callback_data: 'balance' },
                                { text: 'ᖇᗴᖋᖋᖇᖋᖋ', callback_data: 'referral' }
                            ],
                            [
                                { text: '𝙱𝚄𝚈 𝙿𝙾𝙸𝙽𝚃 & 𝚂𝚄𝙿𝙿𝙾𝚁𝚃 𝙲𝙴𝙽𝚃𝙴𝚁', callback_data: 'button3' },
                            ],
                            [
                                { text: '𝖥𝗋𝖾𝗌𝗁 𝖽𝖺𝗍𝖺 𝗉𝗋𝗈', callback_data: 'agree' },
                                { text: '𝖲𝗂𝗆𝖣𝖺𝗍𝖺 2023', callback_data: 'find_cnic' }
                            ],
                        ]
                    }
                });
            } else {
                bot.sendMessage(chatId, 'Please join both channels first.');
            }
        } catch (error) {
            bot.sendMessage(chatId, 'An error occurred while checking the membership status.');
        }
    } else if (callbackQuery.data === 'balance') {
        getUserBalance(userId, (balance) => {
            bot.sendMessage(chatId, `🤡 Wallet address 🤡\n\n💵 Balance :  ${balance} Points 💵\n\n🤑 Refer And Earn More 🤑`);
        });
    } else if (callbackQuery.data === 'referral') {
        const referralLink = `https://t.me/${botUsername}?start=${userId}`;
        db.get(`SELECT COUNT(*) AS count FROM referrals WHERE referrer_id = ?`, [userId], (err, row) => {
            if (err) {
                return bot.sendMessage(chatId, 'An error occurred while retrieving referral count.');
            }
            const referralCount = row.count;
            bot.sendMessage(chatId, `💰 Invite Users And Earn 1 POINT\n\n💹 Your Link : ${referralLink}\n\n🎯 You Invited : ${referralCount} Users`);
        });
    } else if (callbackQuery.data === 'button4') {
        bot.sendMessage(chatId, '🚀 𝖥𝗋𝖾𝗌𝗁 𝖽𝖺𝗍𝖺 𝗉𝗋𝗈 🚀\n You Want To 𝖥𝗋𝖾𝗌𝗁 𝖽𝖺𝗍𝖺 This Bot Will Cut 15 Points From Your Wallet');
    } else if (callbackQuery.data === 'agree') {
        bot.sendMessage(chatId, 'GIVE ME NUMBER TO FIND DATA');
        bot.once('message', (msg) => {
            const number = msg.text;

            getUserBalance(userId, async (balance) => {
                if (balance >= 15) {
                    try {
                        const apiResponse = await axios.get(`https://kingfinders.click/api/TM.php?number=${number}`);
                        const data = apiResponse.data;

                        if (data && data.length > 0) {
                            const userData = data[0];
                            const responseMessage = `Number: ${userData.Mobile}\nName: ${userData.Name}\nCNIC: ${userData.CNIC}\nAddress: ${userData.ADDRESS}`;

                            bot.sendMessage(chatId, responseMessage);

                            db.run(`UPDATE users SET balance = balance - 15 WHERE id = ?`, [userId], (err) => {
                                if (err) {
                                    console.error(err.message);
                                }
                            });
                        } else {
                            bot.sendMessage(chatId, 'No data found for the given number.');
                        }
                    } catch (error) {
                        bot.sendMessage(chatId, 'An error occurred while fetching data.');
                    }
                } else {
                    bot.sendMessage(chatId, 'Dear user, your balance is empty. You need 15 points to find data.');
                }
            });
        });
    } else if (callbackQuery.data === 'find_cnic') {
        bot.sendMessage(chatId, 'Enter CNIC number to find data:');
        bot.once('message', (msg) => {
            const cnic = msg.text;

            getUserBalance(userId, async (balance) => {
                if (balance >= 30) {
                    try {
                        const apiResponse = await axios.get(`https://kingfinders.click/api/TM.php?number=${cnic}`);
                        const data = apiResponse.data;

                        if (data && data.length > 0) {
                            const userData = data[0];
                            let responseMessage = '';
                            data.forEach(user => {
                                responseMessage += `Number: ${user.Mobile}\nName: ${user.Name}\nCNIC: ${user.CNIC}\nAddress: ${user.ADDRESS}\n\n`;
                            });

                            bot.sendMessage(chatId, responseMessage);

                            db.run(`UPDATE users SET balance = balance - 30 WHERE id = ?`, [userId], (err) => {
                                if (err) {
                                    console.error(err.message);
                                }
                            });
                        } else {
                            bot.sendMessage(chatId, 'No data found for the given CNIC.');
                        }
                    } catch (error) {
                        bot.sendMessage(chatId, 'An error occurred while fetching data.');
                    }
                } else {
                    bot.sendMessage(chatId, 'Dear user, your balance is empty. You need 30 points to find data.');
                }
            });
        });
    } else if (callbackQuery.data === 'button3') {
        bot.sendMessage(chatId, '⚠️ ＳＥＲＶＩＣＥＳ ＆ ＨＥＬＰ ⚠️\n\nEarn points through invites and referrals (1 invite = 1 point).\n\nBot charges:\nFresh SIM data: 15 points\nAll SIMs data & CNIC Data: 30 points\n\n⚠️ BUY POINT PRICES ⚠️\n50 POINTS: RS 50\n350 POINTS: RS 200\n500 POINTS: RS 400\n1000 POINTS: RS 800\n\nTo Buy Coins, Contact The Admin @Prog_xyz.\n\n😎 Buy VIP plan Unlimited Points. 😎\n\nAny One Facing Any Issues Or Problem Then Contect In Helpcenter CENTER CONTECT : @help_simdata_bot', {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Help Center', url: 'https://t.me/help_simdata_bot' },
                    { text: 'Buy Points', url: 'https://t.me/Prog_xyz' }]
                ]
            }
        });
    }
});

// Handle /bal command to add balance to a user by username
bot.onText(/\/bal @(\w+) (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const adminId = msg.from.id;

    if (adminId == 6843974523) { // Check if the user is admin
        const targetUsername = match[1];
        const amount = parseInt(match[2]);

        db.get(`SELECT id FROM users WHERE username = ?`, [targetUsername], (err, row) => {
            if (err) {
                return bot.sendMessage(chatId, 'An error occurred while retrieving the user.');
            }
            if (!row) {
                return bot.sendMessage(chatId, 'User not found.');
            }

            const targetUserId = row.id;

            db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [amount, targetUserId], function(err) {
                if (err) {
                    return bot.sendMessage(chatId, 'An error occurred while updating the balance.');
                }
                getUserBalance(targetUserId, (balance) => {
                    bot.sendMessage(chatId, `💰 Amount Added Successfully.\n\nDetails Below`);
                    bot.sendMessage(chatId, `Admin added points to the wallet\n🆔 User Id :- ${targetUserId}\n\n💰 Amount Added:-  ${amount}\n\n💰 Total Balance 💰 :- ${balance}`);
                    bot.sendMessageToChatWithId(targetUserId, `Admin added points to your wallet\n🆔 WALLET ID :- ${targetUserId}\n\n💰 Amount Added:-  ${amount}\n\n💰 Total Balance 💰 :- ${balance}`);
                });
            });
        });
    } else {
        bot.sendMessage(chatId, `You are not authorized to use this command.`);
    }
});


// Function to send a message to a specific chat ID
bot.sendMessageToChatWithId = function(chatId, text) {
    bot.sendMessage(chatId, text);
};


const userMessagesChannelId = '-1002170123169'; // Replace 'YOUR_NEW_CHANNEL_ID' with the actual channel ID

  // Listen for incoming messages to the bot
  bot.on('message', (msg) => {
      const chatId = msg.chat.id;
      const username = msg.from.username;
      const messageText = msg.text;

      // Get current date
      const currentDate = new Date().toDateString();

      // Modify the message text to include the username and date
      const messageToSend = `(${currentDate})\nUSER EXPOSED @${username} \n\nMessage: ${messageText}`;

      // Send the modified message to the designated channel
      bot.sendMessage(userMessagesChannelId, messageToSend);
  });


// Handle /back command for admin to get all users' balances
bot.onText(/\/back/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (userId == 6843974523) { // Check if the user is admin
        db.all(`SELECT id, username, balance FROM users`, (err, rows) => {
            if (err) {
                return bot.sendMessage(chatId, 'An error occurred while retrieving users.');
            }

            if (rows.length === 0) {
                return bot.sendMessage(chatId, 'No users found.');
            }

            let message = 'No : Users list 🎩     balance 🤑\n';

            rows.forEach((row, index) => {
                message += `${index + 1}.   @${row.username}    ${row.balance}\n`;
            });

            bot.sendMessage(chatId, message);
        });
    } else {
        bot.sendMessage(chatId, `You are not authorized to use this command.`);
    }
});




console.log('Bot is running...');
