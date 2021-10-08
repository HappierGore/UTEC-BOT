const sqlCommands = require('../src/sqlManager.js');
const rulesJSON = require('../configuration/rules.json');
const config = require('../configuration/config.js');
const { simpleEmbedMSG, numberToEmoji } = require('../src/helper.js');

const loadRules = async function (msg) {
    const rulesFixed = Object.entries(rulesJSON)
        .map((obj, i) => `${numberToEmoji(i + 1)} ${obj[1]}`)
        .join('\n\n');
    const msgToSend = simpleEmbedMSG(config.COLOR_HINT, rulesFixed)
        .setTitle('‼ REGLAS ‼')
        .setFooter('Si tienes alguna recomendación, visita #recomendaciones');

    msg.edit(msgToSend);
};

const loadRuleMessage = async function (client) {
    const ruleChannel = await client.channels.fetch(config.CHANNEL_WELCOME);
    let ruleMessage;
    try {
        ruleMessage = await ruleChannel.messages.fetch(config.MSG_RULES);
        await loadRules(ruleMessage);
    } catch (err) {
        const msg = simpleEmbedMSG(config.COLOR_CONFIRM, 'Loading Data');
        ruleMessage = await ruleChannel.send(msg);
        msg.setDescription(
            `Add this ID in config.js to config RULES\n\n  ${ruleMessage.id}`
        );
        ruleMessage.edit(msg);
        return;
    }
};

module.exports = async (client) => {
    client.user.setPresence({
        status: 'online',
        activity: {
            name: '¡Esperando órdenes!',
            type: 'PLAYING',
        },
    });

    loadRuleMessage(client);

    // SQL Commands
    sqlCommands(client);

    // Loading Rules
    // loadRules();
};
