import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsNumber()
  notebookId?: number | null;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @IsOptional()
  tags?: string[];
}
