const excelManager = require('../src/excelManager.js');
module.exports = async function (client, message, args) {
    excelManager.getSchedule('MEC101');
};
