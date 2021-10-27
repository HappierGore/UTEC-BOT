/**
 * Revisará que la celda actual del buscador se encuentre en columnas específicas
 * @param {Cell} cell Cell to check
 * @param {Array} columns All columns to check
 * @returns {Boolean}
 */
const checkInColumn = function (cell, columns) {
    return columns.some(
        (column) => cell.includes(column) && cell !== `${column}1`
    );
};

/**
 * Obtendrá TODAS las celdas disponibles den una hoja de trabajo
 * @param {WorkSheet} workSheet Hoja de trabajo en la que se trabajará
 * @returns {Array} Todas las celdas disponibles
 */
const getCells = function (workSheet) {
    let cells = [];
    for (let cell in workSheet) {
        cells.push(cell);
    }
    return cells;
};
/**
 * Will create an Object with all data about student's schedule
 * @param {cells} cells Cells of the book
 * @param {workSheet} workSheet Sheet of the book
 * @returns {Object} All information about schedule is nicely formatted in this object
 */
const createScheduleObject = function (cells, workSheet) {
    const schedule = {
        materias: [],
        horario: {
            lunes: {},
            martes: {},
            miercoles: {},
            jueves: {},
            viernes: {},
            sabado: {},
        },
        delDuplicatedSignatures() {
            this.materias = [...new Set(this.materias)];
        },
    };
    cells.forEach((cell) => {
        if (checkInColumn(cell, ['B', 'C', 'D', 'E', 'F', 'G'])) {
            const day = workSheet[`${cell[0]}1`].v.toLowerCase();
            const hora = workSheet[`A${cell.slice(1)}`].v;
            schedule.materias.push(workSheet[cell].v);
            schedule.horario[day][hora] = workSheet[cell].v;
        }
    });
    schedule.delDuplicatedSignatures();
    return schedule;
};
const getSchedule = function (group) {
    // Get library
    const xlsx = require('xlsx');

    // Path of the file (Taken from the group specified)
    const filePath = `.\\localData\\Horario_${group.slice(0, 3)}.xlsx`;

    // Load workBook
    const workBook = xlsx.readFile(filePath);

    // Load workSheet
    const workSheet = workBook.Sheets[group];

    // Get all cells in the workSheet, from monday to saturday
    const cells = getCells(workSheet);

    // Create object with all properties of the workSheet
    const schedule = createScheduleObject(cells, workSheet);

    return schedule;
};

module.exports = {
    getSchedule,
};
