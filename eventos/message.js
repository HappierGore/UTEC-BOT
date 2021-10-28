const config = require('../configuration/config.js');
const { simpleEmbedMSG } = require('../src/helper.js');
//Esta función se activara por cada mensaje enviado en un canal por el usuario:
module.exports = (client, message) => {
    if (!message.content.startsWith(client.config.prefix)) return;
    if (message.author.bot) return;
    // Definiendo los argumentos y comandos.
    const args = message.content
        .slice(client.config.prefix.length)
        .trim()
        .split(/ +/g);
    const command = args.shift().toLowerCase();

    // Manejando los eventos.
    const cmd = client.comandos.get(command); // Obtiene el comando de la colección client.commandos

    // Si no hay comandos, borrar mensaje y notificar inexistencia
    if (!cmd) {
        message.delete();
        message.author.send(
            simpleEmbedMSG(
                config.COLOR_ERROR,
                `El comando **${
                    message.content.split(' ')[0]
                }** no existe, utiliza **!help** para ver todos los comandos disponibles`
            )
        );
        return;
    }

    // Ejecuta el comando enviando el client, el mensaje y los argumentos.
    cmd(client, message, args);
};
