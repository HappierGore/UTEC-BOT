const { MessageEmbed } = require('discord.js');
const config = require('../configuration/config.js');
const {
    findUser,
    wait,
    simpleEmbedMSG,
    checkCmdInChannel,
} = require('../src/helper.js');

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
};

const checkArgs = function (args) {
    if (args.length !== 1) {
        throw new Error(
            'Necesitas especificar SOLO el correo institucional al que vincularás tu cuenta\nEjemplo: !register 1718114562@utectulancingo.edu.mx'
        );
    }
};
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

const checkStudentIdAvailable = function (client, matricula) {
    const data = client.getLogMatricula.get(matricula);
    if (data)
        throw new Error(
            `Esta matrícula (**${matricula}**) ya ha sido reclamada por alguien más, si crees que se trata de un error, por favor, solicita soporte en el servidor de la universidad.`
        );
    return true;
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
        .setColor(config.COLOR_SUCCESS)
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
        .setAuthor(config.UNIVERSITY_FULL_NAME, `${config.LOGO_URL}`)
        .setThumbnail(`${config.LOGO_URL}`)
        .setTimestamp();
    userDiscord.send(msgEmbed);
    await addRoles(studentData, userDiscord);
};

// ---------------------------------
// LOGIC STARTS HERE
// ---------------------------------

module.exports = async function (client, message, args) {
    const user = message.author;
    const email = args[0];
    const matricula = args.length > 0 ? args[0].split('@')[0] : '';

    try {
        // Check if the command is executed in "register" channel
        await checkCmdInChannel(client, message, config.CHANNEL_REGISTER);

        //Then, get the user
        const userDiscord = message.guild.member(user);

        // Check if the Discord user has not an Student Id registered
        checkRegistered(client, userDiscord);

        // Check that args has at least, 1 parameter
        checkArgs(args);

        // Validate email
        validateEmail(email, matricula);

        // Check if this Student ID is available
        checkStudentIdAvailable(client, matricula);

        // Get student's data
        const studentData = await findUser(matricula);

        // Create confirm message
        const confirmMessage = await user.send(
            simpleEmbedMSG(
                config.COLOR_CONFIRM,
                `Esta matrícula *(${studentData.matricula})* pertenece a **${studentData.nombre} ${studentData.apellido}**, del grupo **${studentData.grupo}** \nSi los datos son correctos, selecciona ✅, de lo contrario, selecciona ❌`
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
                try {
                    // Check if this Student ID is available
                    if (checkStudentIdAvailable(client, matricula)) {
                        // Register student
                        registerStudent(client, studentData, user.id);

                        // Send success message
                        successRegistered(
                            confirmMessage,
                            studentData,
                            userDiscord
                        );
                    }
                } catch (err) {
                    user.send(simpleEmbedMSG(config.COLOR_ERROR, err.message));
                    confirmMessage.delete();
                }
            }
            if (reaction.emoji.name === '❌') {
                confirmMessage.delete();
                user.send(
                    simpleEmbedMSG(
                        config.COLOR_HINT,
                        '¡Puedes volver a iniciar el registro cuando quieras!\nSolo visita el canal **#Registro** dentro del servidor de la universidad'
                    )
                );
            }
        });
        wait(config.TIME_OUT_REGISTER_SEC).then(() => {
            if (!confirmMessage.deleted) {
                confirmMessage.delete();
                user.send(
                    simpleEmbedMSG(
                        config.COLOR_ERROR,
                        'Has excedido el tiempo de respuesta para registrarte. Prueba de nuevo'
                    )
                );
            }
        });
    } catch (err) {
        user.send(simpleEmbedMSG(config.COLOR_ERROR, err.message));
    }
    if (message.channel.type !== 'dm') message.delete();
};
