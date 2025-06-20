export declare class SearchCustomerDto {
    customerNumber?: string;
    customerName?: string;
    customerAddress?: string;
    contactPerson?: string;
    area?: string;
    page?: number;
    limit?: number;
}
export declare class CustomerSearchResultDto {
    id: number;
    customerCode: string;
    customerName: string;
    contactPerson: string;
    phone: string;
    address: string;
    longitude: number;
    latitude: number;
}
