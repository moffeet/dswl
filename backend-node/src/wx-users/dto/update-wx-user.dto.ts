import { PartialType } from '@nestjs/swagger';
import { CreateWxUserDto } from './create-wx-user.dto';

export class UpdateWxUserDto extends PartialType(CreateWxUserDto) {}
