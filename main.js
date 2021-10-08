const Discord = require('discord.js');
const client = new Discord.Client({ ws: { intents: Discord.Intents.PRIVILEDGED } });

let { readdirSync } = require('fs');

client.config = require('./config.js');
client.comandos = new Discord.Collection();
//Controlador de comandos
for (const file of readdirSync('./comandos/')) {

  //Esta condición evitara que los archivos que no son tengan la extención .js no sean listado:
  if (file.endsWith(".js")) {

    //Elimina los últimos tres caracteres nombre del archivo para
    //deshacerse de la extensión .js y solo quedarnos con el nombre del comando:
    let fileName = file.substring(0, file.length - 3);

    //Define una nueva varible 'fileContents' de la exportación del comando 
    //dentro de la carpeta comandos:
    let fileContents = require(`./comandos/${file}`);

    //Agrega el nombre del comando a la colección client.commands con un 
    //valor de sus exportaciones respectivas.
    client.comandos.set(fileName, fileContents);
  }
}
//Controlador de eventos
for (const file of readdirSync('./eventos/')) {

  //Esto condicion evitara que los archivos que no son archivos .js no coleccione:
  if (file.endsWith(".js")) {

    //Elimina los últimos tres caracteres nombre del archivo para
    //deshacerse de la extensión .js y solo quedarnos con el nombre del evento:
    let fileName = file.substring(0, file.length - 3);

    //Define una nueva variable 'fileContents' de la exportación del evento dentro de la carpeta eventos:
    let fileContents = require(`./eventos/${file}`);
    // Cuando el evento se activa o es solicitada exportamos la función con 
    // el nombre del evento vinculada y tambien el parametro client.
    client.on(fileName, fileContents.bind(null, client));

    // Elimina la memoria caché del archivo requerido para facilitar la recarga y no 
    // tener más memoria de la necesaria.
    delete require.cache[require.resolve(`./eventos/${file}`)];
  }
}
//Propiedad login
client.login(client.config.token)
  .then(() => {
    console.log(`Estoy listo, soy ${client.user.tag}`);
  })
  .catch((err) => {
    console.error(err)
    console.error("Error al iniciar")
  })
