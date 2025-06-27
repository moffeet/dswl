import { PermissionsService, CreatePermissionDto, UpdatePermissionDto, SearchPermissionDto } from './permissions.service';
export declare class PermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: PermissionsService);
    create(createPermissionDto: CreatePermissionDto): Promise<{
        code: number;
        message: string;
        data: import("./entities/permission.entity").Permission;
    }>;
    findAll(searchDto: SearchPermissionDto): Promise<{
        code: number;
        message: string;
        data: {
            list: import("./entities/permission.entity").Permission[];
            total: number;
            page: number;
            size: number;
        };
    }>;
    findMenuTree(): Promise<{
        code: number;
        message: string;
        data: import("./entities/permission.entity").Permission[];
    }>;
    findButtonPermissions(): Promise<{
        code: number;
        message: string;
        data: import("./entities/permission.entity").Permission[];
    }>;
    findButtonTree(): Promise<{
        code: number;
        message: string;
        data: import("./entities/permission.entity").Permission[];
    }>;
    findCompleteTree(): Promise<{
        code: number;
        message: string;
        data: import("./entities/permission.entity").Permission[];
    }>;
    findOne(id: number): Promise<{
        code: number;
        message: string;
        data: import("./entities/permission.entity").Permission;
    }>;
    update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<{
        code: number;
        message: string;
        data: import("./entities/permission.entity").Permission;
    }>;
    remove(id: number): Promise<{
        code: number;
        message: string;
    }>;
}
