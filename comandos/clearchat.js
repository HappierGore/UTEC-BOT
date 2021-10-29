const config = require('../configuration/config');
const { checkNoDM, checkArgs, checkRoles } = require('../src/cmdCheckOuts.js');
const { simpleEmbedMSG, wait, checkCooldown } = require('../src/helper.js');
module.exports = async function (client, message, args) {
    const messageAuthor = message.author;
    const errUsage = `El comando **${
        message.content.split(' ')[0]
    }** debe tener al menos 1 argumento. Por ejemplo: \n!clearChat **all** */* **3**`;
    try {
        // Check if the command is executed inside the server
        checkNoDM(message);

        // Check for one argument
        checkArgs(args, 1, errUsage);

        //Then, get the user
        const userDiscord = await message.guild.member(messageAuthor);

        // Check cooldown
        checkCooldown(client.cmdCooldowns, message, userDiscord, 30);

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
            userDiscord,
            rolesToCheck,
            `No tienes permisos para utilizar este comando, debes tener al menos uno de los siguientes roles:\n ${rolesNames}`
        );

        let resume;
        let size = args[0];
        if (size === 'all') {
            const msgAmount = await message.channel.messages.fetch();
            await message.channel.bulkDelete(msgAmount);
            resume = await message.channel.send(
                msgAmount.size - 1 === 0
                    ? 'No hay mensajes que eliminar'
                    : `¡Se han eliminado ${msgAmount.size - 1} mensajes!`
            );
        } else if (+size > 0) {
            size = +size;
            if (size > 100)
                throw new Error(
                    'Solo se pueden eliminar 100 mensajes a la vez'
                );
            const msgAmount = await message.channel.messages.fetch();
            size = size > msgAmount.size ? msgAmount.size : size + 1;
            await message.channel.bulkDelete(size);
            resume = await message.channel.send(
                size - 1 === 0
                    ? 'No hay mensajes que eliminar'
                    : `¡Se han eliminado ${size - 1} mensajes!`
            );
        } else {
            throw new Error(errUsage);
        }

        wait(5).then(() => {
            if (!resume.deleted) resume.delete();
        });
    } catch (err) {
        messageAuthor.send(simpleEmbedMSG(config.COLOR_ERROR, err.message));
        console.error(err);
        if (message.channel.type !== 'dm') message.delete();
    }
};
