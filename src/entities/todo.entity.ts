import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";
import { TodoStatus } from "../enums/todo-status.enum";

@Entity('todo')
export class TodoEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  status: TodoStatus;

}
