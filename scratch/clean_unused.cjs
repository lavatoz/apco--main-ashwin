const fs = require('fs');
const path = 'c:/Users/JOEL/Downloads/apco--main-ashwin-main/apco--main-ashwin-main/src/pages/ClientDetailsPage.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/const isUpcoming = sIdx > currentIdx;/g, '');
fs.writeFileSync(path, content);
console.log('Cleaned up isUpcoming');
