import {
  Controller, Get, Post, Put, Delete, Body, Query, Param,
  UseGuards, Request, Res, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { NotesService } from './notes.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CreateNotebookDto } from './dto/create-notebook.dto';

const UPLOAD_DIR = '/var/www/uploads';
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

@ApiTags('notes')
@ApiBearerAuth()
@Controller()
@UseGuards(AuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  // === Notebooks ===

  @Get('notebooks')
  @ApiOperation({ summary: '获取文件夹列表' })
  @ApiResponse({
    status: 200,
    description: '返回当前用户的所有文件夹',
    schema: {
      example: [
        { id: 1, userId: 1, name: '工作', sortOrder: 0, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
        { id: 2, userId: 1, name: '生活', sortOrder: 1, createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' },
      ],
    },
  })
  getNotebooks(@Request() req: any) {
    return this.notesService.getNotebooks(req.user.userId);
  }

  @Post('notebooks')
  @ApiOperation({ summary: '创建文件夹' })
  @ApiResponse({
    status: 201,
    description: '返回创建的文件夹',
    schema: {
      example: { id: 3, userId: 1, name: '学习', sortOrder: 2, createdAt: '2026-07-16T00:00:00.000Z', updatedAt: '2026-07-16T00:00:00.000Z' },
    },
  })
  createNotebook(@Request() req: any, @Body() dto: CreateNotebookDto) {
    return this.notesService.createNotebook(req.user.userId, dto.name);
  }

  @Put('notebooks/:id')
  @ApiOperation({ summary: '重命名文件夹' })
  async renameNotebook(@Request() req: any, @Param('id') id: number, @Body() dto: CreateNotebookDto) {
    const result = await this.notesService.renameNotebook(id, req.user.userId, dto.name);
    if (!result) return { error: '文件夹不存在' };
    return result;
  }

  @Delete('notebooks/:id')
  @ApiOperation({ summary: '删除文件夹（笔记移至未分类）' })
  async deleteNotebook(@Request() req: any, @Param('id') id: number) {
    const ok = await this.notesService.deleteNotebook(id, req.user.userId);
    return { success: ok };
  }

  // === Notes ===

  @Get('notes')
  @ApiOperation({ summary: '获取笔记列表' })
  @ApiQuery({ name: 'notebookId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tag', required: false })
  @ApiQuery({ name: 'isFavorite', required: false })
  @ApiResponse({
    status: 200,
    description: '返回笔记列表（置顶优先）',
    schema: {
      example: [
        {
          id: 1, userId: 1, notebookId: 1, title: '会议纪要', content: '<p>会议内容...</p>',
          isPinned: true, isFavorite: false, tags: [{ id: 1, noteId: 1, tagName: '工作' }],
          createdAt: '2026-07-10T10:00:00.000Z', updatedAt: '2026-07-15T14:30:00.000Z',
        },
      ],
    },
  })
  getNotes(
    @Request() req: any,
    @Query('notebookId') notebookId?: string,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('isFavorite') isFavorite?: string,
  ) {
    return this.notesService.getNotes(
      req.user.userId,
      notebookId !== undefined ? Number(notebookId) : undefined,
      search,
      tag,
      isFavorite !== undefined ? isFavorite === 'true' : undefined,
    );
  }

  @Get('notes/:id')
  @ApiOperation({ summary: '获取单条笔记详情' })
  async getNote(@Request() req: any, @Param('id') id: number) {
    const note = await this.notesService.getNote(id, req.user.userId);
    if (!note) return { error: '笔记不存在' };
    return note;
  }

  @Post('notes')
  @ApiOperation({ summary: '创建笔记' })
  @ApiResponse({
    status: 201,
    description: '返回创建的笔记',
    schema: {
      example: {
        id: 2, userId: 1, notebookId: 1, title: '新笔记', content: '',
        isPinned: false, isFavorite: false, tags: [],
        createdAt: '2026-07-16T00:00:00.000Z', updatedAt: '2026-07-16T00:00:00.000Z',
      },
    },
  })
  createNote(@Request() req: any, @Body() dto: CreateNoteDto) {
    return this.notesService.createNote(
      req.user.userId, dto.title, dto.content, dto.notebookId, dto.tags,
    );
  }

  @Put('notes/:id')
  @ApiOperation({ summary: '更新笔记' })
  @ApiResponse({
    status: 200,
    description: '返回更新后的笔记',
    schema: {
      example: {
        id: 1, userId: 1, notebookId: 1, title: '修改后的标题', content: '<p>新内容</p>',
        isPinned: false, isFavorite: true, tags: [{ id: 2, noteId: 1, tagName: '重要' }],
        createdAt: '2026-07-10T10:00:00.000Z', updatedAt: '2026-07-16T08:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: '笔记不存在', schema: { example: { error: '笔记不存在' } } })
  async updateNote(@Request() req: any, @Param('id') id: number, @Body() dto: UpdateNoteDto) {
    const result = await this.notesService.updateNote(id, req.user.userId, dto);
    if (!result) return { error: '笔记不存在' };
    return result;
  }

  @Delete('notes/:id')
  @ApiOperation({ summary: '删除笔记' })
  @ApiResponse({
    status: 200,
    description: '返回删除结果',
    schema: { example: { success: true } },
  })
  async deleteNote(@Request() req: any, @Param('id') id: number) {
    const ok = await this.notesService.deleteNote(id, req.user.userId);
    return { success: ok };
  }

  @Get('notes/:id/export')
  @ApiOperation({ summary: '导出笔记为 Markdown 文件' })
  async exportNote(@Request() req: any, @Param('id') id: number, @Res() res: Response) {
    const note = await this.notesService.getNote(id, req.user.userId);
    if (!note) return res.status(404).json({ error: '笔记不存在' });
    const filename = encodeURIComponent(note.title || 'untitled') + '.md';
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
    res.send(note.content);
  }

  @Post('notes/upload')
  @ApiOperation({ summary: '上传图片附件' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: '返回上传后的图片 URL',
    schema: { example: { url: '/uploads/1721088000-123456789.png', originalName: 'screenshot.png' } },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: UPLOAD_DIR,
      filename: (_req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
    fileFilter: (_req: any, file: any, cb: any) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|svg)$/)) {
        return cb(new Error('仅支持图片文件'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  uploadImage(@UploadedFile() file: any) {
    if (!file) return { error: '上传失败' };
    return { url: `/uploads/${file.filename}`, originalName: file.originalname };
  }
}
