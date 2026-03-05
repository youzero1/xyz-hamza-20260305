import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('calculations')
export class Calculation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  expression!: string;

  @Column({ type: 'text' })
  result!: string;

  @Column({ type: 'integer', default: 0 })
  likes!: number;

  @Column({ type: 'boolean', default: false })
  shared!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
