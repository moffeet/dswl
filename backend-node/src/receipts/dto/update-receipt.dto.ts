import { PartialType } from '@nestjs/swagger';
import { CreateReceiptDto } from './create-receipt.dto';

/**
 * 更新签收单DTO
 * 继承自CreateReceiptDto，所有字段都是可选的
 */
export class UpdateReceiptDto extends PartialType(CreateReceiptDto) {}
