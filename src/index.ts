// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import eventRoutes from './routes/event.routes';
import adminRoutes from './routes/admin.routes';
import reportRoutes from './routes/report.routes';
import uploadRoutes from './routes/upload.routes';

dotenv.config(); 

connectDB();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

app.use(cors({
  origin: '*', // Chấp nhận mọi nguồn
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Chấp nhận mọi phương thức
}));

app.use(express.json()); 

app.get('/', (req, res) => {
  res.send('Welcome to EcoConnect API!');
});

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/upload', uploadRoutes);

app.listen(PORT, () => { // <-- Bỏ '0.0.0.0' đi, quay về mặc định
  console.log(`Server is running on http://localhost:${PORT}`);
});