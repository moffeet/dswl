import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { SearchCustomerDto } from './dto/search-customer.dto';
export declare class CustomersService {
    private customerRepository;
    constructor(customerRepository: Repository<Customer>);
    create(createCustomerDto: CreateCustomerDto): Promise<Customer>;
    findAll(page?: number, limit?: number): Promise<{
        data: Customer[];
        total: number;
        page: number;
        limit: number;
    }>;
    search(searchDto: SearchCustomerDto): Promise<{
        data: Customer[];
        total: number;
    }>;
    findOne(id: number): Promise<Customer>;
    update(id: number, updateCustomerDto: UpdateCustomerDto): Promise<Customer>;
    remove(id: number): Promise<Customer>;
    getCustomerDetail(id: number): Promise<Customer>;
    generateNavigationUrl(customerIds: number[]): Promise<string>;
}
