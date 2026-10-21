const Sequelize = require('sequelize')

// Database - init
const sequelize = new Sequelize("TheSnatcher", process.env.DB_USER, process.env.DB_PSWD, {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    storage: "snatcher.sqlite"
})

require('./db/Tasks.js')(sequelize, Sequelize.DataTypes)
require('./db/Guilds.js')(sequelize, Sequelize.DataTypes)
require('./db/Users.js')(sequelize, Sequelize.DataTypes)
require('./db/UsersTask.js')(sequelize, Sequelize.DataTypes)
require('./db/Session.js')(sequelize, Sequelize.DataTypes)
require('./db/Messages.js')(sequelize,Sequelize.DataTypes)

const force = process.argv.includes('--force') || process.argv.includes('-f')

sequelize
    .sync({force})
    .then(async () => {
        console.log('Database synced')
        sequelize.close()
    })
    .catch(console.error)