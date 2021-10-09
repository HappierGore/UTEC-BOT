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
                ? 'dentro del servidor de la universidad'
                : ''
        }`
    );
};
/**
 * Revisará si el usuario de discord se encuentra actualmente registrado con una matrícula estudiantil en la base de datos.
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
 * @returns {Boolean | Error} Falso si no esta registrado, Error si existe registro.
 */
const checkRegistered = async function (client, discordID, matricula = -1) {
    const dataObj = await client.getData.get(discordID.id, matricula);
    if (dataObj) return true;
    throw new Error(
        `Necesitas tener tu cuenta registrada para hacer esto.\nVisita **#registro** para registrar tu cuenta.`
    );
};
/**
 *
 * @param {String} args Argumentos del comando
 * @param {Number} exactLength Cantidad de argumentos a revisar (Exacto)
 * @param {String} errorMsg Mensaje de error en caso de no contar con la condición
 * @returns {Error} Retornará un error si no se cumple la condición
 */
const checkArgs = function (args, exactLength, errorMsg) {
    if (args.length !== exactLength) {
        throw new Error(errorMsg);
    }
};
module.exports = {
    checkCmdInChannel,
    checkNoRegistered,
    checkRegistered,
    checkArgs,
};
