import { urlencoded } from 'body-parser';
import { Application } from 'express';
import { Service } from 'typedi';

import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { Api } from './api/api';
import { config } from '../config/environment';
import { errorHandler } from '../middleware/error_handler';
import * as http from "node:http";
import session from "express-session";

@Service()
export class Server {

  app: Application;
  serverInstance?: http.Server;

  constructor(private readonly api: Api) {
    this.app = express();
    this.setupServer();
  }

  private setupServer(): void {
    this.app.use(cors());
    this.app.use(express.json({ limit: '5mb' }));
    this.app.use(session(config.user_sessions));
    this.app.use(urlencoded({ extended: false }));
    this.app.use(morgan('dev'));

    this.app.use('/api', this.api.getApiRouter());

    // Use the error handler middleware
    this.app.use(errorHandler);

    this.serverInstance = this.app.listen(config.port, this.onHttpServerListening);
  }

  private onHttpServerListening(): void {
    console.log(`Server express started in ${config.env} mode (ip:${config.ip}, port:${config.port})`);
  }

  public async closeServer(): Promise<void> {
    if (this.serverInstance) {
      return new Promise((resolve, reject) => {
        this.serverInstance!.close((err) => {
          if (err) {
            return reject(err);
          }
          console.log('Server closed');
          resolve();
        });
      });
    }
  }

}