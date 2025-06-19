import { Ability, AbilityBuilder, AbilityClass, ExtractSubjectType, InferSubjects } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { User, UserType } from '../../users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Driver } from '../../drivers/entities/driver.entity';
import { CheckinRecord } from '../../checkin/entities/checkin-record.entity';

// 定义操作类型
export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

// 定义主题类型
type Subjects = InferSubjects<typeof User | typeof Customer | typeof Driver | typeof CheckinRecord> | 'all';

// 定义能力类型
export type AppAbility = Ability<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<Ability<[Action, Subjects]>>(
      Ability as AbilityClass<AppAbility>,
    );

    // 根据用户类型分配权限
    switch (user.userType) {
      case UserType.ADMIN:
        // 管理员拥有所有权限
        can(Action.Manage, 'all');
        break;

      case UserType.DRIVER:
        // 司机权限
        can(Action.Read, User, { id: user.id }); // 只能读取自己的信息
        can(Action.Update, User, { id: user.id }); // 只能更新自己的信息
        can(Action.Read, Customer); // 可以读取客户信息
        can(Action.Read, Driver, { userId: user.id }); // 只能读取自己的司机信息
        can(Action.Update, Driver, { userId: user.id }); // 只能更新自己的司机信息
        can(Action.Create, CheckinRecord, { driverId: user.id }); // 只能创建自己的打卡记录
        can(Action.Read, CheckinRecord, { driverId: user.id }); // 只能读取自己的打卡记录
        break;

      case UserType.SALES:
        // 销售人员权限
        can(Action.Read, User, { id: user.id }); // 只能读取自己的信息
        can(Action.Update, User, { id: user.id }); // 只能更新自己的信息
        can(Action.Manage, Customer); // 可以管理客户信息
        can(Action.Read, Driver); // 可以读取司机信息
        can(Action.Read, CheckinRecord); // 可以读取打卡记录
        break;

      default:
        // 默认无权限
        cannot(Action.Manage, 'all');
        break;
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
} 