import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notebook } from './entities/notebook.entity';
import { Note } from './entities/note.entity';
import { NoteTag } from './entities/note-tag.entity';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Notebook)
    private readonly notebookRepo: Repository<Notebook>,
    @InjectRepository(Note)
    private readonly noteRepo: Repository<Note>,
    @InjectRepository(NoteTag)
    private readonly tagRepo: Repository<NoteTag>,
  ) {}

  // === Notebooks ===

  async getNotebooks(userId: number) {
    return this.notebookRepo.find({
      where: { userId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async createNotebook(userId: number, name: string) {
    const max = await this.notebookRepo
      .createQueryBuilder('n')
      .select('MAX(n.sortOrder)', 'max')
      .where('n.userId = :userId', { userId })
      .getRawOne();
    const sortOrder = (max?.max || 0) + 1;
    return this.notebookRepo.save({ userId, name, sortOrder });
  }

  async renameNotebook(id: number, userId: number, name: string) {
    const nb = await this.notebookRepo.findOne({ where: { id, userId } });
    if (!nb) return null;
    nb.name = name;
    return this.notebookRepo.save(nb);
  }

  async deleteNotebook(id: number, userId: number) {
    // Move notes in this notebook to "uncategorized"
    await this.noteRepo.update({ notebookId: id, userId }, { notebookId: null });
    const result = await this.notebookRepo.delete({ id, userId });
    return result.affected ? true : false;
  }

  // === Notes ===

  async getNotes(
    userId: number,
    notebookId?: number | null,
    search?: string,
    tag?: string,
    isFavorite?: boolean,
  ) {
    const qb = this.noteRepo.createQueryBuilder('n')
      .where('n.userId = :userId', { userId });

    if (notebookId !== undefined && notebookId !== null) {
      if (notebookId === 0) {
        qb.andWhere('n.notebookId IS NULL');
      } else {
        qb.andWhere('n.notebookId = :notebookId', { notebookId });
      }
    }

    if (search) {
      qb.andWhere('(n.title LIKE :search OR n.content LIKE :search)', { search: `%${search}%` });
    }

    if (isFavorite !== undefined) {
      qb.andWhere('n.isFavorite = :isFavorite', { isFavorite });
    }

    qb.orderBy('n.isPinned', 'DESC')
      .addOrderBy('n.updatedAt', 'DESC');

    const notes = await qb.getMany();

    // Attach tags
    if (notes.length > 0) {
      const noteIds = notes.map(n => n.id);
      const tags = await this.tagRepo.find({ where: { noteId: In(noteIds) } });
      const tagMap = new Map<number, string[]>();
      tags.forEach(t => {
        const arr = tagMap.get(t.noteId) || [];
        arr.push(t.tagName);
        tagMap.set(t.noteId, arr);
      });
      return notes.map(n => ({
        ...n,
        tags: tagMap.get(n.id) || [],
      }));
    }

    if (tag) {
      // Filter by tag (post-query since SQLite doesn't support subqueries well)
      const noteIds = await this.tagRepo
        .createQueryBuilder('t')
        .select('t.noteId')
        .where('t.tagName = :tag', { tag })
        .getMany();
      const ids = noteIds.map(t => t.noteId);
      return notes.filter(n => ids.includes(n.id)).map(n => ({ ...n, tags: [] }));
    }

    return notes.map(n => ({ ...n, tags: [] }));
  }

  async getNote(id: number, userId: number) {
    const note = await this.noteRepo.findOne({ where: { id, userId } });
    if (!note) return null;
    const tags = await this.tagRepo.find({ where: { noteId: id } });
    return { ...note, tags: tags.map(t => t.tagName) };
  }

  async createNote(userId: number, title: string, content?: string, notebookId?: number | null, tags?: string[]) {
    const note = await this.noteRepo.save({
      userId,
      title,
      content: content || '',
      notebookId: notebookId || null,
    });
    if (tags && tags.length > 0) {
      await this.saveTags(note.id, tags);
    }
    return { ...note, tags: tags || [] };
  }

  async updateNote(id: number, userId: number, data: Partial<Note> & { tags?: string[] }) {
    const note = await this.noteRepo.findOne({ where: { id, userId } });
    if (!note) return null;

    if (data.title !== undefined) note.title = data.title;
    if (data.content !== undefined) note.content = data.content;
    if (data.notebookId !== undefined) note.notebookId = data.notebookId;
    if (data.isPinned !== undefined) note.isPinned = data.isPinned;
    if (data.isFavorite !== undefined) note.isFavorite = data.isFavorite;

    const saved = await this.noteRepo.save(note);

    if (data.tags !== undefined) {
      await this.tagRepo.delete({ noteId: id });
      if (data.tags.length > 0) {
        await this.saveTags(id, data.tags);
      }
    }

    const tags = await this.tagRepo.find({ where: { noteId: id } });
    return { ...saved, tags: tags.map(t => t.tagName) };
  }

  async deleteNote(id: number, userId: number) {
    await this.tagRepo.delete({ noteId: id });
    const result = await this.noteRepo.delete({ id, userId });
    return result.affected ? true : false;
  }

  private async saveTags(noteId: number, tags: string[]) {
    const entities = tags.map(tagName => this.tagRepo.create({ noteId, tagName }));
    await this.tagRepo.save(entities);
  }
}
