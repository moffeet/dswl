export declare class CustomersController {
    findAll(page?: number, limit?: number): {
        code: number;
        message: string;
        data: {
            id: number;
            customerNumber: string;
            customerName: string;
            customerAddress: string;
            contactPerson: string;
            contactPhone: string;
            area: string;
            status: string;
            latitude: number;
            longitude: number;
            createTime: string;
        }[];
        total: number;
        page: number;
        limit: number;
    };
    search(query: any): {
        code: number;
        message: string;
        data: {
            id: number;
            customerNumber: string;
            customerName: string;
            customerAddress: string;
            contactPerson: string;
            contactPhone: string;
            area: string;
            status: string;
            latitude: number;
            longitude: number;
            createTime: string;
        }[];
        total: number;
    };
    findOne(id: string): {
        code: number;
        message: string;
        data: {
            id: number;
            customerNumber: string;
            customerName: string;
            customerAddress: string;
            contactPerson: string;
            contactPhone: string;
            area: string;
            status: string;
            latitude: number;
            longitude: number;
            createTime: string;
        };
    };
    create(createCustomerDto: any): {
        code: number;
        message: string;
        data: any;
    };
    update(id: string, updateCustomerDto: any): {
        code: number;
        message: string;
        data: {
            id: number;
            customerNumber: string;
            customerName: string;
            customerAddress: string;
            contactPerson: string;
            contactPhone: string;
            area: string;
            status: string;
            latitude: number;
            longitude: number;
            createTime: string;
        };
    };
    remove(id: string): {
        code: number;
        message: string;
        data: {
            id: number;
            customerNumber: string;
            customerName: string;
            customerAddress: string;
            contactPerson: string;
            contactPhone: string;
            area: string;
            status: string;
            latitude: number;
            longitude: number;
            createTime: string;
        };
    };
}
