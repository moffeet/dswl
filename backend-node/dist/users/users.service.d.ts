import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    create(createUserDto: CreateUserDto): Promise<User>;
    findAll(): Promise<User[]>;
    findById(id: number): Promise<User>;
    findByUsername(username: string): Promise<User | null>;
    findByWechatOpenid(openid: string): Promise<User | null>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<User>;
    updateLastLoginAt(id: number): Promise<void>;
    bindWechatOpenid(id: number, openid: string): Promise<User>;
    remove(id: number): Promise<void>;
    validatePassword(password: string, hashedPassword: string): Promise<boolean>;
    findDrivers(): Promise<User[]>;
}
