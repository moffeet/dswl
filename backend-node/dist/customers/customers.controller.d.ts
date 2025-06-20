import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { SearchCustomerDto } from './dto/search-customer.dto';
import { Customer } from './entities/customer.entity';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    findAll(page?: number, limit?: number): Promise<{
        code: number;
        message: string;
        data: Customer[];
        total: number;
        page: number;
        limit: number;
        error?: undefined;
    } | {
        code: number;
        message: string;
        data: any;
        error: any;
        total?: undefined;
        page?: undefined;
        limit?: undefined;
    }>;
    search(query: SearchCustomerDto): Promise<{
        code: number;
        message: string;
        data: Customer[];
        total: number;
        error?: undefined;
    } | {
        code: number;
        message: string;
        data: any;
        error: any;
        total?: undefined;
    }>;
    findOne(id: string): Promise<{
        code: number;
        message: string;
        data: Customer;
        error?: undefined;
    } | {
        code: number;
        message: string;
        data: any;
        error: any;
    }>;
    create(createCustomerDto: CreateCustomerDto): Promise<{
        code: number;
        message: string;
        data: Customer;
        error?: undefined;
    } | {
        code: number;
        message: string;
        data: any;
        error: any;
    }>;
    update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<{
        code: number;
        message: string;
        data: Customer;
        error?: undefined;
    } | {
        code: number;
        message: string;
        data: any;
        error: any;
    }>;
    remove(id: string): Promise<{
        code: number;
        message: string;
        data: Customer;
        error?: undefined;
    } | {
        code: number;
        message: string;
        data: any;
        error: any;
    }>;
}
