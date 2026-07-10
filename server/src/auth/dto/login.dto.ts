import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString()
  @MinLength(1)
  username!: string;

  @ApiProperty({ description: '密码', example: '123456' })
  @IsString()
  @MinLength(1)
  password!: string;
}
