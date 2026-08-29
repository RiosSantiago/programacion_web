import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const dir = path.resolve('public/images/categories');
fs.mkdirSync(dir, { recursive: true });

// Professional coffee bean from Phosphor Icons - shows the full bean
// with the S-line on the flat face
const coffeeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <path d="M167.6,32.4C153.8,18.5,133.6,13,110.8,16.8c-21.7,3.6-43.3,15.3-61,33S20.4,89.1,16.8,110.8c-3.8,22.8,1.7,43,15.6,56.8C42.3,177.4,57.3,183,74.4,183c5,0,10.2-0.4,15.5-1.2c21.7-3.6,43.3-15.3,61-33s29.4-39.3,33-61C187.6,66.4,182.1,46.2,167.6,32.4z M35.3,113.9c3-17.8,12.8-35.9,27.7-50.8c15-15,33-24.8,50.8-27.7c4-0.7,7.9-1,11.6-1c6,0,11.4,0.8,15.9,2.3c-6.3,3.7-13,8.1-19.9,13.5c-15.6,12.3-25.7,29.5-30,51C86,142.3,63.4,154.7,47,158.8C35.3,141.2,33.1,128.5,35.3,113.9z M164.7,86.1c-3,17.8-12.8,35.9-27.7,50.8s-33,24.8-50.8,27.7c-9.1,1.5-17.5,1.1-24.8-1.1c6.2-3.5,12.9-7.7,19.9-13.5c15.6-12.3,25.7-29.5,30-51c7-34.9,31.5-47.7,48.5-52.4C164.6,58.7,166.9,71.6,164.7,86.1z" fill="#4A7C3F"/>
</svg>`;

// Wheat stalk 
const wheatSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <path d="M100 170 C90 160 76 156 64 160" fill="none" stroke="#4A7C3F" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M100 166 C112 156 124 152 136 158" fill="none" stroke="#4A7C3F" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="100" y1="190" x2="100" y2="40" stroke="#4A7C3F" stroke-width="3.5" stroke-linecap="round"/>
  <ellipse cx="72" cy="150" rx="12" ry="5.5" fill="#4A7C3F" transform="rotate(-18 72 150)"/>
  <line x1="66" y1="146" x2="50" y2="120" stroke="#4A7C3F" stroke-width="1.8" stroke-linecap="round"/>
  <ellipse cx="128" cy="144" rx="12" ry="5.5" fill="#4A7C3F" transform="rotate(18 128 144)"/>
  <line x1="134" y1="140" x2="150" y2="114" stroke="#4A7C3F" stroke-width="1.8" stroke-linecap="round"/>
  <ellipse cx="76" cy="126" rx="11" ry="5" fill="#4A7C3F" transform="rotate(-22 76 126)"/>
  <line x1="72" y1="122" x2="58" y2="96" stroke="#4A7C3F" stroke-width="1.8" stroke-linecap="round"/>
  <ellipse cx="124" cy="120" rx="11" ry="5" fill="#4A7C3F" transform="rotate(22 124 120)"/>
  <line x1="128" y1="116" x2="142" y2="90" stroke="#4A7C3F" stroke-width="1.8" stroke-linecap="round"/>
  <ellipse cx="82" cy="106" rx="10" ry="4.5" fill="#4A7C3F" transform="rotate(-26 82 106)"/>
  <line x1="78" y1="102" x2="66" y2="78" stroke="#4A7C3F" stroke-width="1.8" stroke-linecap="round"/>
  <ellipse cx="118" cy="100" rx="10" ry="4.5" fill="#4A7C3F" transform="rotate(26 118 100)"/>
  <line x1="122" y1="96" x2="134" y2="72" stroke="#4A7C3F" stroke-width="1.8" stroke-linecap="round"/>
  <ellipse cx="90" cy="88" rx="9" ry="4" fill="#4A7C3F" transform="rotate(-30 90 88)"/>
  <line x1="88" y1="85" x2="76" y2="60" stroke="#4A7C3F" stroke-width="1.8" stroke-linecap="round"/>
  <ellipse cx="110" cy="82" rx="9" ry="4" fill="#4A7C3F" transform="rotate(30 110 82)"/>
  <line x1="112" y1="79" x2="124" y2="54" stroke="#4A7C3F" stroke-width="1.8" stroke-linecap="round"/>
  <ellipse cx="100" cy="68" rx="8" ry="4" fill="#4A7C3F"/>
  <line x1="100" y1="64" x2="100" y2="34" stroke="#4A7C3F" stroke-width="1.8" stroke-linecap="round"/>
  <line x1="100" y1="64" x2="84" y2="38" stroke="#4A7C3F" stroke-width="1.8" stroke-linecap="round"/>
  <line x1="100" y1="64" x2="116" y2="38" stroke="#4A7C3F" stroke-width="1.8" stroke-linecap="round"/>
</svg>`;

async function gen() {
  await sharp(Buffer.from(coffeeSvg)).resize(200, 200).webp({ lossless: true }).toFile(path.join(dir, 'cultivos.webp'));
  console.log('cultivos OK');
  await sharp(Buffer.from(wheatSvg)).resize(200, 200).webp({ lossless: true }).toFile(path.join(dir, 'agricultura.webp'));
  console.log('agricultura OK');
}

gen().catch(e => console.error(e));
