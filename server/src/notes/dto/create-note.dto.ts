import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsNumber()
  notebookId?: number | null;

  @IsOptional()
  tags?: string[];
}
