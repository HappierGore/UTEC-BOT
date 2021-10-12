const { Client } = require('discord.js');
const config = require('../configuration/config');

/**
 * Revisará que el comando solamente sea ejecutado en un canal en específico.
 * @param {Client} client Cliente de discord
 * @param {String} cmd comando utilizado
 * @param {Number} channelID ID del canal a verificar
 * @returns {Boolean | Error} True si el comando es ejecutado donde debe, error si no.
 */
const checkCmdInChannel = async function (client, cmd, channelID) {
    const channel = await client.channels.fetch(channelID);
    const idToCheck = await channelID;
    const cmdFx = cmd.content.split(' ')[0];
    if (cmd.channel.id == idToCheck && cmd.guild) return true;
    throw new Error(
        `El comando **${cmdFx}** solo puede ser ejecutado en **#${
            channel.name
        }** ${
            cmd.channel.type === 'dm'
                ? `dentro del servidor de la ${config.UNIVERSITY_FULL_NAME}`
                : ''
        }`
    );
};
/**
 * Revisará si el usuario de discord NO se encuentra actualmente registrado con una matrícula estudiantil en la base de datos.
 * @param {Client} client Cliente de discord
 * @param {Number} discordID ID del miembro a verificar
 * * @param {Number} matricula Si prefieres buscar por matricula
 * @returns {Boolean | Error} Falso si no esta registrado, Error si existe registro.
 */
const checkNoRegistered = async function (client, discordID, matricula = -1) {
    const dataObj = await client.getData.get(discordID.id, matricula);
    if (!dataObj) return false;
    const studentData = {
        DiscordID: dataObj.DiscordID,
        Matricula: dataObj.Matricula,
    };
    throw new Error(
        `Ya tienes una matrícula registrada **(${studentData.Matricula})**`
    );
};

/**
 * Revisará si el usuario de discord se encuentra actualmente registrado con una matrícula estudiantil en la base de datos.
 * @param {Client} client Cliente de discord
 * @param {Number} discordID ID del miembro a verificar
 * @param {Number} matricula Si prefieres buscar por matricula
 * @returns {Boolean | Error} Verdadero si esta registrado, Error si no existe registro.
 */
const checkRegistered = async function (client, discordID, matricula = -1) {
    const dataObj = await client.getData.get(discordID.id, matricula);
    if (dataObj) return true;
    throw new Error(
        `Necesitas tener tu cuenta registrada para hacer esto.\nVisita **#registro** para registrar tu cuenta.`
    );
};
/**
 * Revisará que el tamaño de los argumentos (Arreglo) sea de un tamaño exacto.
 * @param {Array} args Argumentos del comando
 * @param {Number} exactLength Cantidad de argumentos a revisar (Exacto)
 * @param {String} errorMsg Mensaje de error en caso de no contar con la condición
 * @returns {Error} Retornará un error si no se cumple la condición
 */
const checkArgs = function (args, exactLength, errorMsg) {
    if (args.length !== exactLength) {
        throw new Error(errorMsg);
    }
};

/**
 * Revisará que el argumento tenga un tamaño mínimo.
 * @param {String} args Argumentos del comando
 * @param {Number} minValue Tamaño mínimo del argumento
 * @param {String} errorMsg Mensaje de error en caso de no cumplir con la condición
 */
const checkMinArgsLength = function (args, minValue, errorMsg) {
    if (args.length < minValue) {
        throw new Error(errorMsg);
    }
};

/**
 * Revisará si un usuario tiene un rol asignado.
 * @param {Client.user} discordUser El usuario a quien revisarás los permisos
 * @param {Array} rolesID Arreglo de todos los roles a los que revisar
 * @param {String} errorMsg Mensaje de error
 * @returns {Error} En caso de no contar con el permiso.
 */
const checkRoles = function (discordUser, rolesID, errorMsg) {
    if (!rolesID.some((role) => discordUser.roles.cache.has(role))) {
        throw new Error(errorMsg);
    }
};

/**
 * Revisará si el comando está siendo ejecutado dentro del servidor de la universidad
 * @param {String} message Comando a revisar
 * @returns {Error} En caso de que el commando sea ejecutado fuera del servidor, se enviará un error
 */
const checkNoDM = function (message) {
    if (message.channel.type === 'dm')
        throw new Error(
            `El comando **${
                message.content.split(' ')[0]
            }** sólo puede ser utilizado dentro del servidor de la **${
                config.UNIVERSITY_FULL_NAME
            }**`
        );
};
module.exports = {
    checkCmdInChannel,
    checkNoRegistered,
    checkRegistered,
    checkArgs,
    checkMinArgsLength,
    checkRoles,
    checkNoDM,
};
