"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async create(createUserDto) {
        const { username, phone, email, password } = createUserDto, userData = __rest(createUserDto, ["username", "phone", "email", "password"]);
        const existingUserByUsername = await this.userRepository.findOne({
            where: { username },
        });
        if (existingUserByUsername) {
            throw new common_1.ConflictException('用户名已存在');
        }
        const existingUserByPhone = await this.userRepository.findOne({
            where: { phone },
        });
        if (existingUserByPhone) {
            throw new common_1.ConflictException('手机号已存在');
        }
        if (email) {
            const existingUserByEmail = await this.userRepository.findOne({
                where: { email },
            });
            if (existingUserByEmail) {
                throw new common_1.ConflictException('邮箱已存在');
            }
        }
        let driverCode = userData.driverCode;
        if (createUserDto.userType === user_entity_1.UserType.DRIVER && !driverCode) {
            driverCode = await this.generateDriverCode();
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = this.userRepository.create(Object.assign(Object.assign({}, userData), { username,
            phone,
            email, password: hashedPassword, driverCode, status: createUserDto.status || user_entity_1.UserStatus.ACTIVE }));
        const savedUser = await this.userRepository.save(user);
        delete savedUser.password;
        return savedUser;
    }
    async findAllWithPagination(searchDto) {
        const { page = 1, pageSize = 10, username, realName, phone, email, userType } = searchDto;
        const queryBuilder = this.userRepository.createQueryBuilder('user');
        if (username) {
            queryBuilder.andWhere('user.username LIKE :username', { username: `%${username}%` });
        }
        if (realName) {
            queryBuilder.andWhere('user.realName LIKE :realName', { realName: `%${realName}%` });
        }
        if (phone) {
            queryBuilder.andWhere('user.phone LIKE :phone', { phone: `%${phone}%` });
        }
        if (email) {
            queryBuilder.andWhere('user.email LIKE :email', { email: `%${email}%` });
        }
        if (userType) {
            queryBuilder.andWhere('user.userType = :userType', { userType });
        }
        queryBuilder.orderBy('user.createdAt', 'DESC');
        const skip = (page - 1) * pageSize;
        queryBuilder.skip(skip).take(pageSize);
        const [users, total] = await queryBuilder.getManyAndCount();
        users.forEach(user => delete user.password);
        return {
            users,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    async findAll() {
        const users = await this.userRepository.find({
            order: { createdAt: 'DESC' },
        });
        users.forEach(user => delete user.password);
        return users;
    }
    async findDrivers() {
        const drivers = await this.userRepository.find({
            where: { userType: user_entity_1.UserType.DRIVER },
            order: { createdAt: 'DESC' },
        });
        drivers.forEach(driver => delete driver.password);
        return drivers;
    }
    async getRoles() {
        return [
            {
                value: user_entity_1.UserType.ADMIN,
                label: '管理员',
                description: '系统管理员，拥有所有权限',
                permissions: ['manage:all'],
            },
            {
                value: user_entity_1.UserType.DRIVER,
                label: '司机',
                description: '配送司机，可以查看客户信息和提交打卡记录',
                permissions: ['read:customer', 'create:checkin', 'read:profile', 'update:profile'],
            },
            {
                value: user_entity_1.UserType.SALES,
                label: '销售人员',
                description: '销售人员，可以管理客户信息',
                permissions: ['manage:customer', 'read:driver', 'read:checkin', 'read:profile', 'update:profile'],
            },
        ];
    }
    async findById(id) {
        const user = await this.userRepository.findOne({
            where: { id },
        });
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        delete user.password;
        return user;
    }
    async findByUsername(username) {
        return this.userRepository.findOne({
            where: { username },
        });
    }
    async findByPhone(phone) {
        const user = await this.userRepository.findOne({
            where: { phone },
        });
        if (user) {
            delete user.password;
        }
        return user;
    }
    async update(id, updateUserDto) {
        const user = await this.findById(id);
        const { password, username, phone, email } = updateUserDto, updateData = __rest(updateUserDto, ["password", "username", "phone", "email"]);
        if (username && username !== user.username) {
            const existingUser = await this.userRepository.findOne({
                where: { username },
            });
            if (existingUser && existingUser.id !== id) {
                throw new common_1.ConflictException('用户名已存在');
            }
        }
        if (phone && phone !== user.phone) {
            const existingUser = await this.userRepository.findOne({
                where: { phone },
            });
            if (existingUser && existingUser.id !== id) {
                throw new common_1.ConflictException('手机号已存在');
            }
        }
        if (email && email !== user.email) {
            const existingUser = await this.userRepository.findOne({
                where: { email },
            });
            if (existingUser && existingUser.id !== id) {
                throw new common_1.ConflictException('邮箱已存在');
            }
        }
        Object.assign(user, Object.assign(Object.assign({}, updateData), { username, phone, email }));
        if (password) {
            user.password = await bcrypt.hash(password, 12);
        }
        const updatedUser = await this.userRepository.save(user);
        delete updatedUser.password;
        return updatedUser;
    }
    async batchRemove(ids) {
        if (!ids || ids.length === 0) {
            throw new common_1.NotFoundException('请提供要删除的用户ID');
        }
        const result = await this.userRepository.delete(ids);
        if (result.affected === 0) {
            throw new common_1.NotFoundException('没有找到要删除的用户');
        }
    }
    async remove(id) {
        const result = await this.userRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException('用户不存在');
        }
    }
    async updateLastLoginAt(id) {
        await this.userRepository.update(id, {
            lastLoginAt: new Date(),
        });
    }
    async findByWechatOpenid(openid) {
        const user = await this.userRepository.findOne({
            where: { wechatOpenid: openid },
        });
        return user;
    }
    async validatePassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
    async generateDriverCode() {
        const prefix = 'D';
        let code;
        let exists = true;
        let counter = 1;
        while (exists) {
            code = `${prefix}${counter.toString().padStart(3, '0')}`;
            const existingDriver = await this.userRepository.findOne({
                where: { driverCode: code },
            });
            exists = !!existingDriver;
            counter++;
        }
        return code;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map