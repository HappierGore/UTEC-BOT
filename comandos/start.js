const Miembro = require('../src/Miembro');

//Esta función recibe el parametro client, message y args para ser usados
module.exports = async (client, message, args) => {
    const memberData = new Miembro();
    if (!message.member) return;
    const userData = memberData.relevantData(message.member);

    const messageToSend = `
    ¡Hola ${userData.userName}!
Soy un bot creado para ayudar a la administración de esta universidad.
Para comenzar, por favor, registra tu correo institucional respondiendo en el chat:

**!register *correo institucional* **

Ejemplo:
!register 1718253697@utectulancingo.edu.mx
    `;

    await message.author.send(messageToSend);
};
