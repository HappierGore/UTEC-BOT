const config = require('../configuration/config.js');
const { simpleEmbedMSG } = require('../src/helper.js');

module.exports = (client, member) => {
    console.log(member);
    member.roles.add(config.NEWBIE_ROLE_ID);
    const welcomeMessage = simpleEmbedMSG(
        config.COLOR_SUCCESS,
        `¡Bienvenido **${member.user.username}** al servidor de la **${config.UNIVERSITY_FULL_NAME}**!\nEste servidor fue creado para *brindar* una *mejor organización* para toda la institución.\nPara comenzar, primero deberás **registrarte** con tu **correo institucional**, visita el canal **#registro** para comenzar.\nSi eres *ajeno a la institucion* no te preocupes, aún podrás acceder como *invitado* a los eventos públicos que la universidad constantemente transmite.`
    )
        .setFooter(
            'No olvides que puedes utilizar !help para ver una lista completa de los comandos con los que te puedo ayudar'
        )
        .setTitle('¡Bienvenid@! 👋')
        .addFields({ name: '\u200B', value: '\u200B' })
        .setAuthor(config.UNIVERSITY_FULL_NAME)
        .setThumbnail(config.LOGO_URL);
    member.send(welcomeMessage);
};
