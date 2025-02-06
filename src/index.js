import express from 'express';
import cors from 'cors';
import { errorHandler } from './utils.js';
import routes from './routes/index.js';
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/test-app', (req, res) => {
    res.end('Everything working fine');
});

// const corsOptions = {
//     origin: process.env.FRONTEND_URL,
//     credentials: true,
//     optionsSuccessStatus: 200,
// };

app.use(cors());
app.use(express.json());

app.use('/api/v1', routes);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log('App is running at port 3000');
});
