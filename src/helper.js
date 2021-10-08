const { MessageEmbed } = require('discord.js');
let { readdirSync } = require('fs');
/**
 *
 * @param {Number} matricula Matricula a buscar
 * @returns {Object} Información correspondiente a la matricula especificada (Obtenido desde la API)
 */
const findUser = async function (matricula) {
    try {
        for (const file of readdirSync('./dataAPI/')) {
            if (file.endsWith('.json') && file.startsWith(matricula)) {
                //Elimina los últimos cinco caracteres nombre del archivo para
                //deshacerse de la extensión .json y solo quedarnos con la matricula
                const selected = file.substring(0, file.length - 5);
                const fileContents = require(`../dataAPI/${selected}`);
                const student = JSON.parse(JSON.stringify(fileContents));
                return student;
            }
        }
        throw new Error(`Oops, parece que no esta registrada la matrícula **${matricula}** en nuestra base de datos, por favor, revisa que la matrícula sea la correcta. \nSi el problema persiste, por favor, solicita soporte dentro del servidor de la universidad.
    `);
    } catch (err) {
        throw err;
    }
};
const wait = function (seconds) {
    return new Promise(function (resolve) {
        setTimeout(resolve, seconds * 1000);
    });
};
const simpleEmbedMSG = (color, description) =>
    new MessageEmbed().setColor(color).setDescription(description);

const checkCmdInChannel = async function (client, cmd, channelID) {
    const channel = await client.channels.fetch(channelID);
    const idToCheck = await channelID;
    const cmdFx = cmd.content.split(' ')[0];
    if (cmd.channel.id == idToCheck && cmd.guild) return true;
    throw new Error(
        `El comando ${cmdFx} solo puede ser ejecutado en **#${channel.name}** ${
            cmd.channel.type === 'dm'
                ? 'dentro del servidor de la universidad'
                : ''
        }`
    );
};

const numberToEmoji = function (number) {
    const numberArr = number.toString().split('');
    const newNumber = numberArr
        .map((value) => {
            switch (+value) {
                case 0:
                    return ':zero:';
                case 1:
                    return ':one:';
                case 2:
                    return ':two:';
                case 3:
                    return ':three:';
                case 4:
                    return ':four:';
                case 5:
                    return ':five:';
                case 6:
                    return ':six:';
                case 7:
                    return ':seven:';
                case 8:
                    return ':eight:';
                case 9:
                    return ':nine:';
            }
        })
        .join('');
    return newNumber;
};

module.exports = {
    findUser,
    wait,
    simpleEmbedMSG,
    checkCmdInChannel,
    numberToEmoji,
};
