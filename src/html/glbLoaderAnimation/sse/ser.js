const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    });

    const sendEvent = (data) => {
        res.write(`${JSON.stringify(data)}`);
    };

    const intervalId = setInterval(() => {
        const data ='这是一条实时消息'
        sendEvent(data);
    }, 300); 

    req.on('close', () => {
        clearInterval(intervalId);
    });
});

server.listen(3000, () => {
    console.log('http://localhost:3000');
});