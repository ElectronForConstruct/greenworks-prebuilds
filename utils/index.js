const path = require('path');

const getLibPath = () => {
    return path.join(process.cwd(), 'greenworks', 'lib');
};

module.exports = {
    getLibPath,
}