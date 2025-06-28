import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number;
            username: string;
            nickname?: string;
            phone?: string;
            email?: string;
            gender?: "male" | "female";
            status: "normal" | "disabled";
            avatar?: string;
            lastLoginTime?: Date;
            lastLoginIp?: string;
            createBy?: number;
            createTime: Date;
            updateTime: Date;
            roles: import("../roles/entities/role.entity").Role[];
        };
    }>;
    findAll(searchDto: SearchUserDto): Promise<{
        code: number;
        message: string;
        data: {
            list: {
                id: number;
                username: string;
                nickname?: string;
                phone?: string;
                email?: string;
                gender?: "male" | "female";
                status: "normal" | "disabled";
                avatar?: string;
                lastLoginTime?: Date;
                lastLoginIp?: string;
                createBy?: number;
                createTime: Date;
                updateTime: Date;
                roles: import("../roles/entities/role.entity").Role[];
            }[];
            total: number;
            page: number;
            size: number;
        };
    }>;
    findOne(id: number): Promise<{
        code: number;
        message: string;
        data: {
            id: number;
            username: string;
            nickname?: string;
            phone?: string;
            email?: string;
            gender?: "male" | "female";
            status: "normal" | "disabled";
            avatar?: string;
            lastLoginTime?: Date;
            lastLoginIp?: string;
            createBy?: number;
            createTime: Date;
            updateTime: Date;
            roles: import("../roles/entities/role.entity").Role[];
        };
    }>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number;
            username: string;
            nickname?: string;
            phone?: string;
            email?: string;
            gender?: "male" | "female";
            status: "normal" | "disabled";
            avatar?: string;
            lastLoginTime?: Date;
            lastLoginIp?: string;
            createBy?: number;
            createTime: Date;
            updateTime: Date;
            roles: import("../roles/entities/role.entity").Role[];
        };
    }>;
    remove(id: number): Promise<{
        code: number;
        message: string;
    }>;
}
