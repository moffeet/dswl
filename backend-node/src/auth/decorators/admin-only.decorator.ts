import { SetMetadata } from '@nestjs/common';

export const ADMIN_ONLY_KEY = 'adminOnly';

/**
 * 标记只有管理员才能访问的接口
 * 使用此装饰器的接口只有超级管理员（roleCode='admin'）才能访问
 */
export const AdminOnly = () => SetMetadata(ADMIN_ONLY_KEY, true);
