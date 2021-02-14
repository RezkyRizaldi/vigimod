/** Variables */
// Discord.js Classes
const { Client, Collection, MessageAttachment, MessageEmbed } = require('discord.js');

// Packages
const axios = require('axios');
// Axios Header
let config = {
	headers: {
		'Content-Type': 'application/json',
	},
};
// End
const qs = require('qs');

// Environment
const client = new Client({
	disableEveryone: true,
});
client.commands = new Collection();

// BOT Configuration
const {
	BUILD,
	COLOR,
	DB_DELETE_BASE_URL,
	DB_GUEST_BASE_URL,
	DB_POST_GUEST_BASE_URL,
	DB_RANDOM_ESSAY_BASE_URL,
	DB_RANDOM_SELECTION_BASE_URL,
	DB_SECONDARY_SELECTION_BASE_URL,
	DB_UPDATE_GUEST_BASE_URL,
	DB_UPDATE_WRONG_BASE_URL,
	DB_QUESTION_BASE_URL,
	DB_QUESTION_DEFAULT_ANSWER_BASE_URL,
	GUILD_ID,
	GUEST_ROLE,
	MEMBER_ROLE,
	NAME,
	PREFIX,
	TOKEN,
	VERIFY_SELECTION_CH,
	VERIFY_QUEUE_CH,
	DB_COOLDOWN_BASE_URL,
	DB_FIND_GUEST_QUESTION_ID,
	DB_CHECK_USER_COOLDOWN,
} = require('./config.json');
/** End Variables */

/** Events */
// On Ready
client.on('ready', () => {
	console.log(`${client.user.username} ${BUILD} hurung bos!`);
	setInterval(() => {
		client.user
			.setActivity(`[${PREFIX}help] | ${BUILD}`, {
				type: 'PLAYING',
			})
			.catch((err) => console.log(err));
	}, 1000 * 60 * 3);
});

// On Guild Member Add
client.on('guildMemberAdd', async (member) => {
	const guild = client.guilds.cache.get(GUILD_ID);
	if (!guild) return;
	let guest = guild.roles.cache.get(GUEST_ROLE);
	member.roles.add(guest);
});

// On Guild Member Remove
client.on('guildMemberRemove', async (member) => {
	try {
		console.log(member.id);
		const guestLeaveResp = await axios.get(DB_DELETE_BASE_URL + member.id);
		console.log(guestLeaveResp.data);
	} catch (err) {
		console.log(err);
	}
});

client.on('message', async (message) => {
	const guild = client.guilds.cache.get(GUILD_ID);

	if (message.channel.type === 'dm') {
		// console.log(message)
		if (message.content.startsWith(`${PREFIX}`)) {
			let args = message.content.substring(PREFIX.length).split(/ +/);
			switch (args[0]) {
				case 'answer':
					let errorNotFound;
					let user_id;
					let question_id;
					let question_order;
					let wrongcount;
					let updated_at;
					let user_name;
					let user_tag;
					var userRegisterData = {};
					const postGuestUrl = DB_UPDATE_GUEST_BASE_URL + message.author.id;
					const postWrongUrl = DB_UPDATE_WRONG_BASE_URL + message.author.id;
					const findGuestUrl = DB_GUEST_BASE_URL + message.author.id;
					const findGuestQuestionId = DB_FIND_GUEST_QUESTION_ID + message.author.id;
					try {
						const guestData = await axios.get(findGuestUrl);
						const questionIdData = await axios.get(findGuestQuestionId);
						// console.log(guestData.data.user_id);
						console.log(questionIdData.data.question_id);
						user_id = guestData.data.user_id;
						question_id = questionIdData.data.question_id;
						question_order = guestData.data.question_order;
						wrongcount = guestData.data.wrongcount;
						updated_at = guestData.data.updated_at;
						user_name = guestData.data.user_name;
						user_tag = guestData.data.user_tag;
					} catch (error) {
						errorNotFound = await error.response.data.status;
					}
					if (errorNotFound != 404) {
						console.log(question_id);
						const findQuestionAnswerUrl = DB_QUESTION_DEFAULT_ANSWER_BASE_URL + question_id;
						const findQuestionAnswerData = await axios.get(findQuestionAnswerUrl);
						const { defaultAnswer } = findQuestionAnswerData.data;
						const getRnadomEssayUrl = DB_RANDOM_ESSAY_BASE_URL;
						const response = await axios.get(getRnadomEssayUrl);
						const essayQuestion = response.data[0].question;
						const essayId = response.data[0].id;
						let embedAnswer = new MessageEmbed()
							.setColor(COLOR)
							.setTimestamp()
							.setFooter(`${NAME} | ${BUILD}`, client.user.displayAvatarURL({ dynamic: true }));

						let memberAnswer = args.slice(1).join(' ');
						console.log(memberAnswer);
						// if (!memberAnswer) {
						// 	embedAnswer.setTitle("Permissions Ditolak");
						// 	embedAnswer.setDescription(`**${message.author.tag}**, harap masukkan jawaban Anda dengan benar dan tepat!`)
						// 	return message.author.send(embedAnswer);
						// }

						if (question_order <= 3) {
							if (wrongcount < 3) {
								console.log(defaultAnswer);
								console.log(memberAnswer);
								if (memberAnswer == defaultAnswer) {
									// userRegisterData.user_id = message.author.id;
									// userRegisterData.user_tag = message.author.tag;
									// userRegisterData.user_name = message.author.username;
									if (question_order == 1) {
										const getSecondarySelectionUrl = DB_SECONDARY_SELECTION_BASE_URL + question_id;
										const secondarySelectionData = await axios.get(getSecondarySelectionUrl);
										const { question, id } = secondarySelectionData.data[0];
										userRegisterData.question_order = question_order + 1;
										userRegisterData.user_answer = memberAnswer;
										userRegisterData.question_id = id;
										await axios.post(postGuestUrl, qs.stringify(userRegisterData));
										return message.author.send('Jawaban pertama terkirim!\n\n' + question);
									} else if (question_order == 2) {
										userRegisterData.question_order = question_order + 1;
										userRegisterData.user_answer = memberAnswer;
										userRegisterData.question_id = essayId;
										await axios.post(postGuestUrl, qs.stringify(userRegisterData));
										return message.author.send('Jawaban kedua terkirim! Essay:\n\n' + essayQuestion);
									}
								} else if (question_order == 3) {
									userRegisterData.question_order = question_order + 1;
									userRegisterData.user_answer = memberAnswer;
									userRegisterData.question_id = essayId;
									await axios.post(postGuestUrl, qs.stringify(userRegisterData));
									// Send to Moderator Channel
									const sendModUserQuestionId = question_id;
									// Get last question and send to moderator channel
									const questionResponse = await axios.get(DB_QUESTION_BASE_URL + sendModUserQuestionId);
									const sendModQuestionData = questionResponse.data.question; // Send This instead of id
									// End
									const sendModUsername = user_name;
									const sendModUserTag = user_tag;
									const sendModUserCreatedAt = updated_at;
									const sendModUserAnswer = memberAnswer;
									// End
									const templateApproval = `Ni gan ada yg daftar dengan data berikut\nID User : **${message.author.id}**\nUser Tag : **${sendModUserTag}**\nUsername : **${sendModUsername}**\nTanggal Pendaftaran: **${sendModUserCreatedAt}**\nDengan pertanyaan : **${sendModQuestionData}**\nJawaban: **${sendModUserAnswer}**`;
									const testChannel = guild.channels.cache.get(VERIFY_SELECTION_CH);
									let embedMod = new MessageEmbed();
									embedMod.setTitle('New Member Verification');
									embedMod.setDescription(templateApproval);
									testChannel.send(embedMod);
									return message.author.send('Semua jawaban terkirim!');
								} else {
									const getSecondarySelectionUrl = DB_SECONDARY_SELECTION_BASE_URL + question_id;
									const secondarySelectionData = await axios.get(getSecondarySelectionUrl);
									const { question, id } = secondarySelectionData.data[0];
									let incrementWrongCount = wrongcount + 1;
									userRegisterData.question_id = id;
									userRegisterData.wrongcount = incrementWrongCount;
									const responseWrong = await axios.post(postWrongUrl, qs.stringify(userRegisterData));
									console.log(responseWrong);
									embedAnswer.setTitle('Pertanyaan Diulang!');
									embedAnswer.setDescription(`${question} **[Y/N]**`);
									return message.author.send(embedAnswer);
								}
							} else if (wrongcount == 3) {
								console.log('Aksi jika sudah salah 3 kali disini');
							} else {
								console.log('xxx');
							}
						} else if (question_order == 3) {
							console.log('lakukan sesuatu untuk essay disini');
						} else {
							console.log('xxxx');
						}
					} else {
						console.log('data tidak terdaftar!');
						return message.author.send('Anda tidak terdaftar!');
						// Aksi jika user chat bot dan tidak terdaftar
					}
					break;
			}
		} else {
			return;
		}
	}

	if (!message.guild || message.author.bot) return;
	if (!message.member) message.member = await message.guild.fetchMember(message);

	let embed = new MessageEmbed()
		.setColor(COLOR)
		.setTimestamp()
		.setFooter(`${NAME} | ${BUILD}`, client.user.displayAvatarURL({ dynamic: true }));

	if (message.content.startsWith(PREFIX)) {
		let args = message.content.substring(PREFIX.length).split(/ +/);
		switch (args[0]) {
			case 'check':
				try {
					const checkCooldown =
						message.guild.member(message.mentions.members.first()) || message.guild.members.cache.get(args[1]);
					let checkUserCooldown = await axios.get(DB_CHECK_USER_COOLDOWN + checkCooldown);
					return message.channel.send(checkUserCooldown.data.message);
				} catch (error) {
					message.channel.send(error.response.data.message);
				}
				break;
			case 'register':
				// Cooldown Check
				let userCooldown = await axios.get(DB_CHECK_USER_COOLDOWN + message.author.id);
				let userCooldownStatus = userCooldown.data.status;
				// End Cooldown Check
				var payload = {};
				const checkGuestRole = message.member.roles.cache.find((r) => r.id === GUEST_ROLE);
				const checkMemberRole = message.member.roles.cache.find((r) => r.id === MEMBER_ROLE);
				const guestChannelOnly = guild.channels.cache.get(VERIFY_QUEUE_CH);
				if (!userCooldownStatus) {
					if (message.channel.id == guestChannelOnly) {
						const response = await axios.get(DB_RANDOM_SELECTION_BASE_URL);
						const { question, id } = response.data[0];
						console.log(question);
						payload.user_id = message.author.id;
						payload.question_order = 1;
						payload.user_tag = message.author.tag;
						payload.user_name = message.author.username;
						payload.user_answer = 'Init Save Data';
						payload.question_id = id;
						payload.wrongcount = 0;
						if (guestChannelOnly) {
							const postResponse = await axios.post(DB_POST_GUEST_BASE_URL, qs.stringify(payload));
							console.log(postResponse.data);
							embed.setTitle('Verification Step');
							embed.setDescription(
								`**${message.member.displayName}**, harap verifikasi diri Anda dengan menjawab pertanyaan yang telah kami kirimkan di DM!`
							);
							message.channel.send(embed);
						}
						if (message.author) {
							embed.setDescription(`**${message.author.username}**, Welcome!`);
							message.author.send(embed).then(() => {
								embed.setTitle('Pertanyaan Pertama');
								embed.setDescription(`${question} **[Y/N]**`);
								message.author.send(embed);
							});
						}
					} else {
						embed.setTitle('Permissions Ditolak');
						embed.setDescription(`**${message.member.displayName}**, Anda telah terdaftar sebagai Member!`);
						return message.channel.send(embed);
					}
				} else {
					message.author.send('Anda sedang dalam keadaan cooldown!\nMohon tunggu beberapa saat!');
				}
				break;
			case 'approve':
				if (message.member.hasPermission('ADMINISTRATOR')) {
					const targetedGuildApprove = client.guilds.cache.get(GUILD_ID);
					const approveMember =
						message.guild.member(message.mentions.members.first()) || message.guild.members.cache.get(args[1]);
					const checkGuestRoleApprove = approveMember.roles.cache.has(GUEST_ROLE);
					const checkMemberRoleApprove = approveMember.roles.cache.has(MEMBER_ROLE);
					const testChannelApprove = targetedGuildApprove.channels.cache.get(VERIFY_SELECTION_CH);
					if (message.channel.id == testChannelApprove.id && checkGuestRoleApprove && !checkMemberRoleApprove) {
						const getThisMessage = await testChannelApprove.messages.fetch();
						getThisMessage.forEach((mess) => {
							for (var i = 0; i < mess.embeds.length; i++) {
								if (mess.embeds[i].description.includes(`ID User : **${approveMember.id}**`)) {
									async function deleteMessage() {
										try {
											console.log(approveMember.id);
											const guestDeleteOnApprove = await axios.get(DB_DELETE_BASE_URL);
											console.log(guestDeleteOnApprove.data);
											mess.delete();
										} catch (err) {
											console.log(err);
										}
									}
									deleteMessage();
									embed.setTitle('Member Verify Approved');
									embed.setDescription(`${approveMember} berhasil didaftarkan sebagai Member!`);
									testChannelApprove.send(embed);
								}
							}
						});
						setTimeout(() => {
							approveMember.roles.add(MEMBER_ROLE);
							console.log('tambah role member');
						}, 500);
						setTimeout(() => {
							approveMember.roles.remove(GUEST_ROLE);
							console.log('hapus role guest');
						}, 2000);
						if (approveMember) {
							embed.setDescription(`Selamat! Anda telah terdaftar di server ${message.guild.name}`);
							return approveMember.send(embed);
						}
					} else {
						console.log('dia sudah member dan bukan guest!');
						embed.setTitle('Permissions Ditolak');
						embed.setDescription(`${approveMember} sudah terdaftar sebagai Member`);
						return testChannelApprove.send(embed);
					}
				} else {
					embed.setTitle('Permissions Ditolak');
					embed.setDescription(
						`**${message.member.displayName}**, Anda tidak memiliki perms untuk menggunakan fitur ini!`
					);
					return message.channel.send(embed);
				}
				break;
			case 'reject':
				if (message.member.hasPermission('ADMINISTRATOR')) {
					let mentionedMember =
						message.guild.member(message.mentions.members.first()) || message.guild.members.cache.get(args[1]);
					let responseStatus;
					let responseMessage;
					try {
						let checkGuestData = await axios.get(DB_GUEST_BASE_URL + '/delete/' + mentionedMember.id);
						responseStatus = checkGuestData.data.status;
						responseMessage = checkGuestData.data.message;
					} catch (error) {
						responseStatus = error.response.data.status;
						responseMessage = error.response.data.message;
					}
					if (responseStatus == 200) {
						console.log('disini ada data');
						let cooldownStatus;
						let cooldownMessage;
						try {
							let postUserCooldown = await axios.get(DB_COOLDOWN_BASE_URL + mentionedMember.id, config);
							cooldownStatus = postUserCooldown.data.status;
							cooldownMessage = postUserCooldown.data.message;
						} catch (error) {
							cooldownStatus = error.response.data.status;
							cooldownMessage = error.response.data.message;
						}
						if (cooldownStatus == 201) {
							return message.channel.send(cooldownMessage);
						} else {
							return message.channel.send(cooldownMessage);
						}
					} else {
						console.log(responseStatus);
						return message.channel.send(responseMessage);
					}
				}
				break;
		}
	}
});

client.login(TOKEN);
