function setupPermissions() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var userMap = {
        "A.A. Paulraj": "paulraj@benz-packaging.com",
        "Abhishek Yogi": "wh.jaipur@benz-packaging.com",
        "Abhishek Kori": "abhishek@benz-packaging.com",
        "Accounts Chennai": "accounts.chennai@benz-packaging.com",
        "Accounts": "accounts@benz-packaging.com",
        "Ajay": "ajay@benz-packaging.com",
        "Aman Roy": "dispatch1@benz-packaging.com",
        "Anirudh Nama": "anirudh@benz-packaging.com",
        "Babita": "sales3@benz-packaging.com",
        "Chaitanya Chopra": "chaitanya@benz-packaging.com",
        "Credit Control": "credit@benz-packaging.com",
        "Deepak Bhardwaj": "deepak@benz-packaging.com",
        "Dinesh": "dinesh@benz-packaging.com",
        "Gate Entry": "gate@benz-packaging.com",
        "HR Support": "hr.support@benz-packaging.com",
        "HR Benz Packaging": "hr@benz-packaging.com",
        "Isha Mahajan": "isha@benz-packaging.com",
        "Jayashree N": "chennai@benz-packaging.com",
        "Karan Batra": "karan@benz-packaging.com",
        "Karthick Ravishankar": "karthick@benz-packaging.com",
        "Laxmi Narasimha": "laxmi@benz-packaging.com",
        "Lokesh Ronchhiya": "lokesh@benz-packaging.com",
        "Mahesh Gupta": "hr.manager@benz-packaging.com",
        "Manan Chopra": "manan@benz-packaging.com",
        "Narender": "warehouse@benz-packaging.com",
        "Neeraj Singh": "neeraj@benz-packaging.com",
        "Neveta Benz": "neveta@benz-packaging.com",
        "Paramveer Yadav": "supplychain@benz-packaging.com",
        "Pavan Kumar": "pavan.kr@benz-packaging.com",
        "Pawan": "qa@benz-packaging.com",
        "PO": "po@benz-packaging.com",
        "Pradeep Kumar": "ccare2@benz-packaging.com",
        "Prashansa Madan": "prashansa@benz-packaging.com",
        "Preeti R": "ccare6@benz-packaging.com",
        "Pulak Biswas": "pulak@benz-packaging.com",
        "Quality Chennai": "quality.chennai@benz-packaging.com",
        "Rahul": "rahul@benz-packaging.com",
        "Rekha C": "rekha@benz-packaging.com",
        "Samish Thakur": "samish@benz-packaging.com",
        "Sandeep": "sandeep@benz-packaging.com",
        "Satender Singh": "satender@benz-packaging.com",
        "Sathees Waran": "satheeswaran@benz-packaging.com",
        "Saurav Kumar": "saurav@benz-packaging.com",
        "Shikha Sharma": "ccare@benz-packaging.com",
        "Store": "store@benz-packaging.com",
        "Tanuj": "sales7@benz-packaging.com",
        "Tarun Bhardwaj": "sales5@benz-packaging.com",
        "Tomy Yamada": "yamada@benz-packaging.com",
        "TS Bhandari": "bhandari@benz-packaging.com",
        "Udit Suri": "it@benz-packaging.com",
        "Vijay Danieal": "bangalore@benz-packaging.com",
        "Vikky Dhanka": "vikky@benz-packaging.com",
        "Warehouse AP": "warehouse.ap@benz-packaging.com"
    };

    var managers = [
        'manan@benz-packaging.com',
        'chaitanya@benz-packaging.com',
        'prashansa@benz-packaging.com',
        'isha@benz-packaging.com',
        'laxmi@benz-packaging.com'
    ];

    // 1. Share sheet with everyone as editor
    var allEmails = Object.keys(userMap).map(function (k) { return userMap[k]; });

    // Need to process in batches to avoid execution time limits
    for (var k = 0; k < allEmails.length; k += 10) {
        try {
            var batch = allEmails.slice(k, k + 10);
            ss.addEditors(batch);
        } catch (e) {
            Logger.log("Error adding editors batch: " + e.message);
        }
    }

    // 2. Protect Master Sheet
    try {
        var master = ss.getSheetByName('MASTER TASKS');
        if (master) {
            var protections = master.getProtections(SpreadsheetApp.ProtectionType.SHEET);
            var masterProtection = protections.length > 0 ? protections[0] : master.protect().setDescription('Protect Master Tasks');
            masterProtection.removeEditors(masterProtection.getEditors());
            masterProtection.addEditors(managers);
        }
    } catch (e) {
        Logger.log("Master error: " + e.message);
    }

    // 3. Protect Employee Tabs
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
        try {
            var sheet = sheets[i];
            var sheetName = sheet.getName();
            if (sheetName === 'MASTER TASKS' || sheetName.indexOf('Sheet') > -1) continue;

            var employeeEmail = userMap[sheetName];
            if (employeeEmail) {
                var sheetProtections = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
                var tabProtection = sheetProtections.length > 0 ? sheetProtections[0] : sheet.protect().setDescription('Protect ' + sheetName);

                tabProtection.removeEditors(tabProtection.getEditors());

                var allowedEditors = [...managers];
                if (allowedEditors.indexOf(employeeEmail) === -1) {
                    allowedEditors.push(employeeEmail);
                }

                tabProtection.addEditors(allowedEditors);
            }
        } catch (e) {
            Logger.log("Error on sheet " + sheetName + ": " + e.message);
        }
    }

    SpreadsheetApp.getActive().toast('Permissions setup complete!');
}
