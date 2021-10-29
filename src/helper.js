const { MessageEmbed, Client } = require('discord.js');
let { readdirSync } = require('fs');
const { cloneDeep } = require('lodash');
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

const formatTime = function (timeSeg) {
    // Minutes
    let seconds, minutes, hours, days, weeks;

    if (timeSeg > 60) {
        minutes = Math.floor(timeSeg / 60);
        seconds = timeSeg % 60;
        if (minutes > 60) {
            hours = Math.floor(minutes / 60);
            minutes = minutes % 60;
            if (hours > 24) {
                days = Math.floor(hours / 24);
                hours = hours % 24;
                if (days > 7) {
                    weeks = Math.floor(days / 7);
                    days = days % 7;
                }
            }
        }
    } else {
        seconds = timeSeg;
    }
    const weeksText = `${weeks ? `${weeks} semana` : ''}`;
    const daysText = `${days ? `${days} día` : ''}`;
    const hoursText = `${hours ? `${hours} hora` : ''}`;
    const minutesText = `${minutes ? `${minutes} minuto` : ''}`;
    const secondsText = `${seconds ? `${seconds} segundo` : ''}`;
    const texts = [weeksText, daysText, hoursText, minutesText, secondsText];

    const filteredTexts = texts.filter((txt) => txt);
    const newTexts = filteredTexts.map((txt, i) => {
        const nText = +txt.split(' ')[0] > 1 ? `${txt}s` : txt;
        if (txt && filteredTexts.length - 2 > i) return `${nText},`;
        if (filteredTexts.length - 1 === i) return `y ${nText}`;
        return nText;
    });
    return newTexts.join(' ').trim();
};

const checkCooldown = function (cooldowns, message, userDiscord, timeSeg) {
    const command = message.content.slice(1);
    const prefix = message.content[0];

    const commandInfo = {};

    const updateData = function (data) {
        data[command] = Date.now() + timeSeg * 1000;
    };

    if (!cooldowns.has(userDiscord.id)) {
        updateData(commandInfo);
        cooldowns.set(userDiscord.id, cloneDeep(commandInfo));
        // console.log(`${command} Condition 1 `, cooldowns.get(userDiscord.id));
        return;
    }
    const cmdUserData = cooldowns.get(userDiscord.id);

    if (!cmdUserData[command]) {
        updateData(cmdUserData);
        // console.log(`${command} Condition 2 `, cooldowns.get(userDiscord.id));
        return;
    }

    if (cmdUserData[command] > Date.now()) {
        const timeRemaining = Math.floor(
            (cmdUserData[command] - Date.now()) / 1000
        );
        // console.log(`${command} Condition 3 `, cooldowns.get(userDiscord.id));
        throw new Error(
            `Has usado el comando **${prefix}${command}** recientemente, por favor, espera ${formatTime(
                timeRemaining
            )} antes de volver a utilizarlo 😊`
        );
    } else {
        // console.log(`${command} Condition 4 `, cooldowns.get(userDiscord.id));
        updateData(cmdUserData);
    }
};
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
    checkCooldown,
    formatTime,
};
