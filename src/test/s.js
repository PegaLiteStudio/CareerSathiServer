const oldJson = {
    "Career Option After 12th": {
        "BBA क्या है.pdf": "SDKFJHURDA",
        "Call Center (कॉल सेंटर ) क्या होता है.pdf": "DHRIDJFHTD",
        "BSW कोर्स क्या है.pdf": "SDKFJHURSF",
        "D.ed क्या है.pdf": "VNDIRJGIOD",
        "Hotel Management क्या है.pdf": "JDOWJFIRUT",
        "Lab Technician क्या है.pdf": "MVKDURHFUT",
        "lic agent क्या है.pdf": "VMDLEORITJ",
        "LLB क्या है.pdf": "XMCKDJFURT",
        "Travel and Tourism क्या है.pdf": "CMDJFRUFHT",
        "इंटीरियर डिजाइनर क्या है.pdf": "MCKDOETUTN",
        "फैशन डिज़ाइनर कैसे बनें.pdf": "LSDKFJRBFI",
        "विदेशी भाषा में करियर कैसे बनाएं.pdf": "RIJGUTJFKC"
    },
    "Career Option After 12th in Arts": {
        "B.A कोर्स क्या है.pdf": "ENJDFIREIU"
    },
    "Career Option After 12th in Commerce": {
        "CA क्या है.pdf": "RTNOERUTNV",
        "CS क्या है.pdf": "RINTVPOSER",
        "बीकॉम क्या है.pdf": "PEOVUTRNVT"
    }
};

const newJson = {
    "Career Option After 12th": {
        "BBA क्या है.pdf": "",
        "BSW कोर्स क्या है.pdf": "",
        "Call Center (कॉल सेंटर ) क्या होता है.pdf": "",
        "D.ed क्या है.pdf": "",
        "Hotel Management क्या है.pdf": "",
        "LLB क्या है.pdf": "",
        "Lab Technician क्या है.pdf": "",
        "Travel and Tourism क्या है.pdf": "",
        "lic agent क्या है.pdf": "",
        "इंटीरियर डिजाइनर क्या है.pdf": "",
        "फैशन डिज़ाइनर कैसे बनें.pdf": "",
        "विदेशी भाषा में करियर कैसे बनाएं.pdf": ""
    },
    "Career Option After 12th in Arts": {
        "B.A कोर्स क्या है.pdf": "",
        "hotel manegement क्या है.pdf": "",
        "फैशन डिज़ाइनर कैसे बनें.pdf": ""
    },
    "Career Option After 12th in Commerce": {
        "BBA क्या है.pdf": "",
        "CA क्या है.pdf": "",
        "CS क्या है.pdf": "",
        "बीकॉम क्या है.pdf": ""
    },
    "Career Option After 12th in PCB": {
        "12वीं साइंस बायो के बाद क्या करें.pdf": "",
        "B फार्मा कोर्स क्या है.pdf": "",
        "BAMS कोर्स क्या है.pdf": "",
        "BHMS क्या है और कैसे करें.pdf": "",
        "BMLT कोर्स क्या है.pdf": "",
        "BVSc कोर्स क्या है.pdf": "",
        "MBBS": {
            "MBBS के बाद लोकप्रिय विकल्प": {
                "एमबीबीएस के बाद लोकप्रिय विकल्प.pdf": ""
            },
            "MBBS कोर्स क्या है और कैसे करे.pdf": ""
        },
        "बीएससी नर्सिंग क्या है.pdf": "",
        "बीएससी होम साइंस क्या है.pdf": ""
    },
    "Career Option After 12th in PCM": {
        "12th PCM के बाद क्या करे.pdf": "",
        "B Arch क्या है.pdf": "",
        "BCS कोर्स क्या है.pdf": "",
        "BE क्या है.pdf": "",
        "BTech क्या है.pdf": "",
        "NDA क्या है.pdf": "",
        "आर्मी टेक्निकल इंट्री स्कीम (Army Technical Entry Scheme).pdf": "",
        "गणित के छात्रों के लिए टॉप करियर विकल्प.pdf": ""
    }
};


// Function to generate a random ID
function generateRandomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomId = '';
    const idLength = 10; // You can adjust the length as needed

    for (let i = 0; i < idLength; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        randomId += chars[randomIndex];
    }

    return randomId;
}

// Recursive function to traverse and update the JSON
function insertRandomIds(obj, oldObj) {
    for (const key in obj) {
        if (typeof obj[key] === 'object') {
            // If the value is an object, recursively call the function
            if (oldObj && oldObj[key]) {
                insertRandomIds(obj[key], oldObj[key]); // Pass the corresponding sub-objects
            } else {
                // Handle the case where the key doesn't exist in oldJson
                insertRandomIds(obj[key], undefined); // Pass undefined for oldObj[key]
            }
        } else if (obj[key] === '') {
            // If the value is an empty string, check if there's a corresponding ID in the old JSON
            if (oldObj && oldObj[key]) {
                obj[key] = oldObj[key]; // Use the existing ID
            } else {
                obj[key] = generateRandomId(); // Generate a new random ID
            }
        }
    }
}

// Call the function to insert random IDs from the old JSON
insertRandomIds(newJson, oldJson);

// Print the updated JSON
console.log(JSON.stringify(newJson, null, 2));