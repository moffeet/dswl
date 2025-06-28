import { Ability, InferSubjects } from '@casl/ability';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
export declare enum Action {
    Manage = "manage",
    Create = "create",
    Read = "read",
    Update = "update",
    Delete = "delete"
}
type Subjects = InferSubjects<typeof User | typeof Customer> | 'all';
export type AppAbility = Ability<[Action, Subjects]>;
export declare class CaslAbilityFactory {
    createForUser(user: User): Ability<[Action, Subjects], import("@casl/ability").MongoQuery>;
}
export {};
