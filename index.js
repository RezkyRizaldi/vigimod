/** Variables */
// Locale Modules
// BOT Configuration
const {
	BUILD,
	CHAT_KALEM_CH,
	COLOR,
	DB_CHECK_USER_COOLDOWN,
	DB_CHECK_USER_DATA,
	DB_COOLDOWN_BASE_URL,
	DB_DELETE_BASE_URL,
	DB_FIND_GUEST_QUESTION_ID,
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
	RULES_CH,
	TOKEN,
	VERIFY_SELECTION_CH,
	VERIFY_QUEUE_CH,
} = require('./config.json');

// Third Party Modules
// Discord.js Classes
const {
	Client,
	Collection,
	MessageAttachment,
	MessageEmbed
} = require('discord.js');
const axios = require('axios');
let config = {
	headers: {
		'Content-Type': 'application/json',
	},
};
const qs = require('qs');

// Environment
const client = new Client({
	disableEveryone: true,
});
client.commands = new Collection();
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
						embedAnswer.setTitle(':warning:  Permissions Rejected');
						embedAnswer.setDescription(`**${message.member.displayName}**, Anda sedang dikenakan Cooldown! Harap tunggu selama beberapa jam agar dapat kembali melakukan registrasi.`);
						return message.author.send(embedAnswer);
					} catch (err) {
						console.log(err);
						embedAnswer.setTitle(':bar_chart:  Status Cooldown Removed');
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
							embedAnswer.setTitle(':warning:  Permissions Rejected');
							embedAnswer.setDescription('Harap masukkan jawaban Anda dengan benar dan tepat!');
							return message.author.send(embedAnswer);
						} 

						if (!memberAnswer && checkMemberRole && !checkGuestRole) {
							embedAnswer.setTitle(':warning:  Permissions Rejected');
							embedAnswer.setDescription('Anda telah terdaftar sebagai Member!');
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
										embedAnswer.setTitle(':question:  Pertanyaan Kedua');
										embedAnswer.setDescription(`${question}\n\n*jawablah dengan \`&answer y\` atau \`&answer n\`*`);
										return message.author.send(embedAnswer);
									} else if (question_order == 2) {
										userRegisterData.question_order = question_order + 1;
										userRegisterData.user_answer = memberAnswer;
										userRegisterData.question_id = essayId;
										await axios.post(postGuestUrl, qs.stringify(userRegisterData));
										message.author.send('Jawaban Kedua Terkirim');
										embedAnswer.setTitle(':question:  Pertanyaan Ketiga');
										embedAnswer.setDescription(`${essayQuestion}\n\n*jawab dengan benar dan tepat. mis. \`&answer jawaban saya\`*`);
										return message.author.send(embedAnswer);
									}
								} else if (question_order == 3) {
									userRegisterData.question_order = question_order + 1;
									userRegisterData.user_answer = memberAnswer;
									userRegisterData.question_id = essayId;
									await axios.post(postGuestUrl, qs.stringify(userRegisterData));
									const sendModUserQuestionId = question_id;
									const questionResponse = await axios.get(DB_QUESTION_BASE_URL + sendModUserQuestionId);
									const sendModQuestionData = questionResponse.data.question;
									const sendModUsername = user_name;
									const sendModUserTag = user_tag;
									const sendModUserCreatedAt = updated_at;
									const sendModUserAnswer = memberAnswer;
									const templateApproval = `Ada Guest yang melakukan registrasi dengan data sebagai berikut:\nID User: **${message.author.id}**\nUser Tag: **${sendModUserTag}**\nUsername: **${sendModUsername}**\nTanggal Pendaftaran: **${sendModUserCreatedAt}**\nPertanyaan: **${sendModQuestionData}**\nJawaban: **${sendModUserAnswer}**`;
									const testChannel = guild.channels.cache.get(VERIFY_SELECTION_CH);
									let embedMod = new MessageEmbed();
									embedMod.setColor(COLOR);
									embedMod.setTimestamp();
									embedMod.setFooter(`Created by ${hadat} & ${kiw}`, client.user.displayAvatarURL({ dynamic: true }));
									embedMod.setTitle(':information_source:  New Member Verification');
									embedMod.setDescription(templateApproval);
									testChannel.send(embedMod);
									embedAnswer.setTitle(':white_check_mark:  Verification Steps Success');
									embedAnswer.setDescription('Semua jawaban Anda telah terkirim! Mohon untuk menunggu Moderator dalam me-review jawaban Anda. Terima kasih!');
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
									embedAnswer.setTitle(':repeat_one:  Pertanyaan Diulang');
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
								embedAnswer.setTitle(':negative_squared_cross_mark:  Verification Steps Failed');
								embedAnswer.setDescription('Mohon untuk menunggu **1 Jam** dan registrasi ulang pada channel <#805149942926147584>\nUntuk mengetahui status Cooldown ketikkan Command `&check`\nJika menemukan kendala mengenai BOT, segera hubungi <@&721652835518906379> agar dibantu.');
								return message.author.send(embedAnswer);
							} else {
								return;
							}
						} else {
							embedAnswer.setTitle(':white_check_mark:  Verification Steps Success');
							embedAnswer.setDescription('Semua jawaban Anda telah terkirim! Mohon untuk menunggu Moderator dalam me-review jawaban Anda. Terima kasih!');
							return message.author.send(embedAnswer);
						}
					} else {
						console.log('data tidak terdaftar!');
						embedAnswer.setTitle(':closed_lock_with_key:  Permissions Rejected');
						embedAnswer.setDescription('Anda harus melakukan registrasi terlebih dahulu di <#805149942926147584>');
						message.author.send(embedAnswer);
					}
				break
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
			// case 'translate':
			// 	let payloadTranslate = {}
			// 	let fromLang = args[1];
			// 	let toLang = args[2];
			// 	let content =  args.slice(3).join(' ');
			// 	payloadTranslate.content = content;
			// 	try {
      //     const response = await axios({
      //       method: 'post',
      //       url: "https://vigidb-v2.hadatmtch.net/translate/" + fromLang + "/" + toLang,
      //       data: qs.stringify(payloadTranslate),
      //       headers: {
      //         'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      //       }
      //     });
      //     return message.channel.send(response.data.translatedContent);
      //   } catch (err) {
			// 		return console.log(err);
      //   }
			// 	break
			case 'check':
				const checkCooldown = message.guild.member(message.mentions.members.first()) || message.guild.members.cache.get(args[1]);

				if (!checkCooldown) {
					embed.setTitle(':bust_in_silhouette:  User Not Found');
					embed.setDescription(`**${message.member.displayName}**, harap mention Guest yang ingin dicek!`);
					return verifyQueueCh.send(embed);
				}

				try {
					let checkUserCooldown = await axios.get(DB_CHECK_USER_COOLDOWN + checkCooldown);
					embed.setTitle(':stopwatch:  Cooldown Enable');
					embed.setDescription(`**${checkCooldown}** sedang dalam status Cooldown\n${checkUserCooldown.data.message}`);
					console.log(checkUserCooldown.data.message);
					return verifyQueueCh.send(embed);
				} catch (error) {
					console.log(error.response.data.message);
					embed.setTitle(':stopwatch:  Cooldown Unable');
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
							embed.setTitle(':key:  Verification Steps');
							embed.setDescription(`**${message.member.displayName}**, harap verifikasi diri Anda dengan menjawab pertanyaan yang telah kami kirimkan via DM`);
							message.channel.send(embed);
						}
						if (message.author) {
							embed.setTitle(":key:  Verification Steps");
							embed.setDescription(`**${message.author.username}**, harap jawab pertanyaan-pertanyaan berikut dengan benar dan tepat!`);
							message.author.send(embed).then(() => {
								embed.setTitle(':question:  Pertanyaan Pertama');
								embed.setDescription(`${question}\n\n*jawablah dengan \`&answer y\` atau \`&answer n\`*`);
								setTimeout(() => {
									message.author.send(embed).catch(error => {
										message.channel.send("Akun Anda bermasalah!\n Harap untuk membuka akses dm dari semua user!");
									});
								}, 2000);
							});
						}
					} else {
						embed.setTitle(':closed_lock_with_key:  Permissions Rejected');
						embed.setDescription(`**${message.member.displayName}**, Anda telah terdaftar sebagai Member!`);
						return message.channel.send(embed);
					}
				} else {
					if (cooldownCheckerStatus == true) {
						embed.setTitle(':closed_lock_with_key:  Permissions Rejected');
						embed.setDescription(`**${message.member.displayName}**, Anda sedang dikenakan Cooldown! Harap tunggu selama beberapa jam agar dapat kembali melakukan registrasi.`);
						return message.channel.send(embed);
					} else {
						embed.setTitle(':closed_lock_with_key:  Permissions Rejected');
						embed.setDescription(`**${message.member.displayName}**, Anda telah teregistrasi! Harap lanjutkan proses verifikasi via DM.`);
						return message.channel.send(embed);
					}
				}
				break;
			case 'approve':
				if (message.member.hasPermission('ADMINISTRATOR')) {
					const targetedGuildApprove = client.guilds.cache.get(GUILD_ID);
					const approveMember = message.guild.member(message.mentions.members.first()) || message.guild.members.cache.get(args[1]);
					const testChannelApprove = targetedGuildApprove.channels.cache.get(VERIFY_SELECTION_CH);

					if (!approveMember) {
						embed.setTitle(':warning:  Permissions Rejected');
						embed.setDescription(`**${message.member.displayName}**, harap mention Guest yang ingin diapprove!`);
						return testChannelApprove.send(embed);
					}

					const checkGuestRoleApprove = approveMember.roles.cache.has(GUEST_ROLE);
					const checkMemberRoleApprove = approveMember.roles.cache.has(MEMBER_ROLE);

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
									const guild = client.guilds.cache.get(GUILD_ID);
									const chatKalem = guild.channels.cache.get(CHAT_KALEM_CH);
									const rules = guild.channels.cache.get(RULES_CH);
									
									let chatkalemEmbed = new MessageEmbed()
										.setColor(COLOR)
										.setTimestamp()
										.setFooter(`${NAME} | ${BUILD}`, client.user.displayAvatarURL({ dynamic: true }));

									if (chatKalem) {
										let attachment = new MessageAttachment('./assets/welcome.png', 'welcome.png');
										chatkalemEmbed.attachFiles(attachment);
										chatkalemEmbed.setImage('attachment://welcome.png');
										chatkalemEmbed.setAuthor('New Member', approveMember.user.displayAvatarURL({ dynamic: true }));
										chatkalemEmbed.setDescription(`Welkam di **${message.guild.name}**, **${approveMember.user.username}**! Mohon untuk pahami ${rules} terlebih dahulu, terima kasih.`);
										return chatKalem.send(chatkalemEmbed);
									}
								}
							}
						});
					
						setTimeout(() => {
							embed.setTitle(':white_check_mark:  Member Verify Approved');
							embed.setDescription(`${approveMember} berhasil didaftarkan sebagai Member!`);
							approveMember.roles.add(MEMBER_ROLE);
							console.log('tambah role member');
							message.channel.send(embed);
						}, 2000);
						setTimeout(() => {
							approveMember.roles.remove(GUEST_ROLE);
							console.log('hapus role guest');
						}, 5000);
						if (approveMember) {
							embed.setTitle(":white_check_mark:  Verify Member Approved");
							embed.setDescription(`Selamat! Anda telah terdaftar di server ${message.guild.name}`);
							return approveMember.send(embed);
						}
						
					} else {
						console.log('dia sudah member dan bukan guest!');
						embed.setTitle(':warning:  Permissions Rejected');
						embed.setDescription(`${approveMember} sudah terdaftar sebagai Member`);
						return testChannelApprove.send(embed);
					}
				} else {
					embed.setTitle(':closed_lock_with_key:  Permissions Rejected');
					embed.setDescription(`**${message.member.displayName}**, Anda tidak memiliki perms untuk menggunakan fitur ini!`);
					return message.channel.send(embed);
				}
				break
			case 'reject':
				if (message.member.hasPermission('ADMINISTRATOR')) {
					const targetedGuildReject = client.guilds.cache.get(GUILD_ID);
					const mentionedMember = message.guild.member(message.mentions.members.first()) || message.guild.members.cache.get(args[1]);
					const testChannelReject = targetedGuildReject.channels.cache.get(VERIFY_SELECTION_CH);

					if (!mentionedMember) {
						embed.setTitle(':warning:  Permissions Rejected');
						embed.setDescription(`**${message.member.displayName}**, harap mention Guest yang ingin direject!`);
						return testChannelReject.send(embed);
					}

					const checkGuestRoleReject = mentionedMember.roles.cache.has(GUEST_ROLE);
					const checkMemberRoleReject = mentionedMember.roles.cache.has(MEMBER_ROLE);
					let responseStatus;
					let responseMessage;
					if (message.channel.id == testChannelReject.id && checkGuestRoleReject && !checkMemberRoleReject) {
						try {
							let checkGuestData = await axios.get(DB_DELETE_BASE_URL + mentionedMember.id);
							responseStatus = checkGuestData.data.status;
							responseMessage = checkGuestData.data.message;
						} catch (error) {
							responseStatus = error.response.data.status;
							responseMessage = error.response.data.message;
						}

						embed.setTitle(':negative_squared_cross_mark:  Member Verify Rejected');
						embed.setDescription('Jawaban Anda sepertinya tidak memenuhi kriteria atau Anda tidak serius menjawabnya! Mohon untuk menunggu Cooldown selama **1 Jam** untuk kembali registrasi ulang. Mohon maaf.');
						mentionedMember.send(embed);
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
							embed.setTitle(':negative_squared_cross_mark:  Member Verify Rejected');
							embed.setDescription(`${mentionedMember} telah berhasil direject. ${cooldownMessage}`);
							return testChannelReject.send(embed);
						} else {
							embed.setTitle(':stopwatch:  Cooldown Unable');
							embed.setDescription(cooldownMessage);
							return testChannelReject.send(embed);
						}
					} else {
						console.log(responseStatus);
						embed.setTitle(':bust_in_silhouette:  User Not Found');
						embed.setDescription(responseMessage);
						return testChannelReject.send(embed);
					}
				}
			break
		}
	}
});

client.login(TOKEN);