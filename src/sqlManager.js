const SQLite = require('better-sqlite3');
const sql = new SQLite('./localData/studentsDiscord.db');
const sqlCommands = function (client) {
    // Obtener datos
    client.getData = sql.prepare(
        'SELECT * FROM DiscordStudentsData WHERE DiscordID = ? OR Matricula = ?'
    );
    // Establecer datos
    client.setData = sql.prepare(
        'INSERT OR REPLACE INTO DiscordStudentsData (DiscordID, Matricula, FechaRegistro, flags) VALUES (@DiscordID, @Matricula, @FechaRegistro, @flags);'
    );
    // Eliminar datos
    client.delData = sql.prepare(
        'DELETE FROM DiscordStudentsData WHERE DiscordID = ? OR Matricula = ?'
    );
};
module.exports = sqlCommands;
