const { MessageEmbed } = require('discord.js');
const config = require('../config.js');
const { findUser } = require('../src/helper.js');

const validateEmail = (email, matricula) => {
    if (!email.includes(config.DOMAIN))
        throw new Error(
            `Oops, ese formato no es el correcto, recuerda que el correo institucional debe contener el dominio **${config.DOMAIN}**`
        );
    if (matricula.length !== 10)
        throw new Error(
            `Oops, parece que has ingresado mal tu matrícula, recuerda que debe tener 10 dígitos`
        );
};

/**
 *
 * @param {client} client cliente
 * @param {Number} matricula matricula
 * @param {Boolean} checkAvailable Enviará al usuario un mensaje en caso de que esta matrícula esté en uso
 * @returns {Object | Boolean} Si checkAvailable esta desactivado, solamente retornará los datos.
 */
const checkStudentIdAvailable = function (
    client,
    matricula,
    checkAvailable = false
) {
    const data = client.getLogMatricula.get(matricula);
    if (!data) return true;
    if (checkAvailable) {
        throw new Error(
            `Esta matrícula (${matricula}) ya ha sido reclamada por alguien más, si crees que se trata de un error, por favor, solicita soporte en el servidor de la universidad.`
        );
    }
    return data;
};

const checkRegistered = function (client, discordID) {
    const dataObj = client.getData.get(discordID.id);
    if (!dataObj) return false;
    const studentData = {
        DiscordID: dataObj.DiscordID,
        studentData: JSON.parse(dataObj.studentData),
        flags: JSON.parse(dataObj.flags),
    };
    if (studentData?.studentData?.matricula)
        throw new Error(
            `Ya tienes una matrícula registrada **(${studentData.studentData.matricula})**`
        );
    return false;
};

const registerStudent = function (client, studentData, studentDiscordID) {
    const studentDiscord = {
        DiscordID: studentDiscordID,
        studentData: JSON.stringify(studentData),
        flags: JSON.stringify({}),
    };
    client.setData.run(studentDiscord);
    const logMatricula = {
        Matricula: studentData.matricula,
        RegistradaPor: studentDiscordID,
        FechaRegistro: new Date().toLocaleString(),
    };
    client.setLogMatricula.run(logMatricula);
};

const addRoles = async function (studentData, userDiscord) {
    userDiscord.roles.add(config.ALUMNO);
    // Select profession
    switch (studentData.carrera) {
        case 'Ingeniería mecatrónica': {
            userDiscord.roles.add(config.ING_MECATRONICA);
        }
    }
    // Select group
    switch (studentData.grupo) {
        case 'MEC101': {
            userDiscord.roles.add(config.MEC_101);
        }
    }
};

const successRegistered = async function (
    messageToRemove,
    studentData,
    userDiscord
) {
    messageToRemove.delete();
    const msgEmbed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('**🎉 ¡Felicidades! 🎉**')
        .setDescription(
            `La matrícula **${studentData.matricula}** ahora está vinculada a tu cuenta de discord.\nDentro de unos instantes, tus roles serán asignados y tendrás acceso a todo lo relacionado a tu formación profesional. ¡Buena suerte!\n`
        )
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
        )
        .setFooter(
            'No olvides que puedes utilizar !help para ver una lista completa de los comandos con los que te puedo ayudar'
        )
        .setAuthor(
            'Universidad Tecnológica de Tulancingo',
            `${config.LOGO_URL}`
        )
        .setThumbnail(`${config.LOGO_URL}`)
        .setTimestamp();
    userDiscord.send(msgEmbed);
    await addRoles(studentData, userDiscord);
};

module.exports = async function (client, message, args) {
    const user = message.author;

    if (args.length < 1) {
        user.send(
            'Necesitas especificar el correo institucional al que vincularás tu cuenta\nEjemplo: !register 1718114562@utectulancingo.edu.mx'
        );
        message.delete();
        return;
    }

    const email = args[0];
    const matricula = args[0].split('@')[0];
    const userDiscord = message.guild.member(user);

    // Validate email
    try {
        validateEmail(email, matricula);

        // Check if this Student ID is available
        checkRegistered(client, userDiscord);
        checkStudentIdAvailable(client, matricula, true);

        // Get student's data
        const studentData = await findUser(matricula);
        // Create confirm message
        const confirmMessage = await user.send(
            `Esta matrícula *(${studentData.matricula})* pertenece a **${studentData.nombre} ${studentData.apellido}**, del grupo **${studentData.grupo}** \nSi los datos son correctos, selecciona ✅, de lo contrario, selecciona ❌`
        );
        confirmMessage.react('✅');
        confirmMessage.react('❌');

        const collector = confirmMessage.createReactionCollector(
            (_, user) => !user.bot
        );
        await collector.on('collect', async (reaction) => {
            const user = reaction.users.cache.last();
            if (reaction.emoji.name === '✅') {
                // Check if this Student ID is available
                if (checkStudentIdAvailable(client, matricula, true)) {
                    // if (!checkStudentIdAvailable(client, matricula, true)) return;
                    // Register student
                    registerStudent(client, studentData, user.id);

                    successRegistered(confirmMessage, studentData, userDiscord);
                }
                return;
            }
            if (reaction.emoji.name === '❌') {
                confirmMessage.delete();
                user.send(
                    '¡Puedes volver a iniciar el registro cuando quieras!\nSolo visita el canal **#Registro** dentro del servidor de la universidad'
                );
            }
        });
    } catch (err) {
        user.send(err.message);
    }
    message.delete();
};
