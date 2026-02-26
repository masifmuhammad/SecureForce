import {
    IsEmail, IsString, MinLength, IsOptional, IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../entities';

export class RegisterDto {
    @ApiProperty({ example: 'John' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Smith' })
    @IsString()
    lastName: string;

    @ApiProperty({ example: 'john.smith@secureforce.com.au' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiPropertyOptional({ example: '+61412345678' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ enum: UserRole, default: UserRole.EMPLOYEE })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiPropertyOptional({ example: 'SEC-12345', description: 'Australian security license number' })
    @IsOptional()
    @IsString()
    securityLicenseNumber?: string;
}
