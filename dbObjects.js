const Sequelize = require('sequelize')

// Database - init
const sequelize = new Sequelize("TheSnatcher", process.env.DB_USER, process.env.DB_PSWD, {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    storage: "snatcher.sqlite"
})
const Users = require('./db/Users.js')(sequelize, Sequelize.DataTypes)
const Guilds = require('./db/Guilds.js')(sequelize, Sequelize.DataTypes)
const Tasks = require('./db/Tasks.js')(sequelize, Sequelize.DataTypes)
const UsersTasks = require('./db/UsersTask.js')(sequelize, Sequelize.DataTypes)
const Sessions = require('./db/Session.js')(sequelize, Sequelize.DataTypes)
const Messages = require('./db/Messages.js')(sequelize, Sequelize.DataTypes)




Users.belongsTo(Tasks, { through: UsersTasks, foreignKey: 'user_id', otherKey: 'task_id', otherKey: 'guild_id'})
Tasks.belongsTo(Users, { through: UsersTasks, foreignKey: 'task_id', otherKey: 'user_id', otherKey: 'guild_id'})
Guilds.belongsTo(Guilds, { through: UsersTasks, foreignKey: 'guild_id', otherKey: 'user_id', otherKey: 'task_id'})
Tasks.belongsTo(Guilds, { through: Tasks, foreignKey: 'guild_id', otherKey: 'task_id'})
UsersTasks.belongsTo(Tasks, { foreignKey: 'task_id' })
UsersTasks.belongsTo(Users, { foreignKey: 'user_id' })
UsersTasks.belongsTo(Guilds, { foreignKey: 'guild_id'})
Tasks.belongsTo(Guilds, { foreignKey: 'guild_id'})
module.exports = { Users, Tasks, Guilds, UsersTasks, Sessions, Messages }