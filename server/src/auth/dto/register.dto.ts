import { IsString, MinLength, MaxLength, IsOptional, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @IsString()
  @IsNotEmpty({ message: '邀请码不能为空' })
  inviteCode!: string;
}
