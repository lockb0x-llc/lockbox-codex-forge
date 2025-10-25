import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const template = fs.readFileSync('manifest.template.json', 'utf8');
const manifest = template.replace('${CHROME_OAUTH_CLIENT_ID}', process.env.CHROME_OAUTH_CLIENT_ID || '');
fs.writeFileSync('manifest.json', manifest);
console.log('manifest.json generated from .env');
