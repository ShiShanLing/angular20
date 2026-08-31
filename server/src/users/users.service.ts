import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(username: string, password: string, nickname?: string): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { username } });
    if (existing) {
      throw new ConflictException('用户名已存在');
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({
      username,
      password: hashedPassword,
      nickname: nickname || username,
    });
    return this.userRepo.save(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { username } });
  }
  
  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async findOrCreateFromAgent(agent: {
    id: string;
    email: string;
    display_name: string;
  }): Promise<User> {
    const existingByAgent = await this.userRepo.findOne({
      where: { agentUserId: agent.id },
    });
    if (existingByAgent) {
      if (existingByAgent.nickname !== agent.display_name) {
        existingByAgent.nickname = agent.display_name;
        return this.userRepo.save(existingByAgent);
      }
      return existingByAgent;
    }

    const email = agent.email.trim().toLowerCase();
    const existingByEmail = await this.userRepo.findOne({ where: { username: email } });
    if (existingByEmail) {
      existingByEmail.agentUserId = agent.id;
      existingByEmail.nickname = agent.display_name || existingByEmail.nickname;
      return this.userRepo.save(existingByEmail);
    }

    const placeholderPassword = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
    const user = this.userRepo.create({
      username: email,
      password: placeholderPassword,
      agentUserId: agent.id,
      nickname: agent.display_name || email,
    });
    return this.userRepo.save(user);
  }
}
