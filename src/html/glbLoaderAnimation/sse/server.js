// const express = require('express');
// const http = require('http');
// const WebSocket = require('ws');

// const app = express();
// const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });

// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   next();
// });

// wss.on('connection', (ws) => {
//   console.log('WebSocket 连接已建立');

//   ws.on('message', (message) => {
//     console.log(`接收到消息：${message}`);
//   });

//   const poem = `
//     实现岳飞此词，激励着中华民族的爱国心。抗战期间这首词曲以其低沉但却雄壮的歌音，感染了中华儿女。
//   `;

//   const lines = poem.split('\
// ').filter(line => line.trim() !== '');

//   let counter = 0;

//   const interval = setInterval(() => {
//     if (counter < lines.length) {
//       const data = `${lines[counter++]}\
//       `;
//       ws.send(data);
//     } else {
//       clearInterval(interval);
//     }
//   }, 500);

//   ws.on('close', () => {
//     clearInterval(interval);
//   });
// });

// app.get('/', (req, res) => {
//   res.send('主页');
// });

// server.listen(8080, () => {
//   console.log('服务启动，端口号：8080');
// });


const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

wss.on('connection', (ws) => {
  console.log('WebSocket 连接已建立');

  ws.on('message', (message) => {
    const receivedMessage = message.toString('utf-8');
    console.log(`接收到消息：${receivedMessage}`);

    let counter = 0;

    const interval = setInterval(() => {
      if (counter < receivedMessage.length) {
        const data = receivedMessage.charAt(counter++);
        ws.send(data);
      } else {
        clearInterval(interval);
      }
    }, 200);

    ws.on('close', () => {
      clearInterval(interval);
    });
  });
});

app.get('/', (req, res) => {
  res.send('主页');
});

server.listen(8080, () => {
  console.log('服务启动，端口号：8080');
});



