const config = require('../configuration/config');
const {
    checkArgs,
    checkMinArgsLength,
    checkRoles,
    checkNoDM,
} = require('../src/cmdCheckOuts');
const {
    simpleEmbedMSG,
    findUser,
    studentResumeEmbed,
} = require('../src/helper');

module.exports = async function (client, message, args) {
    const messageAuthor = message.author;
    const errUsage =
        'Debes especificar al usuario, puedes utilizar **@** para nombrar a un usuario o utilizar una **matrícula** a 10 dígitos';
    try {
        // Check if the command is executed inside the server
        checkNoDM(message);

        // Array of roles ID to check
        const rolesToCheck = [config.ROLE_MAESTRO, config.ROLE_STAFF];

        // Names of the roles previously given
        const rolesNames = rolesToCheck
            .map(
                (role) =>
                    message.guild.roles.cache.find((r) => r.id === role).name
            )
            .join(' , ');

        // Check if the author of the command has permissions to execute it
        checkRoles(
            message.member,
            rolesToCheck,
            `No tienes permisos para utilizar este comando, debes tener al menos un rol de los siguientes roles:\n ${rolesNames}`
        );

        // Check the right amount of arguments
        checkArgs(args, 1, errUsage);

        // Check a minimum length for arguments
        checkMinArgsLength(args[0], 10, errUsage);

        // Will take an discordID or studentID
        const searchBy = args[0].length === 10 ? args[0] : args[0].slice(3, -1);

        // Get data from database
        const studentDB = await client.getData.get(searchBy, searchBy);

        // Check if there's studentDB and if the type of search is by student ID
        try {
            if (!studentDB && searchBy.length === 10) {
                // Check if the student ID is registered in the API, if true, get data.
                const noRegistered = await findUser(searchBy);

                // Send an error to notice that this ID exists but nobody's claimed yet.
                throw new Error(
                    `La matrícula **${searchBy}**, perteneciente a **${noRegistered.nombre} ${noRegistered.apellido}** del grupo **${noRegistered.grupo}** aún no ha sido reclamada`
                );
            }
        } catch (err) {
            throw err;
        }
        // Get student discord data
        const studentDiscord = await client.users.fetch(
            searchBy.length === 10 ? studentDB.DiscordID : searchBy
        );

        // If there's no DiscordID, discord user data or StudentID, so send an error
        if (!studentDB && !studentDiscord) throw new Error(errUsage);

        // Create EMBED message with the data gotten previously. If there's not data, then, send a semi-empty message.
        const msgToSend = studentDB
            ? studentResumeEmbed(
                  await findUser(studentDB.Matricula),
                  studentDB,
                  studentDiscord
              )
            : studentResumeEmbed(null, null, studentDiscord).setDescription(
                  'No hay datos disponibles, Este usuario aún no se ha registrado.'
              );

        //   Send info message to who request it
        messageAuthor.send(msgToSend);
    } catch (err) {
        messageAuthor.send(simpleEmbedMSG(config.COLOR_ERROR, err.message));
        console.error(err);
    }
    if (message.channel.type !== 'dm') message.delete();
};
