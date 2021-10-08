const SQLite = require('better-sqlite3');
const sql = new SQLite('./localData/studentsDiscord.db');

module.exports = async (client) => {
    client.user.setPresence({
        status: 'online',
        activity: {
            name: '¡Esperando órdenes!',
            type: 'PLAYING',
        },
    });

    // SQL Commands
    client.getData = sql.prepare(
        'SELECT * FROM DiscordStudentsData WHERE DiscordID = ?'
    );

    client.setData = sql.prepare(
        'INSERT OR REPLACE INTO DiscordStudentsData (DiscordID, studentData, flags) VALUES (@DiscordID, @studentData, @flags);'
    );

    client.getLogMatricula = sql.prepare(
        'SELECT * FROM MatriculasRegistradas WHERE Matricula = ?'
    );

    client.setLogMatricula = sql.prepare(
        'INSERT OR REPLACE INTO MatriculasRegistradas (Matricula, RegistradaPor, FechaRegistro) VALUES (@Matricula, @RegistradaPor, @FechaRegistro);'
    );
};
