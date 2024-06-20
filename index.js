const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

// Replace with your bot token from BotFather
const token = '7363983527:AAEnCrxomp8LFh3-E03uKH5IwRT2Uk72YGg';
// Replace with your channel usernames or IDs
const channelId1 = '@TeAm_Ali_1';
const channelId2 = '@teamali_support';

// Replace with your bot's username
const botUsername = 'DB_finder_pro_bot';

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
                db.run(`UPDATE users SET balance = balance + 5 WHERE id = ?`, [referrerId]);
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
                    { text: 'ᗩᑕ丅Ꭵᐯᗴ', url: 'https://t.me/TeAm_Ali_1' },
                    { text: 'ᗩᑕ丅Ꭵᐯᗴ', url: 'https://t.me/teamali_support' }
                ],
                [
                    { text: 'ᗩᑕ丅Ꭵᐯᗴ', url: 'https://t.me/TeAm_Ali_1' },
                    { text: 'ᗩᑕ丅Ꭵᐯᗴ', url: 'https://t.me/SeekhoTricks' }
                ],
                [
                    { text: '💴 ᗩᑕ丅Ꭵᐯᗩ丅ᗴ 💶', callback_data: 'check_join' }
                ]
            ]
        }
    };

    // Send image with caption and buttons
    bot.sendPhoto(chatId, 'main.jpeg', {
        caption: '𝘍𝘙𝘐𝘚𝘛 𝘑𝘖𝘐𝘕 𝘈𝘓𝘓 𝘊𝘏𝘈𝘕𝘕𝘌𝘓 𝘈𝘕𝘋 𝘊𝘓𝘐𝘊𝘒 𝘖𝘕 𝘈𝘊𝘛𝘐𝘝𝘈𝘛𝘌',
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
                    caption: '★彡[ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ  ꜰʀᴇꜱʜ ᴅʙ ᴄᴇɴᴛᴇʀ]彡★\n\n𝙔𝙤𝙪 𝙘𝙖𝙣 𝙚𝙖𝙧𝙣 𝙥𝙤𝙞𝙣𝙩𝙨 & 𝙛𝙞𝙣𝙙 𝙨𝙞𝙢 𝙙𝙖𝙩𝙖 𝘾𝙉𝙄𝘾 𝙙𝙖𝙩𝙖 𝙖𝙣𝙙 𝙨𝙞𝙢 𝙤𝙬𝙣𝙚𝙧 𝘿𝙀𝙏𝘼𝙄𝙇𝙎 ',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'ᗯᗩᒪᒪᗴ丅', callback_data: 'balance' },
                                { text: 'ᖇᗴᖴᗴᖇᖇᗩᒪ', callback_data: 'referral' }
                            ],
                            [
                                { text: '𝙱𝚄𝚈 𝙿𝙾𝙸𝙽𝚃 & 𝚂𝚄𝙿𝙿𝙾𝚁𝚃 𝙲𝙴𝙽𝚃𝙴𝚁', callback_data: 'button3' },
                            ],
                            [
                                { text: '𝖥𝗋𝖾𝗌𝗁 𝖽𝖺𝗍𝖺 𝗉𝗋𝗈', callback_data: 'agree' },
                                { text: 'ᴄɴɪᴄ ᴅᴇᴛᴀɪʟs 𝗉𝗋𝗈', callback_data: 'find_cnic' }
                            ],
                        ]
                    }
                });
            } else {
                bot.sendMessage(chatId, 'Please join ALL channels first.');
            }
        } catch (error) {
            bot.sendMessage(chatId, 'An error occurred while checking the membership status.');
        }
    } else if (callbackQuery.data === 'balance') {
        getUserBalance(userId, (balance) => {
            bot.sendMessage(chatId, `🤡 𝚆𝚊𝚕𝚕𝚎𝚝 𝚊𝚍𝚍𝚛𝚎𝚜𝚜 🤡\n\n💵 ★彡[ʙᴀʟᴀɴᴄᴇ : ${balance} ᴘᴏɪɴᴛꜱ]彡★ 💵\n\n🤑 𝙍𝙚𝙛𝙚𝙧 𝘼𝙣𝙙 𝙀𝙖𝙧𝙣 𝙈𝙤𝙧𝙚 𝙥𝙤𝙞𝙣𝙩𝙨 🤑`);
        });
    } else if (callbackQuery.data === 'referral') {
        const referralLink = `https://t.me/${botUsername}?start=${userId}`;
        db.get(`SELECT COUNT(*) AS count FROM referrals WHERE referrer_id = ?`, [userId], (err, row) => {
            if (err) {
                return bot.sendMessage(chatId, 'An error occurred while retrieving referral count.');
            }
            const referralCount = row.count;
            bot.sendMessage(chatId, `💰 𝙄𝙣𝙫𝙞𝙩𝙚 𝙐𝙨𝙚𝙧𝙨 𝘼𝙣𝙙 𝙀𝙖𝙧𝙣 5 𝙋𝙊𝙄𝙉𝙏\n\n📱ᎥᑎᐯᎥ丅ᗴ ᒪᎥᑎᛕ : ${referralLink}\n\n🎯 𝐘𝐨𝐮 𝐈𝐧𝐯𝐢𝐭𝐞𝐝 : ${referralCount} 𝐔𝐬𝐞𝐫𝐬`);
        });
    } else if (callbackQuery.data === 'agree') {
        bot.sendMessage(chatId, '🚀 𝖥𝗋𝖾𝗌𝗁 𝖽𝖺𝗍𝖺 𝗉𝗋𝗈 🚀\n𝐘𝐨𝐮 𝐖𝐚𝐧𝐭 𝐓𝐨 𝖥𝗋𝖾𝗌𝗁 𝖽𝖺𝗍𝖺 𝐓𝐡𝐢𝐬 𝐁𝐨𝐭 𝐖𝐢𝐥𝐥 𝐂𝐮𝐭 𝟏𝟓 𝐏𝐨𝐢𝐧𝐭𝐬 𝐅𝐫𝐨𝐦 𝐘𝐨𝐮𝐫 𝐖𝐚𝐥𝐥𝐞𝐭\n𝐒𝐞𝐧𝐝 𝐌𝐞 𝐍𝐮𝐦𝐛𝐞𝐫 𝐭𝐨 𝐅𝐢𝐧𝐝 𝐃𝐀𝐓𝐀𝐁𝐀𝐒𝐄\n𝐄𝐱𝐚𝐦𝐩𝐥𝐞: 𝟑𝟎𝟎𝐱𝐱𝐱𝐱𝐱𝐱 , 𝟗𝟐𝟑𝐱𝐱𝐱𝐱𝐱𝐱𝐱𝐱');
        bot.once('message', (msg) => {
            const number = msg.text;

            getUserBalance(userId, async (balance) => {
                if (balance >= 15) {
                    try {
                        const apiResponse = await axios.get(`https://kingfinders.click/api/TM.php?number=${number}`);
                        const data = apiResponse.data;

                        if (data && data.length > 0) {
                            const userData = data[0];
                            const responseMessage = `📟Number: ${userData.Mobile}\n👤Name: ${userData.Name}\n🆔CNIC: ${userData.CNIC}\n🏠Address: ${userData.ADDRESS}`;

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
                        bot.sendMessage(chatId, 'TRY VAILD NUMBER');
                    }
                } else {
                    bot.sendMessage(chatId, 'Dear user, your balance is empty. You need 15 points to find data.');
                }
            });
        });
    } else if (callbackQuery.data === 'find_cnic') {
        bot.sendMessage(chatId, '🚀★彡[ᴄɴɪᴄ ᴅᴀᴛᴀ ꜰɪɴᴅᴇʀ]彡★🚀\n 𝙔𝙤𝙪 𝙒𝙖𝙣𝙩 𝙏𝙤 𝖥𝗋𝖾𝗌𝗁 𝖽𝖺𝗍𝖺 𝙏𝙝𝙞𝙨 𝘽𝙤𝙩 𝙒𝙞𝙡𝙡 𝘾𝙪𝙩 30 𝙋𝙤𝙞𝙣𝙩𝙨 𝙁𝙧𝙤𝙢 𝙔𝙤𝙪𝙧 𝙒𝙖𝙡𝙡𝙚𝙩\n𝙎𝙚𝙣𝙙 𝙈𝙚 𝘾𝙉𝙄𝘾 𝙉𝙪𝙢𝙗𝙚𝙧 𝙩𝙤 𝙁𝙞𝙣𝙙 𝙎𝙄𝙈 𝙊𝙒𝙉𝙀𝙍 𝘿𝘼𝙏𝘼 \n𝙀𝙭𝙖𝙢𝙥𝙡𝙚: 45𝙭𝙭𝙭𝙭𝙭𝙭𝙭𝙭𝙭𝙭𝙭');
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
                                responseMessage += `📟Number: ${user.Mobile}\n👤Name: ${user.Name}\n🆔CNIC: ${user.CNIC}\n,🏠Address: ${user.ADDRESS}\n\n`;
                            });

                            bot.sendMessage(chatId, responseMessage);

                            db.run(`UPDATE users SET balance = balance - 30 WHERE id = ?`, [userId], (err) => {
                                if (err) {
                                    console.error(err.message);
                                }
                            });
                        } else {
                            bot.sendMessage(chatId, 'DATA NOT FOUND ERROR.');
                        }
                    } catch (error) {
                        bot.sendMessage(chatId, 'TRY VAILD NUMBER OR NUMBER DATA NOT FOUND');
                    }
                } else {
                    bot.sendMessage(chatId, 'Dear user, your balance is empty. You need 30 points to find data.');
                }
            });
        });
    } else if (callbackQuery.data === 'button3') {
        bot.sendMessage(chatId, '⚠️ ＳＥＲＶＩＣＥＳ ＆ ＨＥＬＰ ⚠️\n\nEarn points through invites and referrals (1 invite = 5 point).\n\nBot charges:\nFresh SIM data: 15 points\nAll SIMs data & CNIC Data: 30 points\n\n⚠️ BUY POINT PRICES ⚠️\n50 POINTS: RS 50\n350 POINTS: RS 200\n500 POINTS: RS 400\n1000 POINTS: RS 800\n\nTo Buy Coins, Contact The Admin @Prog_xyz.\n\n😎 Buy VIP plan Unlimited Points. 😎\n\nAny One Facing Any Issues Or Problem Then Contect In Helpcenter CENTER CONTECT : @help_simdata_bot', {
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
        db.all(`SELECT u.id, u.username, u.balance, 
                       (SELECT COUNT(*) FROM referrals r WHERE r.referrer_id = u.id) as referral_count 
                FROM users u`, (err, rows) => {
            if (err) {
                return bot.sendMessage(chatId, 'An error occurred while retrieving users.');
            }

            if (rows.length === 0) {
                return bot.sendMessage(chatId, 'No users found.');
            }

            // Headers
            let message = 'No : Users list 🎩            balance 🤑     ref\n';

            rows.forEach((row, index) => {
                const username = row.username.padEnd(20, ' ');
                const balance = String(row.balance).padEnd(10, ' ');
                const referral_count = String(row.referral_count).padEnd(5, ' ');
                message += `${index + 1}.   @${username}${balance}${referral_count}\n`;
            });

            bot.sendMessage(chatId, message);
        });
    } else {
        bot.sendMessage(chatId, `You are not authorized to use this command.`);
    }
});






// Function to send a message to a specific chat ID
bot.sendMessageToChatWithId = function(chatId, text, allUsers = false) {
    if (!allUsers) {
        bot.sendMessage(chatId, text);
        return;
    }

    // Send message to all users
    db.all(`SELECT id FROM users`, (err, rows) => {
        if (err) {
            console.error('Error retrieving users:', err);
            return;
        }

        rows.forEach((row) => {
            bot.sendMessage(row.id, text);
        });
    });
};

// Handle /cast command for admin to send broadcast messages
bot.onText(/\/chat (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (userId == 6843974523) { // Check if the user is admin (replace with your admin user ID)
        const message = match[1];

        // Send message to all users
        bot.sendMessageToChatWithId(chatId, `ADMIN:@Prog_xyz\n${message}`, true);
    } else {
        bot.sendMessage(chatId, `You are not authorized to use this command.`);
    }
});



// Handle @username command for admin to send message to a specific user by username
bot.onText(/\/@(\w+) (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const adminId = msg.from.id;

    if (adminId == 6843974523) { // Check if the user is admin
        const targetUsername = match[1];
        const message = match[2];

        db.get(`SELECT id FROM users WHERE username = ?`, [targetUsername], (err, row) => {
            if (err) {
                return bot.sendMessage(chatId, 'An error occurred while retrieving the user.');
            }
            if (!row) {
                return bot.sendMessage(chatId, 'User not found.');
            }

            const targetUserId = row.id;

            // Send message to the target user
            bot.sendMessageToChatWithId(targetUserId, `BOT : @${botUsername}\n${message}`);
            bot.sendMessage(chatId, `Message sent to @${targetUsername} successfully.`);
        });
    } else {
        bot.sendMessage(chatId, `You are not authorized to use this command.`);
    }
});



bot.onText(/\/addpoints (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const adminId = msg.from.id;

    if (adminId == 6843974523) { // Check if the user is admin
        const points = parseInt(match[1]);

        db.run(`UPDATE users SET balance = balance + ?`, [points], function(err) {
            if (err) {
                return bot.sendMessage(chatId, 'An error occurred while adding points to all users.');
            }
            bot.sendMessage(chatId, `Added ${points} points to all users.`);
        });
    } else {
        bot.sendMessage(chatId, `You are not authorized to use this command.`);
    }
});



bot.onText(/\/ref @(\w+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const adminId = msg.from.id;

    if (adminId == 6843974523) { // Check if the user is admin
        const targetUsername = match[1];

        db.get(`SELECT id FROM users WHERE username = ?`, [targetUsername], (err, row) => {
            if (err) {
                return bot.sendMessage(chatId, 'An error occurred while retrieving the user.');
            }
            if (!row) {
                return bot.sendMessage(chatId, 'User not found.');
            }

            const targetUserId = row.id;

            db.all(`SELECT referred_id, (SELECT username FROM users WHERE id = referred_id) as referred_username FROM referrals WHERE referrer_id = ?`, [targetUserId], (err, rows) => {
                if (err) {
                    return bot.sendMessage(chatId, 'An error occurred while retrieving referrals.');
                }

                if (rows.length === 0) {
                    return bot.sendMessage(chatId, 'No referrals found.');
                }

                let message = `Referrals for @${targetUsername}:\n`;

                rows.forEach((row, index) => {
                    message += `${index + 1}. @${row.referred_username}\n`;
                });

                bot.sendMessage(chatId, message);
            });
        });
    } else {
        bot.sendMessage(chatId, `You are not authorized to use this command.`);
    }
});




// Handle /cut command to deduct points from a user by username
bot.onText(/\/cut @(\w+) (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const adminId = msg.from.id;

    if (adminId == 6843974523) { // Check if the user is admin
        const targetUsername = match[1];
        const amount = parseInt(match[2]);

        db.get(`SELECT id, balance FROM users WHERE username = ?`, [targetUsername], (err, row) => {
            if (err) {
                return bot.sendMessage(chatId, 'An error occurred while retrieving the user.');
            }
            if (!row) {
                return bot.sendMessage(chatId, 'User not found.');
            }

            const targetUserId = row.id;
            const currentBalance = row.balance;

            if (currentBalance < amount) {
                return bot.sendMessage(chatId, `User @${targetUsername} does not have enough points. Current balance: ${currentBalance}`);
            }

            db.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [amount, targetUserId], function(err) {
                if (err) {
                    return bot.sendMessage(chatId, 'An error occurred while deducting points.');
                }
                getUserBalance(targetUserId, (balance) => {
                    bot.sendMessage(chatId, `💰 Amount Deducted Successfully.\n\nDetails Below`);
                    bot.sendMessage(chatId, `Admin deducted points from the wallet\n🆔 User Id :- ${targetUserId}\n\n💰 Amount Deducted :-  ${amount}\n\n💰 Remaining Balance 💰 :- ${balance}`);
                    bot.sendMessageToChatWithId(targetUserId, `Admin deducted points from your wallet\n🆔 WALLET ID :- ${targetUserId}\n\n💰 Amount Deducted :-  ${amount}\n\n💰 Remaining Balance 💰 :- ${balance}`);
                });
            });
        });
    } else {
        bot.sendMessage(chatId, `You are not authorized to use this command.`);
    }
});
console.log('Bot is running...');