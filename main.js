const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

const questions = [
    "site:site-brand-1.ru",
    "site:site-brand-2.ru",
    "site:site-brand-3.ru"
];


async function fetchGoogleSearchResults(query) {
    try {
        const response = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
        const $ = cheerio.load(response.data);
        const links = [];
        // Извлекаем ссылки из результатов поиска
        $('a').each((i, element) => {
            let href = $(element).attr('href');
           
            if (!href || !href.startsWith('/url?q=') || href.includes('/search') || href.includes('google.com') || href.includes('chillingeffects.org')) {
                return; 
            }

           
            href = href.replace('/url?q=', '');
            const paramsStart = href.indexOf('&');
            if (paramsStart > -1) {
                href = href.substring(0, paramsStart);
            }

        
            if (href.startsWith('http')) {
                links.push(href);
            }
        });

        return links;
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function searchQuestions(folderName) {
    const dirPath = path.join(__dirname, folderName);
    try {
        await fs.mkdir(dirPath, {recursive: true});
    } catch (error) {
        console.error('Ошибка при создании директории:', error);
        return;
    }

    for (const question of questions) {
        console.log(`Check: ${question}`);
        const domain = question.match(/site:([^ ]+)/)[1]; // Извлекаем домен из вопроса
        const links = await fetchGoogleSearchResults(question);

        // Если у домена нет ссылок, пропускаем итерацию
        if (links.length === 0) continue;

        // Формируем содержимое файла
        const content = links.map(link => link.replace(/^https?:\/\/[^/]+/, '')).join('\n');


        // Имя файла соответствует домену
        const fileName = `${domain}-urls.txt`;
        const filePath = path.join(dirPath, fileName);

        try {
            await fs.writeFile(filePath, content);
            console.log(`Файл ${fileName} успешно создан в папке ${folderName}`);
        } catch (error) {
            console.error('Ошибка при записи файла:', error);
        }

        console.log('--------------------------------');
    }
}

const folderName = 'mySiteBrand'; // Здесь вводим имя папки

searchQuestions(folderName);
