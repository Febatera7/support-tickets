import "reflect-metadata";
import { DataSource } from "typeorm";

import { env } from "#src/config/env";
import { Notification } from "#src/entities/Notification";
import { SLAConfig } from "#src/entities/SLAConfig";
import { Ticket } from "#src/entities/Ticket";
import { TicketHistory } from "#src/entities/TicketHistory";
import { User } from "#src/entities/User";


export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  synchronize: env.DB_SYNC === "true",
  logging: env.NODE_ENV === "development",
  entities: [User, Ticket, TicketHistory, Notification, SLAConfig],
  connectTimeoutMS: 10000
});
