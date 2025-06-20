"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaslAbilityFactory = exports.Action = void 0;
const ability_1 = require("@casl/ability");
const common_1 = require("@nestjs/common");
const user_entity_1 = require("../../users/entities/user.entity");
const customer_entity_1 = require("../../customers/entities/customer.entity");
const driver_entity_1 = require("../../drivers/entities/driver.entity");
const checkin_record_entity_1 = require("../../checkin/entities/checkin-record.entity");
var Action;
(function (Action) {
    Action["Manage"] = "manage";
    Action["Create"] = "create";
    Action["Read"] = "read";
    Action["Update"] = "update";
    Action["Delete"] = "delete";
})(Action || (exports.Action = Action = {}));
let CaslAbilityFactory = class CaslAbilityFactory {
    createForUser(user) {
        const { can, cannot, build } = new ability_1.AbilityBuilder(ability_1.Ability);
        switch (user.userType) {
            case user_entity_1.UserType.ADMIN:
                can(Action.Manage, 'all');
                break;
            case user_entity_1.UserType.DRIVER:
                can(Action.Read, user_entity_1.User, { id: user.id });
                can(Action.Update, user_entity_1.User, { id: user.id });
                can(Action.Read, customer_entity_1.Customer);
                can(Action.Read, driver_entity_1.Driver, { userId: user.id });
                can(Action.Update, driver_entity_1.Driver, { userId: user.id });
                can(Action.Create, checkin_record_entity_1.CheckinRecord, { driverId: user.id });
                can(Action.Read, checkin_record_entity_1.CheckinRecord, { driverId: user.id });
                break;
            case user_entity_1.UserType.SALES:
                can(Action.Read, user_entity_1.User, { id: user.id });
                can(Action.Update, user_entity_1.User, { id: user.id });
                can(Action.Manage, customer_entity_1.Customer);
                can(Action.Read, driver_entity_1.Driver);
                can(Action.Read, checkin_record_entity_1.CheckinRecord);
                break;
            default:
                cannot(Action.Manage, 'all');
                break;
        }
        return build({
            detectSubjectType: (item) => item.constructor,
        });
    }
};
exports.CaslAbilityFactory = CaslAbilityFactory;
exports.CaslAbilityFactory = CaslAbilityFactory = __decorate([
    (0, common_1.Injectable)()
], CaslAbilityFactory);
//# sourceMappingURL=casl-ability.factory.js.map