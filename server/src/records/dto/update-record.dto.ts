import { IsOptional, IsString } from 'class-validator';

export class UpdateRecordDto {
  @IsOptional()
  data?: any;

  @IsOptional()
  @IsString()
  recordDate?: string;
}
