/**
 * 权限常量定义
 * 根据需求简化权限系统，将权限菜单写死在代码中
 */

// 权限类型枚举
export enum PermissionType {
  MENU = 'menu',
  BUTTON = 'button'
}

// 按钮操作类型
export enum ButtonAction {
  ADD = 'add',
  EDIT = 'edit', 
  DELETE = 'delete',
  EXPORT = 'export'
}

// 菜单权限定义
export interface MenuPermission {
  name: string;
  path: string;
  code: string;
  icon?: string;
  sortOrder: number;
  actions?: ButtonAction[];
}

// 固定的权限菜单配置
export const PERMISSION_MENUS: MenuPermission[] = [
  {
    name: '用户管理',
    path: '/users',
    code: 'menu.users',
    icon: 'IconUser',
    sortOrder: 1,
    actions: [ButtonAction.ADD, ButtonAction.EDIT, ButtonAction.DELETE]
  },
  {
    name: '角色管理', 
    path: '/roles',
    code: 'menu.roles',
    icon: 'IconUserGroup',
    sortOrder: 2,
    actions: [ButtonAction.ADD, ButtonAction.EDIT, ButtonAction.DELETE]
  },
  {
    name: '客户地址',
    path: '/customer',
    code: 'menu.customer',
    icon: 'IconLocation',
    sortOrder: 3,
    actions: [ButtonAction.EDIT, ButtonAction.EXPORT]
  },
  {
    name: '签收单',
    path: '/receipts', 
    code: 'menu.receipts',
    icon: 'IconFileText',
    sortOrder: 4,
    actions: [ButtonAction.ADD, ButtonAction.EDIT, ButtonAction.DELETE]
  },
  {
    name: '小程序用户',
    path: '/wx-user',
    code: 'menu.wxuser',
    icon: 'IconMobile',
    sortOrder: 5,
    actions: [ButtonAction.ADD, ButtonAction.EDIT, ButtonAction.DELETE]
  },
  {
    name: '地图',
    path: '/map',
    code: 'menu.map',
    icon: 'IconMap',
    sortOrder: 6,
    actions: [] // 地图模块没有按钮权限
  }
];



// 生成按钮权限代码
export function generateButtonPermissionCode(menuCode: string, action: ButtonAction): string {
  return `btn.${menuCode.replace('menu.', '')}.${action}`;
}

// 生成完整的权限列表（菜单权限 + 按钮权限）
export function generateAllPermissions() {
  const permissions: Array<{
    name: string;
    code: string;
    type: PermissionType;
    parentCode?: string;
    path?: string;
    icon?: string;
    sortOrder: number;
  }> = [];

  // 添加菜单权限
  PERMISSION_MENUS.forEach((menu, index) => {
    permissions.push({
      name: menu.name,
      code: menu.code,
      type: PermissionType.MENU,
      path: menu.path,
      icon: menu.icon,
      sortOrder: menu.sortOrder
    });

    // 添加对应的按钮权限
    if (menu.actions && menu.actions.length > 0) {
      menu.actions.forEach((action, actionIndex) => {
        const actionNames = {
          [ButtonAction.ADD]: '新增',
          [ButtonAction.EDIT]: '编辑', 
          [ButtonAction.DELETE]: '删除',
          [ButtonAction.EXPORT]: '导出'
        };

        permissions.push({
          name: `${menu.name}-${actionNames[action]}`,
          code: generateButtonPermissionCode(menu.code, action),
          type: PermissionType.BUTTON,
          parentCode: menu.code,
          sortOrder: menu.sortOrder * 100 + actionIndex + 1
        });
      });
    }
  });

  return permissions;
}

// 获取菜单权限列表
export function getMenuPermissions() {
  return PERMISSION_MENUS.map(menu => ({
    name: menu.name,
    code: menu.code,
    type: PermissionType.MENU,
    path: menu.path,
    icon: menu.icon,
    sortOrder: menu.sortOrder
  }));
}

// 获取按钮权限列表
export function getButtonPermissions() {
  const buttons: Array<{
    name: string;
    code: string;
    type: PermissionType;
    parentCode: string;
    sortOrder: number;
  }> = [];

  PERMISSION_MENUS.forEach(menu => {
    if (menu.actions && menu.actions.length > 0) {
      menu.actions.forEach((action, index) => {
        const actionNames = {
          [ButtonAction.ADD]: '新增',
          [ButtonAction.EDIT]: '编辑',
          [ButtonAction.DELETE]: '删除', 
          [ButtonAction.EXPORT]: '导出'
        };

        buttons.push({
          name: `${menu.name}-${actionNames[action]}`,
          code: generateButtonPermissionCode(menu.code, action),
          type: PermissionType.BUTTON,
          parentCode: menu.code,
          sortOrder: menu.sortOrder * 100 + index + 1
        });
      });
    }
  });

  return buttons;
}



// 权限树结构接口
export interface PermissionTreeNode {
  id?: number;
  name: string;
  code: string;
  type: PermissionType;
  path?: string;
  icon?: string;
  sortOrder: number;
  children?: PermissionTreeNode[];
}

// 生成权限树结构
export function generatePermissionTree(): PermissionTreeNode[] {
  const tree: PermissionTreeNode[] = [];

  PERMISSION_MENUS.forEach(menu => {
    const menuNode: PermissionTreeNode = {
      name: menu.name,
      code: menu.code,
      type: PermissionType.MENU,
      path: menu.path,
      icon: menu.icon,
      sortOrder: menu.sortOrder,
      children: []
    };

    // 添加按钮权限作为子节点
    if (menu.actions && menu.actions.length > 0) {
      menu.actions.forEach((action, index) => {
        const actionNames = {
          [ButtonAction.ADD]: '新增',
          [ButtonAction.EDIT]: '编辑',
          [ButtonAction.DELETE]: '删除',
          [ButtonAction.EXPORT]: '导出'
        };

        menuNode.children!.push({
          name: `${menu.name}-${actionNames[action]}`,
          code: generateButtonPermissionCode(menu.code, action),
          type: PermissionType.BUTTON,
          sortOrder: menu.sortOrder * 100 + index + 1
        });
      });
    }

    tree.push(menuNode);
  });

  return tree;
}

// 系统保护角色（不可删除和修改）
export const PROTECTED_ROLES = ['admin', 'normal', 'miniapp'];

// 默认角色（删除其他角色时用户会被分配到此角色）
export const DEFAULT_ROLE = 'normal';

// 小程序角色（可以登录小程序的角色）
export const MINIAPP_ROLES = ['driver', 'sales', 'service', 'miniapp'];

// 检查是否为保护角色
export const isProtectedRole = (roleCode: string): boolean => {
  return PROTECTED_ROLES.includes(roleCode);
};

// 检查是否为小程序角色
export const isMiniappRole = (roleCode: string): boolean => {
  return MINIAPP_ROLES.includes(roleCode);
};
