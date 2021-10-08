const config = require('../config.js');
const Miembro = require('../src/Miembro.js');

module.exports = (client, member) => {
    const memberData = new Miembro();
    const data = memberData.relevantData(member);
    member.roles.add(config.NEWBIE_ROLE_ID);
};
