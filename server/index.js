import express from 'express';
import logger from 'morgan';
import dotenv from 'dotenv';
import { createConnection } from 'mysql';

import { Server } from 'socket.io';
import { createServer } from 'node:http';

dotenv.config();

const port = process.env.PORT ?? 3000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
    connectionStateRecovery: {}
});

const db = createConnection({
    host: process.env.DB_URL,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

db.connect( (err) => {
    if (err) {
        console.log(err);
    }

    db.query('CREATE TABLE IF NOT EXISTS `messages` ( `id` INT NOT NULL AUTO_INCREMENT, `content` VARCHAR(255), PRIMARY KEY(`id`));', 
        ( error, result ) => {
            if ( error ) {
                console.log(`a ${error}`);
            }
            
            console.log('Table created!');
        }
    );

    console.log("Connected!");
});

io.on('connection', ( socket ) => {
    console.log('A user has connected!');

    socket.on('disconnect', () => {
        console.log('An user has disconnected');
    });

    socket.on('chat message', ( msg ) => {
        io.emit('chat message', msg);

        db.query('INSERT INTO `messages` (content) VALUES ("'+msg+'");', 
            ( error, result ) => {
                if ( error ) {
                    console.log(err);
                }
    
                console.log('Message added!');
            }
        );
    });
});

app.use(logger('dev'));

app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/client/index.html');
});

server.listen(port, () => {
    console.log(`Server running in ${port}`);
});

