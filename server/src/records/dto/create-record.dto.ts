import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateRecordDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsOptional()
  data!: any;

  @IsOptional()
  @IsString()
  recordDate?: string;
}
