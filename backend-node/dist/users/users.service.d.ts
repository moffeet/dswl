import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { User, UserType } from './entities/user.entity';
export declare class UsersService {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    create(createUserDto: CreateUserDto): Promise<User>;
    findAllWithPagination(searchDto: SearchUserDto): Promise<{
        users: User[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    findAll(): Promise<User[]>;
    findDrivers(): Promise<User[]>;
    getRoles(): Promise<{
        value: UserType;
        label: string;
        description: string;
        permissions: string[];
    }[]>;
    findById(id: number): Promise<User>;
    findByUsername(username: string): Promise<User | null>;
    findByPhone(phone: string): Promise<User | null>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<User>;
    batchRemove(ids: number[]): Promise<void>;
    remove(id: number): Promise<void>;
    updateLastLoginAt(id: number): Promise<void>;
    findByWechatOpenid(openid: string): Promise<User | null>;
    validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
    private generateDriverCode;
}
