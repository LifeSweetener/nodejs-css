/* Предоставляет возможность принимать
* http-запросы от клиента и отправлять ему ответы
* с надлежащей обработкой на сервере */
const http = require('http');

/* Позволяет работать с файловой системой сервера,
* извлекая оттуда нужную клиенту информацию */
const fs = require('fs')

/* Модуль, который подключает переменные среды из
* файла .env в корне сервера */
require('dotenv').config()

const PORT = process.env.PORT || '10000'    // переменные среды могут быть получены из базового объекта process

const os = require('os')                    // модуль для получения информации о текущей рабочей системе (в том числе ip-адрес)

/* Алгоритм получения текущего ip-адреса компьютера
* через объект os.networkInterfaces
*/
const ips = []
const get_local_IP = () => {
    const nets = os.networkInterfaces()
    const results = {}

    for (const interface_name of Object.keys(nets)) {
        for (const interface_data of nets[interface_name]) {
            if (! interface_data.internal && (interface_data.family == 'IPv4' || interface_data.family == 4)) {
                ips.push({
                    name: interface_name,
                    address: interface_data.address,
                })
            }
        }
    }
}

get_local_IP()
console.log('Your ip-addresses:\n', ips, '\n')
console.log('The first one was taken...\n')
const HOSTNAME = ips[0].address             // имя хоста, на котором будет запускаться этот сервер

const path = require('path')                // модуль для работы с путями файлов
const mime = require('mime')                // модуль для работы с MIME-типами отправляемых по сети файлов
const url = require('url')                  // модуль для работы с url запросов

const cache = {}                            // кеш для хранения уже считанных сервером файлов (это для повышения скорости выполнения сервером запросов)



/*============================*/
/* Обработка запросов клиента */
const server = http.createServer();
server.on('request', async (req, res) => {
        var filePath = ''
        if (req.url == '/') {
            filePath = 'pages/index.html'
        } else {
            filePath = url.parse(req.url).pathname;
            console.log(filePath)
        }
        var absPath = './' + filePath

        if (cache[absPath]) {
            res.writeHead(
                200,
                {'content-type': mime.getType(path.basename(filePath))}
            )
            res.end(cache[absPath])
        } else {
            if ((mime.getType(path.basename(filePath)).slice(0, 5) == 'image') || (mime.getType(path.basename(filePath)).slice(0, 5) == 'video')) {
                res.writeHead(
                    200,
                    {'content-type': mime.getType(path.basename(filePath))}
                )
                fs.createReadStream(absPath).pipe(res);
            } else {
                fs.readFile(absPath, (err, data) => {
                    if (err) {
                        res.writeHead(404, {'Content-Type': 'text/plain'})
                        res.write('Error 404: resource not found.')
                        res.end()
                    }
                    cache[absPath] = data
                    res.writeHead(
                        200,
                        {'content-type': mime.getType(path.basename(filePath))}
                    )
                    res.end(data)
                })
            }
        }
    }
);

/* Запуск сервера */
server.listen(PORT, HOSTNAME, () => {
    console.log(`Сервер работает на хосте ${HOSTNAME}\n\tна порту ${PORT}!`);
});