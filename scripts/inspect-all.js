
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const FILES = [
    'Commercial Master  dt. 22.08.2025 (1).xls',
    'Purchase Order Update - Purchase Orders (1).csv',
    'ITEMACTIVE - Sheet 1.csv'
];

FILES.forEach(file => {
    const filePath = path.join(__dirname, '../data', file);
    if (!fs.existsSync(filePath)) return;

    console.log(`\n--- Inspecting: ${file} ---`);
    if (file.endsWith('.xls')) {
        const workbook = XLSX.readFile(filePath);
        console.log('Sheets:', workbook.SheetNames);

        workbook.SheetNames.forEach(name => {
            const sheet = workbook.Sheets[name];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            if (data.length > 0) {
                console.log(`Sheet "${name}" Header:`, data[0].slice(0, 5)); // First 5 cols
            }
        });
    } else {
        // Simple CSV read (first line)
        const content = fs.readFileSync(filePath, 'utf8');
        const firstLine = content.split('\n')[0];
        console.log('CSV Header:', firstLine.slice(0, 200));
    }
});
