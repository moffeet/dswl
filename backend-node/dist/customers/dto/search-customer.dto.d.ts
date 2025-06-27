export declare class SearchCustomerDto {
    customerNumber?: string;
    customerName?: string;
    customerAddress?: string;
    page?: number;
    limit?: number;
}
export declare class CustomerSearchResultDto {
    id: number;
    customerNumber: string;
    customerName: string;
    customerAddress: string;
    updateBy: string;
    createTime: Date;
    updateTime: Date;
}
