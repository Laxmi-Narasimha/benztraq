
const XLSX = require('xlsx');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/Commercial Master  dt. 22.08.2025 (1).xls');

try {
    console.log(`Reading file: ${FILE_PATH}`);
    const workbook = XLSX.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON (header row)
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length > 0) {
        console.log('Headers:', data[0]);
        console.log('First Row Sample:', data[1]);
    } else {
        console.log('Sheet is empty');
    }

} catch (err) {
    console.error('Error reading excel:', err);
}
