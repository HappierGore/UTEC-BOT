const {
    checkNoDM,
    checkArgs,
    checkRegistered,
} = require('../src/cmdCheckOuts.js');
const {
    simpleEmbedMSG,
    findUser,
    universityMsgHeader,
    getDeviceType,
    wait,
    checkCooldown,
} = require('../src/helper.js');
const { createScheduleTable } = require('../src/scheduleTable');
const config = require('../configuration/config');
const excelManager = require('../src/excelManager.js');

module.exports = async function (client, message, args) {
    const cmdName = message.content.split(' ')[0];
    const messageAuthor = message.author;
    const errUsage = `El comando **${cmdName}** no requiere ningún argumento extra.`;
    try {
        // Check if the command is executed inside the server
        checkNoDM(message);

        // Check for no arguments
        checkArgs(args, 0, errUsage);

        //Then, get the user
        const userDiscord = await message.guild.member(messageAuthor);

        // Check cooldown
        checkCooldown(
            client.cmdCooldowns,
            message,
            userDiscord,
            config.LIFETIME_SCHEDULE_SEC
        );

        // Check that the user is already registered
        await checkRegistered(client, userDiscord, -1);

        // Get user data from database
        const dataObj = await client.getData.get(messageAuthor.id, -1);

        // Student ID
        const matricula = dataObj.Matricula;

        // Get student data from API
        const userData = await findUser(matricula);

        // Get object nicely formatted from excel book
        const schedule = excelManager.getSchedule(userData.grupo);

        let deviceType = getDeviceType(userDiscord);
        // Create the table using only strings
        let scheduleTable = createScheduleTable(
            schedule,
            1,
            deviceType
        ).setTitle(`Horarios del grupo ${userData.grupo}`);

        // Pagination limitations
        let page = 1;
        let pageLimit =
            deviceType.includes('desktop') || deviceType.includes('invisible')
                ? [1, 3]
                : [1, 6];

        // Send table
        const msgTable = await messageAuthor.send(scheduleTable);

        // Add reactions
        msgTable.react('👈');
        msgTable.react('🔽');
        msgTable.react('👉');
        msgTable.react('📱');

        // Add collector with dispose enable, this will allow us to listen for remove event
        const collector = msgTable.createReactionCollector(
            (_, user) => !user.bot,
            { dispose: true, time: config.LIFETIME_SCHEDULE_SEC * 1000 }
        );

        // List of events to listen
        const pageEvents = ['remove', 'collect'];
        // Initialize collector's events
        pageEvents.forEach(async (e) => {
            await collector.on(e, async (reaction) => {
                if (reaction.emoji.name === '👉' && pageLimit[1] > page) {
                    page++;
                    // Update table
                    scheduleTable = createScheduleTable(
                        schedule,
                        page,
                        deviceType
                    ).setTitle(`Horarios del grupo ${userData.grupo}`);
                    msgTable.edit(scheduleTable);
                }
                if (reaction.emoji.name === '👈' && pageLimit[0] < page) {
                    // Update table
                    page--;
                    scheduleTable = createScheduleTable(
                        schedule,
                        page,
                        deviceType
                    ).setTitle(`Horarios del grupo ${userData.grupo}`);
                    msgTable.edit(scheduleTable);
                }
                if (reaction.emoji.name === '🔽') {
                    // Download schedule
                    // prettier-ignore
                    const filePath = `.\\localData\\Horario_${userData.grupo.slice(0, 3)}.xlsx`;
                    const msg = universityMsgHeader()
                        .setColor(config.COLOR_HINT)
                        .setDescription(
                            '¡Aquí está el horario de tu carrera!\nPuedes solicitarlo siempre que lo requieras 😉'
                        );
                    msgTable.delete();
                    messageAuthor.send(msg);
                    // Send the schedule.xls file
                    messageAuthor.send({
                        files: [
                            {
                                attachment: filePath,
                                // prettier-ignore
                                name: `Horario de ${userData.grupo.slice(0, 3)}.xlsx`,
                            },
                        ],
                    });
                }
                if (reaction.emoji.name === '📱') {
                    if (e === pageEvents[1]) {
                        deviceType = 'phone';
                        pageLimit = [1, 6];
                    } else {
                        deviceType = 'desktop';
                        pageLimit = [1, 3];
                    }
                    page = 1;
                    scheduleTable = createScheduleTable(
                        schedule,
                        page,
                        deviceType
                    ).setTitle(`Horarios del grupo ${userData.grupo}`);
                    msgTable.edit(scheduleTable);
                }
            });
        });
        wait(config.LIFETIME_SCHEDULE_SEC).then(() => {
            if (!msgTable.deleted) {
                msgTable.delete();
                messageAuthor.send(
                    simpleEmbedMSG(
                        config.COLOR_HINT,
                        `El horario previamente solicitado ha caducado.\nPuedes volver a solicitar otro utilizando **${cmdName}** dentro del servidor de la universidad`
                    )
                );
            }
        });
    } catch (err) {
        messageAuthor.send(simpleEmbedMSG(config.COLOR_ERROR, err.message));
    }
    if (message.channel.type !== 'dm') message.delete();
};
