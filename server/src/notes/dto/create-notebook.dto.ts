import { IsString } from 'class-validator';

export class CreateNotebookDto {
  @IsString()
  name!: string;
}
