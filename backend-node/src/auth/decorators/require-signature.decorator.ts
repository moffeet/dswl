import { SetMetadata } from '@nestjs/common';

export const REQUIRE_SIGNATURE_KEY = 'requireSignature';

/**
 * 标记需要签名校验的接口
 * 使用此装饰器的接口将自动进行签名校验
 */
export const RequireSignature = () => SetMetadata(REQUIRE_SIGNATURE_KEY, true);
