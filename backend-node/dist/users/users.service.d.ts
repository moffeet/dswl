import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
export declare class UsersService {
    private readonly userRepository;
    private readonly roleRepository;
    constructor(userRepository: Repository<User>, roleRepository: Repository<Role>);
    create(createUserDto: CreateUserDto): Promise<User>;
    findAll(searchDto: SearchUserDto): Promise<{
        users: User[];
        total: number;
    }>;
    findOne(id: number): Promise<User>;
    findByUsername(username: string): Promise<User | null>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<User>;
    remove(id: number): Promise<void>;
    validateUser(username: string, password: string): Promise<User | null>;
    updateLoginInfo(userId: number, updateData: {
        lastLoginTime?: Date;
        lastLoginIp?: string;
        currentLoginIp?: string;
        currentToken?: string;
    }): Promise<void>;
}
