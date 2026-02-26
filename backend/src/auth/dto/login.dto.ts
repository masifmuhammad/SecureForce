import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'admin@secureforce.com.au' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SecurePass123!' })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiPropertyOptional({ example: '123456', description: 'TOTP 2FA code if enabled' })
    @IsOptional()
    @IsString()
    twoFactorCode?: string;
}
