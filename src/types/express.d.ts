// src/types/express.d.ts
import { IUser } from '../models/user.model'; // Import kiểu IUser của chúng ta

declare global {
  namespace Express {
    export interface Request {
      user?: IUser; // Chúng ta sẽ gắn đối tượng user vào đây
    }
  }
}