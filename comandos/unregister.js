const {
    checkCmdInChannel,
    checkRegistered,
} = require('../src/cmdCheckOuts.js');
const {
    simpleEmbedMSG,
    wait,
    findUser,
    universityMsgHeader,
} = require('../src/helper.js');
const config = require('../configuration/config.js');

const unregisterUser = function (client, userDiscord) {
    client.delData.run(userDiscord.id, -1);
};

const successDeleted = async function (matricula, userDiscord) {
    const studentData = await findUser(matricula);
    const msgEmbed = universityMsgHeader()
        .setColor(config.COLOR_SUCCESS)
        .setDescription(
            `La matrícula **${matricula}** se ha removido de tu cuenta de discord.\nDentro de unos instantes, tus roles serán removidos y perderás el acceso a todos los canales, y ahora serás un invitado.\nPuedes volver a registrarte visitando **#registro** en el servidor`
        )
        .setTitle('**❌ ¡Eliminado! ❌**')
        .addFields(
            {
                name: 'Nombre:',
                value: `${studentData.nombre} ${studentData.apellido}`,
                inline: true,
            },
            { name: 'Área:', value: `${studentData.area}`, inline: true },
            { name: 'Carrera:', value: `${studentData.carrera}`, inline: true },
            { name: 'Grupo', value: `${studentData.grupo}`, inline: true },
            {
                name: 'Cuatrimestre',
                value: `${studentData.cuatrimestre}`,
                inline: true,
            },
            { name: '\u200B', value: '\u200B' }
        );
    userDiscord.send(msgEmbed);
    resetRoles(userDiscord);
};

const resetRoles = function (userDiscord) {
    userDiscord._roles.forEach(async (role) => {
        await userDiscord.roles
            .remove(role)
            .catch((_) =>
                console.warn(
                    `No fue posible remover el rol(es) con la(s) ID: ${role} del usuario ${userDiscord.user.username} con ID: ${userDiscord.id}`
                )
            );
    });
    userDiscord.roles.add(config.ROLE_NEWBIE);
};

module.exports = async function (client, message, args) {
    const messageAuthor = message.author;
    try {
        // Check origin of the command and if it's executed in the right place
        await checkCmdInChannel(client, message, config.CHANNEL_REGISTER);

        //Then, get the user
        const userDiscord = await message.guild.member(messageAuthor);

        // Check if the Discord user has an Student Id registered
        await checkRegistered(client, userDiscord);

        // Get student data
        const dataObj = await client.getData.get(messageAuthor.id, -1);
        const studentData = {
            DiscordID: dataObj.DiscordID,
            Matricula: dataObj.Matricula,
        };

        const confirmMessage = await messageAuthor.send(
            simpleEmbedMSG(
                config.COLOR_CONFIRM,
                `Estas a punto de remover la matricula **${studentData.Matricula}** de tu cuenta de discord.\nPara confirmar, selecciona ✅, de lo contrario, selecciona ❌`
            )
        );

        // Add reactions (Future options)
        confirmMessage.react('✅');
        confirmMessage.react('❌');

        // Create collector from the previous message and filter bot's reactions
        const collector = confirmMessage.createReactionCollector(
            (_, user) => !user.bot
        );

        // Initialize collector's events
        await collector.on('collect', async (reaction) => {
            const user = reaction.users.cache.last();
            if (reaction.emoji.name === '✅') {
                confirmMessage.delete();

                // Remove user from database
                unregisterUser(client, userDiscord);

                // Send success message
                successDeleted(studentData.Matricula, userDiscord);
            }
            if (reaction.emoji.name === '❌') {
                confirmMessage.delete();
                user.send(
                    simpleEmbedMSG(
                        config.COLOR_HINT,
                        'Solicitud de eliminación cancelada'
                    )
                );
            }
            return;
        });
        wait(config.TIME_OUT_UNREGISTER_SEC).then(() => {
            if (!confirmMessage.deleted) {
                confirmMessage.delete();
                messageAuthor.send(
                    simpleEmbedMSG(
                        config.COLOR_ERROR,
                        'Has excedido el tiempo de respuesta para confirmar la eliminación. Prueba de nuevo'
                    )
                );
            }
        });
    } catch (err) {
        messageAuthor.send(simpleEmbedMSG(config.COLOR_ERROR, err.message));
    }
    if (message.channel.type !== 'dm') message.delete();
};
