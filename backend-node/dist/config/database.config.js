"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
const user_entity_1 = require("../users/entities/user.entity");
const role_entity_1 = require("../roles/entities/role.entity");
const permission_entity_1 = require("../permissions/entities/permission.entity");
const customer_entity_1 = require("../customers/entities/customer.entity");
exports.databaseConfig = {
    type: 'mysql',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 3306,
    username: process.env.DATABASE_USERNAME || 'root',
    password: process.env.DATABASE_PASSWORD || '123456',
    database: process.env.DATABASE_NAME || 'logistics_db',
    entities: [user_entity_1.User, role_entity_1.Role, permission_entity_1.Permission, customer_entity_1.Customer],
    synchronize: false,
    logging: true,
    timezone: '+08:00',
    charset: 'utf8mb4',
};
//# sourceMappingURL=database.config.js.map