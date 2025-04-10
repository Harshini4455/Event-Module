const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('yourpassword', 10);
console.log('ADMIN_PASSWORD_HASH=' + hash);