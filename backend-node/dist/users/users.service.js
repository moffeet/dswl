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
const user_entity_1 = require("./entities/user.entity");
const role_entity_1 = require("../roles/entities/role.entity");
const bcrypt = __importStar(require("bcryptjs"));
let UsersService = class UsersService {
    constructor(userRepository, roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }
    async create(createUserDto) {
        const existingUser = await this.userRepository.findOne({
            where: { username: createUserDto.username }
        });
        if (existingUser) {
            throw new common_1.ConflictException('用户名已存在');
        }
        if (createUserDto.phone) {
            const existingPhone = await this.userRepository.findOne({
                where: { phone: createUserDto.phone }
            });
            if (existingPhone) {
                throw new common_1.ConflictException('手机号已存在');
            }
        }
        if (createUserDto.email) {
            const existingEmail = await this.userRepository.findOne({
                where: { email: createUserDto.email }
            });
            if (existingEmail) {
                throw new common_1.ConflictException('邮箱已存在');
            }
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
        const user = this.userRepository.create(Object.assign(Object.assign({}, createUserDto), { password: hashedPassword, status: createUserDto.status || 'normal' }));
        const savedUser = await this.userRepository.save(user);
        if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
            const roles = await this.roleRepository.find({
                where: { id: (0, typeorm_2.In)(createUserDto.roleIds) }
            });
            savedUser.roles = roles;
            await this.userRepository.save(savedUser);
        }
        return await this.findOne(savedUser.id);
    }
    async findAll(searchDto) {
        const { page = 1, size = 10 } = searchDto, filters = __rest(searchDto, ["page", "size"]);
        const where = {};
        if (filters.username) {
            where.username = (0, typeorm_2.Like)(`%${filters.username}%`);
        }
        if (filters.nickname) {
            where.nickname = (0, typeorm_2.Like)(`%${filters.nickname}%`);
        }
        if (filters.phone) {
            where.phone = (0, typeorm_2.Like)(`%${filters.phone}%`);
        }
        if (filters.email) {
            where.email = (0, typeorm_2.Like)(`%${filters.email}%`);
        }
        if (filters.gender) {
            where.gender = filters.gender;
        }
        if (filters.status) {
            where.status = filters.status;
        }
        const [users, total] = await this.userRepository.findAndCount({
            where,
            relations: ['roles'],
            skip: (page - 1) * size,
            take: size,
            order: { createTime: 'DESC' }
        });
        return { users, total };
    }
    async findOne(id) {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['roles']
        });
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        return user;
    }
    async findByUsername(username) {
        return await this.userRepository.findOne({
            where: { username }
        });
    }
    async update(id, updateUserDto) {
        const user = await this.findOne(id);
        if (updateUserDto.username && updateUserDto.username !== user.username) {
            const existingUser = await this.userRepository.findOne({
                where: { username: updateUserDto.username }
            });
            if (existingUser) {
                throw new common_1.ConflictException('用户名已存在');
            }
        }
        if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
            const existingPhone = await this.userRepository.findOne({
                where: { phone: updateUserDto.phone }
            });
            if (existingPhone) {
                throw new common_1.ConflictException('手机号已存在');
            }
        }
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingEmail = await this.userRepository.findOne({
                where: { email: updateUserDto.email }
            });
            if (existingEmail) {
                throw new common_1.ConflictException('邮箱已存在');
            }
        }
        if (updateUserDto.password) {
            const salt = await bcrypt.genSalt(10);
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
        }
        const { roleIds } = updateUserDto, updateData = __rest(updateUserDto, ["roleIds"]);
        await this.userRepository.update(id, updateData);
        if (roleIds !== undefined) {
            try {
                const updatedUser = await this.userRepository.findOne({
                    where: { id },
                    relations: ['roles']
                });
                if (!updatedUser) {
                    throw new common_1.NotFoundException('更新后的用户不存在');
                }
                if (roleIds.length > 0) {
                    const roles = await this.roleRepository.find({
                        where: { id: (0, typeorm_2.In)(roleIds) }
                    });
                    updatedUser.roles = roles;
                }
                else {
                    updatedUser.roles = [];
                }
                await this.userRepository.save(updatedUser);
            }
            catch (error) {
                console.error('角色更新失败:', error);
            }
        }
        return await this.findOne(id);
    }
    async remove(id) {
        const user = await this.findOne(id);
        await this.userRepository.remove(user);
    }
    async validateUser(username, password) {
        const user = await this.findByUsername(username);
        if (user && await bcrypt.compare(password, user.password)) {
            return user;
        }
        return null;
    }
    async findByWechatOpenid(openid) {
        return await this.userRepository.findOne({
            where: { wechatOpenid: openid },
            relations: ['roles']
        });
    }
    async createWechatUser(openid) {
        const user = this.userRepository.create({
            username: `wx_${openid.slice(-8)}`,
            password: '',
            nickname: '微信用户',
            wechatOpenid: openid,
            status: 'normal'
        });
        return await this.userRepository.save(user);
    }
    async updateLoginInfo(userId, updateData) {
        await this.userRepository.update(userId, updateData);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map