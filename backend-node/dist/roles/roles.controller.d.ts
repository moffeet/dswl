import { RolesService, CreateRoleDto, UpdateRoleDto, SearchRoleDto } from './roles.service';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    create(createRoleDto: CreateRoleDto): Promise<{
        code: number;
        message: string;
        data: import("./entities/role.entity").Role;
    }>;
    findAll(searchDto: SearchRoleDto): Promise<{
        code: number;
        message: string;
        data: {
            list: import("./entities/role.entity").Role[];
            total: number;
            page: number;
            size: number;
        };
    }>;
    findOne(id: number): Promise<{
        code: number;
        message: string;
        data: import("./entities/role.entity").Role;
    }>;
    update(id: number, updateRoleDto: UpdateRoleDto): Promise<{
        code: number;
        message: string;
        data: import("./entities/role.entity").Role;
    }>;
    remove(id: number): Promise<{
        code: number;
        message: string;
    }>;
    assignPermissions(id: number, body: {
        permissionIds: number[];
    }): Promise<{
        code: number;
        message: string;
    }>;
}
