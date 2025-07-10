import { SetMetadata } from '@nestjs/common';

export const REQUIRE_SIGNATURE_KEY = 'requireSignature';

/**
 * 标记是否需要签名校验的接口
 * @param required 是否需要签名校验，默认为 true
 * 使用此装饰器的接口将根据参数决定是否进行签名校验
 */
export const RequireSignature = (required: boolean = true) => SetMetadata(REQUIRE_SIGNATURE_KEY, required);
