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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const bcrypt = __importStar(require("bcryptjs"));
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async create(createUserDto) {
        const existingUser = await this.usersRepository.findOne({
            where: { username: createUserDto.username },
        });
        if (existingUser) {
            throw new common_1.ConflictException('用户名已存在');
        }
        const existingPhone = await this.usersRepository.findOne({
            where: { phone: createUserDto.phone },
        });
        if (existingPhone) {
            throw new common_1.ConflictException('手机号已存在');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = this.usersRepository.create(Object.assign(Object.assign({}, createUserDto), { password: hashedPassword }));
        return this.usersRepository.save(user);
    }
    async findAll() {
        return this.usersRepository.find({
            select: ['id', 'username', 'realName', 'phone', 'userType', 'status', 'createdAt'],
            order: { createdAt: 'DESC' },
        });
    }
    async findById(id) {
        const user = await this.usersRepository.findOne({
            where: { id },
            select: ['id', 'username', 'realName', 'phone', 'userType', 'status', 'avatar', 'driverCode', 'lastLoginAt', 'createdAt'],
        });
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        return user;
    }
    async findByUsername(username) {
        return this.usersRepository.findOne({
            where: { username },
        });
    }
    async findByWechatOpenid(openid) {
        return this.usersRepository.findOne({
            where: { wechatOpenid: openid },
            select: ['id', 'username', 'realName', 'phone', 'userType', 'status', 'wechatOpenid'],
        });
    }
    async update(id, updateUserDto) {
        const user = await this.findById(id);
        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        if (updateUserDto.username && updateUserDto.username !== user.username) {
            const existingUser = await this.usersRepository.findOne({
                where: { username: updateUserDto.username },
            });
            if (existingUser) {
                throw new common_1.ConflictException('用户名已存在');
            }
        }
        if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
            const existingPhone = await this.usersRepository.findOne({
                where: { phone: updateUserDto.phone },
            });
            if (existingPhone) {
                throw new common_1.ConflictException('手机号已存在');
            }
        }
        await this.usersRepository.update(id, updateUserDto);
        return this.findById(id);
    }
    async updateLastLoginAt(id) {
        await this.usersRepository.update(id, {
            lastLoginAt: new Date(),
        });
    }
    async bindWechatOpenid(id, openid) {
        await this.usersRepository.update(id, {
            wechatOpenid: openid,
        });
        return this.findById(id);
    }
    async remove(id) {
        const user = await this.findById(id);
        await this.usersRepository.remove(user);
    }
    async validatePassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }
    async findDrivers() {
        return this.usersRepository.find({
            where: { userType: user_entity_1.UserType.DRIVER, status: user_entity_1.UserStatus.ACTIVE },
            select: ['id', 'username', 'realName', 'phone', 'driverCode'],
            order: { createdAt: 'DESC' },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map