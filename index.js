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
const fs = require('fs');
const Canvas = require('canvas');

// Environment
const client = new Client({
	disableEveryone: true,
});
client.commands = new Collection();

// BOT Configuration
const {
	BUILD,
	CHAT_KALEM_CH,
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
	JOINED_LOG_CH,
	MEMBER_ROLE,
	NAME,
	PREFIX,
	RULES_CH,
	TOKEN,
	VERIFY_SELECTION_CH,
	VERIFY_QUEUE_CH,
	DB_COOLDOWN_BASE_URL,
	DB_FIND_GUEST_QUESTION_ID,
	DB_CHECK_USER_COOLDOWN,
	DB_CHECK_USER_DATA,
} = require('./config.json');
/** End Variables */

/** Events */
// On Ready
client.on('ready', () => {
	console.log(`${client.user.username} ${BUILD} hurung bos!`);
	setInterval(() => {
		client.user
			.setActivity(`${BUILD}`, {
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
	const hadatt = guild.members.cache.find((r) => r.id === '196669286260015114');
	const kiww = guild.members.cache.find((r) => r.id === '530963824396992514');
	const hadat = hadatt.user.username;
	const kiw = kiww.displayName;
	let embedAnswer = new MessageEmbed()
		.setColor(COLOR)
		.setTimestamp()
		.setFooter(`Created by ${hadat} & ${kiw}`, client.user.displayAvatarURL({ dynamic: true }));

	if (message.channel.type === 'dm') {
		if (message.content.startsWith(`${PREFIX}`)) {
			let args = message.content.substring(PREFIX.length).split(/ +/);
			switch (args[0]) {
				case 'check':
					try {
						let checkUserCooldownStatus = await axios.get(DB_CHECK_USER_COOLDOWN + message.author.id);
						console.log(checkUserCooldownStatus.data);
						embedAnswer.setTitle('Permissions Ditolak');
						embedAnswer.setDescription(
							`**${message.member.displayName}**, Anda sedang dikenakan Cooldown! Harap tunggu selama beberapa jam agar dapat kembali melakukan registrasi.`
						);
						return message.author.send(embedAnswer);
					} catch (err) {
						console.log(err);
						embedAnswer.setTitle('Status Cooldown Removed');
						embedAnswer.setDescription('Anda sudah bisa melakukan registrasi ulang.');
						message.author.send(embedAnswer);
					}
					break;
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

						let memberAnswer = args.slice(1).join(' ');
						console.log(memberAnswer);
						if (!memberAnswer) {
							embedAnswer.setTitle('Permissions Ditolak');
							embedAnswer.setDescription('Harap masukkan jawaban Anda dengan benar dan tepat!');
							return message.author.send(embedAnswer);
						}

						if (question_order <= 3) {
							if (wrongcount < 3) {
								console.log(defaultAnswer);
								console.log(memberAnswer);
								if (memberAnswer.toLowerCase() == defaultAnswer) {
									userRegisterData.user_id = message.author.id;
									userRegisterData.user_tag = message.author.tag;
									userRegisterData.user_name = message.author.username;
									if (question_order == 1) {
										const getSecondarySelectionUrl = DB_SECONDARY_SELECTION_BASE_URL + question_id;
										const secondarySelectionData = await axios.get(getSecondarySelectionUrl);
										const { question, id } = secondarySelectionData.data[0];
										userRegisterData.question_order = question_order + 1;
										userRegisterData.user_answer = memberAnswer;
										userRegisterData.question_id = id;
										await axios.post(postGuestUrl, qs.stringify(userRegisterData));
										message.author.send('Jawaban Pertama Terkirim');
										embedAnswer.setTitle('Pertanyaan Kedua');
										embedAnswer.setDescription(`${question}\n\n*jawablah dengan \`&answer y\` atau \`&answer n\`*`);
										return message.author.send(embedAnswer);
									} else if (question_order == 2) {
										userRegisterData.question_order = question_order + 1;
										userRegisterData.user_answer = memberAnswer;
										userRegisterData.question_id = essayId;
										await axios.post(postGuestUrl, qs.stringify(userRegisterData));
										message.author.send('Jawaban Kedua Terkirim');
										embedAnswer.setTitle('Pertanyaan Ketiga');
										embedAnswer.setDescription(
											`${essayQuestion}\n\n*jawab dengan benar dan tepat. mis. \`&answer jawaban saya\`*`
										);
										return message.author.send(embedAnswer);
									}
								} else if (question_order == 3) {
									userRegisterData.question_order = question_order + 1;
									userRegisterData.user_answer = memberAnswer;
									userRegisterData.question_id = essayId;
									await axios.post(postGuestUrl, qs.stringify(userRegisterData));
									const sendModUserQuestionId = question_id;
									const questionResponse = await axios.get(DB_QUESTION_BASE_URL + sendModUserQuestionId);
									const sendModQuestionData = questionResponse.data.question; // Send This instead of id
									const sendModUsername = user_name;
									const sendModUserTag = user_tag;
									const sendModUserCreatedAt = updated_at;
									const sendModUserAnswer = memberAnswer;
									const templateApproval = `Ada Guest yang melakukan registrasi dengan data sebagai berikut:\nID User : **${message.author.id}**\nUser Tag : **${sendModUserTag}**\nUsername : **${sendModUsername}**\nTanggal Pendaftaran: **${sendModUserCreatedAt}**\nDengan pertanyaan : **${sendModQuestionData}**\nJawaban: **${sendModUserAnswer}**`;
									const testChannel = guild.channels.cache.get(VERIFY_SELECTION_CH);
									let embedMod = new MessageEmbed();
									embedMod.setTitle('New Member Verification');
									embedMod.setDescription(templateApproval);
									testChannel.send(embedMod);
									embedAnswer.setTitle('Verification Steps Success');
									embedAnswer.setDescription(
										'Semua jawaban Anda telah terkirim! Mohon untuk menunggu Moderator dalam me-review jawaban Anda. Terima kasih!'
									);
									return message.author.send(embedAnswer);
								} else {
									const getSecondarySelectionUrl = DB_SECONDARY_SELECTION_BASE_URL + question_id;
									const secondarySelectionData = await axios.get(getSecondarySelectionUrl);
									const { question, id } = secondarySelectionData.data[0];
									let incrementWrongCount = wrongcount + 1;
									userRegisterData.question_id = id;
									userRegisterData.wrongcount = incrementWrongCount;
									const responseWrong = await axios.post(postWrongUrl, qs.stringify(userRegisterData));
									console.log(responseWrong);
									message.author.send('jawaban tidak tepat!');
									embedAnswer.setTitle('Pertanyaan Diulang');
									embedAnswer.setDescription(`${question}\n\n*jawablah dengan \`&answer y\` atau \`&answer n\`*`);
									return message.author.send(embedAnswer);
								}
							} else if (wrongcount == 3) {
								try {
									let postToCooldown = await axios.get(DB_COOLDOWN_BASE_URL + message.author.id);
									console.log(postToCooldown.data);
								} catch (error) {
									console.log(error.response.data);
								}
								embedAnswer.setTitle('Verification Steps Failed');
								embedAnswer.setDescription(
									'Mohon untuk menunggu **1 Jam** dan registrasi ulang pada channel <#805149942926147584>\nUntuk mengetahui status Cooldown ketikkan Command `&check`\nJika menemukan kendala mengenai BOT, segera hubungi <@&721652835518906379> agar dibantu.'
								);
								return message.author.send(embedAnswer);
							} else {
								return;
							}
						} else {
							embedAnswer.setTitle('Verification Steps Success');
							embedAnswer.setDescription(
								'Semua jawaban Anda telah terkirim! Mohon untuk menunggu Moderator dalam me-review jawaban Anda. Terima kasih!'
							);
							return message.author.send(embedAnswer);
						}
					} else {
						console.log('data tidak terdaftar!');
						embedAnswer.setTitle('Permissions Ditolak');
						embedAnswer.setDescription('Anda harus melakukan registrasi terlebih dahulu di <#805149942926147584>');
						message.author.send(embedAnswer);
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
		.setFooter(`Created by ${hadat} & ${kiw}`, client.user.displayAvatarURL({ dynamic: true }));

	if (message.content.startsWith(PREFIX)) {
		let args = message.content.substring(PREFIX.length).split(/ +/);
		const verifyQueueCh = guild.channels.cache.get(VERIFY_SELECTION_CH);
		switch (args[0]) {
			case 'check':
				const checkCooldown =
					message.guild.member(message.mentions.members.first()) || message.guild.members.cache.get(args[1]);

				if (!checkCooldown) {
					embed.setTitle('Permissions Ditolak');
					embed.setDescription(`**${message.member.displayName}**, harap mention Guest yang ingin dicek!`);
					return verifyQueueCh.send(embed);
				}

				try {
					let checkUserCooldown = await axios.get(DB_CHECK_USER_COOLDOWN + checkCooldown);
					embed.setTitle('Cooldown Enable');
					embed.setDescription(`**${checkCooldown}** sedang dalam status Cooldown\n${checkUserCooldown.data.message}`);
					console.log(checkUserCooldown.data.message);
					return verifyQueueCh.send(embed);
				} catch (error) {
					console.log(error.response.data.message);
					embed.setTitle('Cooldown Unable');
					embed.setDescription(`**${checkCooldown}** tidak terdaftar dalam list Cooldown`);
					verifyQueueCh.send(embed);
				}
				break;
			case 'register':
				let checkerStatus;
				let cooldownCheckerStatus;
				// Check if user exists
				try {
					let checkUser = await axios.get(DB_CHECK_USER_DATA + message.author.id);
					checkerStatus = checkUser.data.status;
				} catch (error) {
					checkerStatus = error.response.data.status;
				}
				// End user check
				// Check user cooldown
				try {
					let checkUserCooldown = await axios.get(DB_CHECK_USER_COOLDOWN + message.author.id);
					cooldownCheckerStatus = checkUserCooldown.data.status;
				} catch (error) {
					cooldownCheckerStatus = error.response.data.status;
				}
				if (checkerStatus != 200 && cooldownCheckerStatus != true) {
					// Cooldown Check
					let userCooldownStatus;
					try {
						let userCooldown = await axios.get(DB_CHECK_USER_COOLDOWN + message.author.id);
						userCooldownStatus = userCooldown.data.status;
					} catch (error) {
						userCooldownStatus = error.response.data.status;
					}
					// End Cooldown Check
					var payload = {};
					const checkGuestRole = message.member.roles.cache.has(GUEST_ROLE);
					const checkMemberRole = message.member.roles.cache.has(MEMBER_ROLE);
					const guestChannelOnly = guild.channels.cache.get(VERIFY_QUEUE_CH);
					if (message.channel.id == guestChannelOnly && checkGuestRole && !checkMemberRole) {
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
								`**${message.member.displayName}**, harap verifikasi diri Anda dengan menjawab pertanyaan yang telah kami kirimkan via DM!`
							);
							message.channel.send(embed);
						}
						if (message.author) {
							embed.setDescription(`**${message.author.username}**, Welcome!`);
							message.author.send(embed).then(() => {
								embed.setTitle('Pertanyaan Pertama');
								embed.setDescription(`${question}\n\n*jawablah dengan \`&answer y\` atau \`&answer n\`*`);
								message.author.send(embed);
							});
						}
					} else {
						embed.setTitle('Permissions Ditolak');
						embed.setDescription(`**${message.member.displayName}**, Anda telah terdaftar sebagai Member!`);
						return message.channel.send(embed);
					}
				} else {
					if (cooldownCheckerStatus == true) {
						embed.setTitle('Permissions Ditolak');
						embed.setDescription(
							`**${message.member.displayName}**, Anda sedang dikenakan Cooldown! Harap tunggu selama beberapa jam agar dapat kembali melakukan registrasi.`
						);
						return message.channel.send(embed);
					} else {
						embed.setTitle('Permissions Ditolak');
						embed.setDescription(
							`**${message.member.displayName}**, Anda telah teregistrasi! Harap lanjutkan proses verifikasi via DM.`
						);
						return message.channel.send(embed);
					}
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

					if (!approveMember) {
						embed.setTitle('Permissions Ditolak');
						embed.setDescription(`**${message.member.displayName}**, harap mention Guest yang ingin diapprove!`);
						return testChannelApprove.send(embed);
					}

					if (message.channel.id == testChannelApprove.id && checkGuestRoleApprove && !checkMemberRoleApprove) {
						const getThisMessage = await testChannelApprove.messages.fetch();
						getThisMessage.forEach((mess) => {
							for (var i = 0; i < mess.embeds.length; i++) {
								if (mess.embeds[i].description.includes(approveMember.id)) {
									async function deleteMessage() {
										try {
											console.log(approveMember.id);
											const guestDeleteOnApprove = await axios.get(DB_DELETE_BASE_URL + approveMember.id);
											console.log(guestDeleteOnApprove.data);
											if (mess.deletable) mess.delete();
										} catch (err) {
											console.log(err);
										}
									}
									deleteMessage();
									let attachment;
									createCanvas();
									const guild = client.guilds.cache.get(GUILD_ID);
									const chatKalem = guild.channels.cache.get(CHAT_KALEM_CH);
									const joinedLog = guild.channels.cache.get(JOINED_LOG_CH);
									const rules = guild.channels.cache.get(RULES_CH);
									async function createCanvas() {
										const canvas = Canvas.createCanvas(1024, 500);
										const ctx = canvas.getContext('2d');
										const background = await Canvas.loadImage('./assets/server/joined_log.png');
										let x = 0;
										let y = 0;
										ctx.drawImage(background, x, y, canvas.width, canvas.height);

										const avatar = await Canvas.loadImage(approveMember.user.displayAvatarURL({ format: 'jpg' }));
										x = canvas.width / 2 - avatar.width / 2 - 50;
										y = 35;
										ctx.drawImage(avatar, x, y, 250, 250);

										// ctx.beginPath();
										// ctx.arc(x, y, 155, 0, Math.PI * 2, true);
										// ctx.closePath();
										// ctx.clip();

										ctx.fillStyle = '#ffffff';
										ctx.strokeStyle = '#000000';
										ctx.lineWidth = 4;
										ctx.font = 'bold 72px Corporate Logo Rounded';
										let text = 'Welcome';
										x = canvas.width / 2 - ctx.measureText(text).width / 2 - 20;
										ctx.fillText(text.toUpperCase(), x, 245 + avatar.height);
										ctx.strokeText(text.toUpperCase(), x, 245 + avatar.height);
										ctx.fill();
										ctx.stroke();

										ctx.font = 'bold 48px Corporate Logo Rounded';
										text = `${approveMember.user.tag}`;
										x = canvas.width / 2 - ctx.measureText(text).width / 2;
										ctx.fillText(text, x, 300 + avatar.height);

										ctx.font = 'bold 32px Corporate Logo Rounded';
										text = `Member ke-${guild.memberCount}`;
										x = canvas.width / 2 - ctx.measureText(text).width / 2;
										ctx.fillText(text, x, 340 + avatar.height);
										//

										attachment = new MessageAttachment(canvas.toBuffer(), './assets/joined_log.png', 'joined_log.png');
									}
									let joinEmbed = new MessageEmbed()
										.setColor(COLOR)
										.setTimestamp()
										.attachFiles(attachment)
										.setImage('attachment://joined_log.png')
										.setDescription(
											`Welkam di **${message.guild.name}**, **${approveMember.user.username}**! Mohon untuk pahami ${rules} terlebih dahulu, terima kasih.`
										)
										.setFooter(`${NAME} | ${BUILD}`, client.user.displayAvatarURL({ dynamic: true }));
									joinedLog.send(joinEmbed);

									let chatkalemEmbed = new MessageEmbed()
										.setColor(COLOR)
										.setTimestamp()
										.setFooter(`${NAME} | ${BUILD}`, client.user.displayAvatarURL({ dynamic: true }));

									if (chatKalem) {
										let attachment = new MessageAttachment('./assets/welcome.png', 'welcome.png');
										chatkalemEmbed.attachFiles(attachment);
										chatkalemEmbed.setImage('attachment://welcome.png');
										chatkalemEmbed.setAuthor('New Member', approveMember.user.displayAvatarURL({ dynamic: true }));
										chatkalemEmbed.setDescription(
											`Welkam di **${message.guild.name}**, **${approveMember.user.username}**! Mohon untuk pahami ${rules} terlebih dahulu, terima kasih.`
										);
										return chatKalem.send(chatkalemEmbed);
									}

									embed.setTitle('Member Verify Approved');
									embed.setDescription(`${approveMember} berhasil didaftarkan sebagai Member!`);
									testChannelApprove.send(embed);
								}
							}
						});
						setTimeout(() => {
							approveMember.roles.add(MEMBER_ROLE);
							console.log('tambah role member');
						}, 2000);
						setTimeout(() => {
							approveMember.roles.remove(GUEST_ROLE);
							console.log('hapus role guest');
						}, 5000);
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
					const targetedGuildReject = client.guilds.cache.get(GUILD_ID);
					const mentionedMember =
						message.guild.member(message.mentions.members.first()) || message.guild.members.cache.get(args[1]);
					const checkGuestRoleReject = mentionedMember.roles.cache.has(GUEST_ROLE);
					const checkMemberRoleReject = mentionedMember.roles.cache.has(MEMBER_ROLE);
					const testChannelReject = targetedGuildReject.channels.cache.get(VERIFY_SELECTION_CH);
					let responseStatus;
					let responseMessage;

					if (!mentionedMember) {
						embed.setTitle('Permissions Ditolak');
						embed.setDescription(`**${message.member.displayName}**, harap mention Guest yang ingin direject!`);
						return testChannelReject.send(embed);
					}

					if (message.channel.id == testChannelReject.id && checkGuestRoleReject && !checkMemberRoleReject) {
						try {
							let checkGuestData = await axios.get(DB_DELETE_BASE_URL + mentionedMember.id);
							responseStatus = checkGuestData.data.status;
							responseMessage = checkGuestData.data.message;
						} catch (error) {
							responseStatus = error.response.data.status;
							responseMessage = error.response.data.message;
						}
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
							if (mentionedMember) {
								embed.setTitle('Permissions Ditolak');
								embed.setDescription(
									'Jawaban Anda sepertinya tidak memenuhi kriteria atau Anda tidak serius menjawabnya! Mohon untuk menunggu Cooldown selama **1 Jam** untuk kembali registrasi ulang. Terima kasih!'
								);
								mentionedMember.send(embed);
							}
							embed.setTitle('Permissions Ditolak');
							embed.setDescription(cooldownMessage);
							return testChannelReject.send(embed);
						} else {
							embed.setTitle('Cooldown Unable');
							embed.setDescription(cooldownMessage);
							return testChannelReject.send(embed);
						}
					} else {
						console.log(responseStatus);
						embed.setTitle('User Tidak Ditemukan');
						embed.setDescription(responseMessage);
						return testChannelReject.send(embed);
					}
				}
				break;
		}
	}
});

client.login(TOKEN);
