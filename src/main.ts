import { config } from "dotenv";
import "reflect-metadata";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import bodyParser, { BodyParser } from "body-parser";
import nodemailer from "nodemailer";
import handlebars from "handlebars";
import * as fs from "fs";
import { promisify } from "util";
import { createConnection, Repository } from "typeorm";
import { TodoEntity } from "./entities/todo.entity";
import { TodoModel } from "./models/todo.model";
import { TodoStatus } from "./enums/todo-status.enum";

config();

let todoRepository: Repository<TodoEntity>;

createConnection({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [TodoEntity],
  synchronize: true,
  logging: false,
})
  .then((connection) => {    
    todoRepository = connection.getRepository(TodoEntity);
    console.log("Connected to the database");
  })
  .catch((error) => console.log(error));

const readFile = promisify(fs.readFile);

const app = express();

app.use(cors());

app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    serviceClient: process.env.EMAIL_CLIENT_ID,
    privateKey: process.env.EMAIL_PRIVATE_KEY,
  },
});

app.use((req, res, next) => {
  console.log("request from:", req.ip);
  next();
});



app.post("/api/contact", async (req, res, next) => {
  // { email, name, subject, message }
  const data = { ...req.body, date: new Date(Date.now()) };

  let html = await readFile("./email.html", "utf8");
  let template = handlebars.compile(html);
  let htmlToSend = template(data);

  await transporter.sendMail({
    to: "info@joinnextstep.com",
    from: data.email,
    subject: "Connection request from NextStep landing page!",
    html: htmlToSend,
  });

  res.status(201).json({
    status: "success",
    message:
      "Thank you for your message, we will make sure to back to you soon!",
  });
});

app.get(
  "/api/todo",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let entities = await todoRepository.find();
      res.status(201).json(entities);
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/todo/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let todoId: number = Number(req.params.id);
      let entity = await todoRepository.findOne(todoId);

      if(!entity)
      throw new Error(`Todo with id: ${todoId} was not found`);

      res.status(201).json(entity);
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/todo",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let model: TodoModel = req.body;
      let entity = { name: model.name, status: model.status } as TodoEntity;

      let createdEntity = todoRepository.create(entity);
      await todoRepository.save(createdEntity);

      res.status(200).json(createdEntity);
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/todo",
  async (req: Request, res: Response, next: NextFunction) => {
    let model: TodoModel = req.body;
    let entity = { name: model.name, status: model.status } as TodoEntity;

    let createdEntity = todoRepository.create(entity);
    await todoRepository.save(createdEntity);

    res.status(200).json(createdEntity);
  }
);

app.put(
  "/api/todo/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let model: TodoModel = req.body;
      let todoId: number = Number(req.params.id);

      let entity = await todoRepository.findOne(todoId);

      if (!entity) throw new Error(`Todo with id: ${todoId} was not found`);

      entity.name = model.name;
      entity.status = model.status;

      let updatedEntity = await todoRepository.update({ id: todoId }, entity);

      res.status(200).json(updatedEntity);
    } catch (error) {
      next(error);
    }
  }
);

app.patch(
  "/api/todo/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let todoId: number = Number(req.params.id);
      let status: TodoStatus = Number(req.query.status);

      let entity = await todoRepository.findOne(todoId);

      if (!entity) throw new Error(`Todo with id: ${todoId} was not found`);

      entity.status = status;

      let updatedEntity = await todoRepository.update({ id: todoId }, entity);

      res.status(200).json(updatedEntity);
    } catch (error) {
      next(error);
    }
  }
);

app.delete(
  "/api/todo/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let todoId: number = Number(req.params.id);

      let entity = await todoRepository.findOne(todoId);

      if (!entity) throw new Error(`Todo with id: ${todoId} was not found`);

      let updatedEntity = await todoRepository.remove(entity);

      res.status(200).json(updatedEntity);
    } catch (error) {
      next(error);
    }
  }
);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({status: 'error', message: err.message})
})

app.listen(6000, () => {
  console.log("server is running!");
});
