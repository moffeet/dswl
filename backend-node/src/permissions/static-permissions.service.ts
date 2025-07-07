import { Injectable } from '@nestjs/common';
import { 
  generatePermissionTree, 
  getMenuPermissions, 
  getButtonPermissions,
  generateAllPermissions,
  PermissionTreeNode 
} from '../common/constants/permissions';

/**
 * 静态权限服务
 * 提供基于常量定义的权限数据，不依赖数据库
 */
@Injectable()
export class StaticPermissionsService {

  /**
   * 获取权限树结构
   * 用于角色权限配置界面
   */
  getPermissionTree(): PermissionTreeNode[] {
    return generatePermissionTree();
  }

  /**
   * 获取菜单权限列表
   */
  getMenuPermissions() {
    return getMenuPermissions();
  }

  /**
   * 获取按钮权限列表
   */
  getButtonPermissions() {
    return getButtonPermissions();
  }

  /**
   * 获取所有权限列表（菜单权限 + 按钮权限）
   */
  getAllPermissions() {
    return generateAllPermissions();
  }

  /**
   * 根据权限代码获取权限信息
   */
  getPermissionByCode(code: string) {
    const allPermissions = this.getAllPermissions();
    return allPermissions.find(p => p.code === code);
  }

  /**
   * 根据权限代码数组获取权限信息
   */
  getPermissionsByCodes(codes: string[]) {
    const allPermissions = this.getAllPermissions();
    return allPermissions.filter(p => codes.includes(p.code));
  }

  /**
   * 验证权限代码是否有效
   */
  validatePermissionCodes(codes: string[]): { valid: string[], invalid: string[] } {
    const allPermissions = this.getAllPermissions();
    const validCodes = allPermissions.map(p => p.code);
    
    const valid = codes.filter(code => validCodes.includes(code));
    const invalid = codes.filter(code => !validCodes.includes(code));
    
    return { valid, invalid };
  }

  /**
   * 获取菜单权限代码列表
   */
  getMenuPermissionCodes(): string[] {
    return this.getMenuPermissions().map(p => p.code);
  }

  /**
   * 获取按钮权限代码列表
   */
  getButtonPermissionCodes(): string[] {
    return this.getButtonPermissions().map(p => p.code);
  }

  /**
   * 根据菜单代码获取对应的按钮权限
   */
  getButtonPermissionsByMenuCode(menuCode: string) {
    const buttonPermissions = this.getButtonPermissions();
    return buttonPermissions.filter(p => p.parentCode === menuCode);
  }
}
