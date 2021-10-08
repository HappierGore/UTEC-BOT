module.exports = class Miembro {
    /**
     *
     * @param {Object} member This object must have ALL information, even guild
     * @returns {Object} Nicely formatted data (Most used)
     */
    relevantData(member) {
        return {
            id: member.user.id,
            userName: member.user.username,
            lastMessageID: member.user.lastMessageID,
            lasMessageChannelID: member.user.lastMessageChannelID,
            avatar: member.user.avatar,
            _rolesIDs: member._roles,
        };
    }
};
