const {
    checkNoDM,
    checkArgs,
    checkRegistered,
} = require('../src/cmdCheckOuts.js');
const {
    simpleEmbedMSG,
    findUser,
    universityMsgHeader,
} = require('../src/helper.js');
const { createScheduleTable } = require('../src/scheduleTable');
const config = require('../configuration/config');
const excelManager = require('../src/excelManager.js');

module.exports = async function (client, message, args) {
    const messageAuthor = message.author;
    const errUsage = `El comando **${
        message.content.split(' ')[0]
    }** no requiere ningún argumento extra.`;
    try {
        // Check if the command is executed inside the server
        checkNoDM(message);

        // Check for no arguments
        checkArgs(args, 0, errUsage);

        // Get user discord
        const userDiscord = await message.guild.member(messageAuthor);

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

        // Create the table using only strings
        let scheduleTable = createScheduleTable(schedule).setTitle(
            `Horarios del grupo ${userData.grupo}`
        );

        // Pagination limitations
        let page = 1;
        const pageLimit = [1, 3];

        // Send table
        const msgTable = await messageAuthor.send(scheduleTable);

        // Add reactions
        msgTable.react('👈');
        msgTable.react('🔽');
        msgTable.react('👉');

        // Add collector with dispose enable, this will allow us to listen for remove event
        const collector = msgTable.createReactionCollector(
            (_, user) => !user.bot,
            { dispose: true }
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
                        page
                    ).setTitle(`Horarios del grupo ${userData.grupo}`);
                    msgTable.edit(scheduleTable);
                }
                if (reaction.emoji.name === '👈' && pageLimit[0] < page) {
                    // Update table
                    page--;
                    scheduleTable = createScheduleTable(
                        schedule,
                        page
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
            });
        });
    } catch (err) {
        messageAuthor.send(simpleEmbedMSG(config.COLOR_ERROR, err.message));
        console.error(err);
    }
    if (message.channel.type !== 'dm') message.delete();
};
