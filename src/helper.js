const { MessageEmbed, Client } = require('discord.js');
let { readdirSync } = require('fs');
const config = require('../configuration/config');
/**
 * Busca entre la API el usuario especificado por matrícula
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

const universityMsgHeader = (footer = '') =>
    new MessageEmbed()
        .setThumbnail(config.LOGO_URL)
        .setAuthor(config.UNIVERSITY_FULL_NAME, config.LOGO_URL)
        .setFooter(
            `${footer}\n© Copyright 2021 Edgar Uriel Herrera Franco (HappierGore). All rights reserved.`
        );
/**
 * Retornará un embed con todos los datos del usuario seleccionado. Este puede ser buscado por matrícula o al nombrar a un usuario de discord.
 * @param {Object} studentDataAPI Los datos del API del usuario
 * @param {Object} studentDataDB  Los datos de la base de datos del usuario
 * @param {Client.User} studentDiscord Los datos de usuario de discord.
 * @returns {EmbedMessage} Todos los datos de un usuario en un maravilloso embed
 */
const studentResumeEmbed = (studentDataAPI, studentDataDB, studentDiscord) =>
    universityMsgHeader()
        .setTitle(`Resumen del usuario ${studentDiscord.username}`)
        .addFields(createFields(studentDataAPI, true), {
            name: 'Fecha registro',
            value: studentDataDB.FechaRegistro,
            inline: true,
        })
        .setColor(config.COLOR_HINT);

/**
 * Creará un conjunto de objetos con el formato necesario para los fields de los mensajes Embed. {name 'someName', value: 'someValue'}
 * @param {Object} obj Datos del alumno
 * @param {Boolean} line Los fields deberían estar en columnas?
 * @returns {Object} Información del alumno en formato "Field" para mensajes embed
 */
const createFields = function (obj, line = false) {
    const objArr = Object.entries(obj);
    const newObj = objArr.map((el) => {
        return { name: `${firstUpperCase(el[0])}`, value: el[1], inline: line };
    });
    return newObj;
};

/**
 * Convierte la primera letra de la palabra en mayúscula
 * @param {String} word Palabra a modificar
 * @returns La misma palabra pero con la primera letra en mayúsculas
 */
const firstUpperCase = function (word) {
    const first = word.slice(0, 1).toUpperCase();
    return first + word.slice(1);
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

const getDeviceType = (discordUser) =>
    discordUser?.presence?.clientStatus
        ? Object.keys(discordUser.presence.clientStatus).join(' y ')
        : 'invisible mode enabled (no way to know the status)';

module.exports = {
    findUser,
    wait,
    simpleEmbedMSG,
    numberToEmoji,
    createFields,
    firstUpperCase,
    studentResumeEmbed,
    universityMsgHeader,
    getDeviceType,
};
