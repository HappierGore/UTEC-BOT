const { cloneDeep } = require('lodash');
const { Align, getMarkdownTable } = require('markdown-table-ts');
const config = require('../configuration/config.js');
const { firstUpperCase, universityMsgHeader } = require('./helper.js');
class WeekDay {
    constructor(day, dayName) {
        if (!day) {
            this._dayName = 'No specified';
            this._day = {};
            this._hoursFormatted = {};
            this._signaturesFormatted = {};
            return;
        }
        this.dayName = firstUpperCase(dayName);
        this._day = day;
        this.#formatSignatures();
        this.#formatHours();
        this.#dayFormatted();
    }
    get hoursFormatted() {
        return this._hoursFormatted;
    }
    get hoursOriginal() {
        return Object.keys(this._day);
    }
    get signaturesFormatted() {
        return this._signaturesFormatted;
    }
    get signaturesOriginal() {
        return Object.values(this._day);
    }
    get dayOriginal() {
        return this._day;
    }
    get dayFormatted() {
        return this._dayFormatted;
    }
    get dayPosition() {
        switch (this.dayName) {
            case 'Lunes':
                return 1;
            case 'Martes':
                return 2;
            case 'Miercoles':
                return 3;
            case 'Jueves':
                return 4;
            case 'Viernes':
                return 5;
            case 'Sabado':
                return 6;
        }
    }

    #dayFormatted() {
        const newObject = {};
        Object.entries(this._day).forEach((signature, i) => {
            newObject[signature[0]] = this._signaturesFormatted[i];
        });
        this._dayFormatted = newObject;
    }
    #formatSignatures() {
        const materias = Object.values(this._day);
        const result = [];
        materias.forEach((materia) => {
            const mDivided = materia.split(' ');
            let mFixed = ['', ''];
            mDivided.forEach((word) => {
                const nextLength = (mFixed[0] + word).length;
                if (mFixed[0].length < 22 && nextLength < 22 && !mFixed[1])
                    mFixed[0] = `${mFixed[0]} ${word}`;
                else mFixed[1] = `${mFixed[1]} ${word}`;
            });
            mFixed[0] = mFixed[0].trimStart();
            mFixed[1] = mFixed[1].trimStart();
            result.push(mFixed);
        });
        this._signaturesFormatted = result;
    }
    #formatHours() {
        const horas = Object.keys(this._day);
        const hrsFixed = horas.map((h) => [h.slice(0, 13), h.slice(14)]);
        this._hoursFormatted = hrsFixed;
    }
}

/**
 * Crear?? una tabla con todos los horarios de los d??as especificados en base a otra previamente dise??ada con horas y sus separadores
 * @param {Array} row La tabla actual, con la hora y sus separaciones incluidas
 * @param {Array} days Arreglo de los dias a renderizar
 * @param {String} separator separador gen??rico
 * @returns {Array} Tabla completamente renderizada
 */
const renderDays = function (row, days, separator) {
    // Create the full key structure ('12:00 a 12:30 12:30 a 13:00')
    const rowUpdated = cloneDeep(row);

    // Loop on all days array
    days.forEach((day) => {
        // Loop on every row
        row.forEach((hour, i) => {
            // Create key hour, this will help to find the signature corresponding to that hour
            const keyHour = `${row[i]} ${row[i + 1]}`;

            // Add separator if hour is a separator
            if (hour[0] === separator) {
                rowUpdated[i].push(separator);
                return;
            }

            // Prevent unnecessary keys
            if (keyHour.includes(separator)) return;

            // If the current row and the next row is not a separator and there's a signature
            // with that key hour
            if (
                row[i] !== separator &&
                row[i + 1] &&
                row[i + 1][0] !== separator &&
                day.dayOriginal[keyHour]
            ) {
                // Then, insert the signature
                rowUpdated[i].push(day.dayFormatted[keyHour][0]);
                rowUpdated[i + 1].push(day.dayFormatted[keyHour][1]);

                //If there's no signature, then add an empty string
            } else if (!rowUpdated[i][day.dayPosition]) {
                rowUpdated[i].push('');
                rowUpdated[i + 1].push('');
            }
        });
    });
    return rowUpdated;
};

/**
 * Crear?? una tabla con todas las asignaturas y sus respectivos horarios con un buen formato
 * @param {Object} scheduleObj Todo el horario previamente obtenido desde excel
 * @param {Number} page Pagina a desplegar
 * @returns {Array} Tabla creada con todas las materias y horas correspondientes
 */
const createScheduleTable = function (scheduleObj, page = 1, deviceType) {
    const separator = '-'.repeat(18);

    // Get the names of the weekDay since object
    const daysNames = Object.keys(scheduleObj.horario).map((dia) =>
        firstUpperCase(dia)
    );
    // Build table header structure
    const headTable =
        deviceType.includes('desktop') || deviceType.includes('invisible')
            ? [
                  ['Hora', daysNames[0], daysNames[1]],
                  ['Hora', daysNames[2], daysNames[3]],
                  ['Hora', daysNames[4], daysNames[5]],
              ]
            : [
                  ['Hora', daysNames[0]],
                  ['Hora', daysNames[1]],
                  ['Hora', daysNames[2]],
                  ['Hora', daysNames[3]],
                  ['Hora', daysNames[4]],
                  ['Hora', daysNames[5]],
              ];

    // Create all weekdays with WeekDay class
    const lunes = new WeekDay(scheduleObj.horario.lunes, 'lunes');
    const martes = new WeekDay(scheduleObj.horario.martes, 'martes');
    const miercoles = new WeekDay(scheduleObj.horario.miercoles, 'miercoles');
    const jueves = new WeekDay(scheduleObj.horario.jueves, 'jueves');
    const viernes = new WeekDay(scheduleObj.horario.viernes, 'viernes');
    const sabado = new WeekDay(scheduleObj.horario.sabado, 'sabado');

    // Create a set of hours of the schedule, this will take the first class until the last class
    // even if the first start at 16:00 or ends at 13:00. This helps to see only the important hour-range
    const setHours = new Set([
        ...lunes.hoursFormatted.flat(),
        ...martes.hoursFormatted.flat(),
        ...miercoles.hoursFormatted.flat(),
        ...jueves.hoursFormatted.flat(),
        ...viernes.hoursFormatted.flat(),
        ...sabado.hoursFormatted.flat(),
    ]);

    // Order hours ascendant, the logic here is combine the hour and compare, ex:
    // 10:00 will be 1,000; and 11:00 will be 1,100, so, 11:00 is greater tan 10:00
    const orderHours = [...setHours].sort((a, b) => {
        const actual = +`${a.slice(0, 2)}${a.slice(3, 4)}`;
        const next = +`${b.slice(0, 2)}${b.slice(3, 4)}`;
        return actual - next;
    });

    // This will capsule all in-range hours in this format: ['12:00 a 13:00'],['13:00 a 14:00']
    const capsuleHours = orderHours.map((hour) => [hour]);

    // Auxiliar array, this will be used to create the separator
    const separatorHours = [];

    // Create the separator every 2 spaces
    capsuleHours.forEach((hour, i) => {
        if ((i + 1) % 2 === 0) separatorHours.push(hour, [separator]);
        else separatorHours.push(hour);
    });

    // Mobile pages
    // Desktop pages
    if (deviceType.includes('desktop') || deviceType.includes('invisible')) {
        if (page === 1) daysToRender = [lunes, martes];
        if (page === 2) daysToRender = [miercoles, jueves];
        if (page === 3) daysToRender = [viernes, sabado];
    } else {
        switch (page) {
            case 1: {
                daysToRender = [lunes];
                break;
            }
            case 2: {
                daysToRender = [martes];
                break;
            }
            case 3: {
                daysToRender = [miercoles];
                break;
            }
            case 4: {
                daysToRender = [jueves];
                break;
            }
            case 5: {
                daysToRender = [viernes];
                break;
            }
            case 6: {
                daysToRender = [sabado];
                break;
            }
        }
    }

    // Render all signatures in the right hour and save it in a new variable
    const finishedRow = renderDays(
        cloneDeep(separatorHours),
        daysToRender,
        separator
    );

    // Create table
    const table = getMarkdownTable({
        table: {
            head: headTable[page - 1],
            body: [...finishedRow],
        },
        alignment: [Align.Center, Align.Center, Align.Center, Align.Center],
        alignColumns: true,
    });
    return universityMsgHeader(
        'Utiliza ???? para descargar el horario\nUtiliza ???? para cambiar la vista a tel??fono, se recomienda una tama??o de letra del 80% (Ajustes>Apariencia>Escala de fuente)'
    )
        .setColor(config.COLOR_HINT)
        .setDescription(`\`${table}\``)
        .setThumbnail();
};

module.exports = {
    createScheduleTable,
};
