const fs = require('fs');
const data = fs.readFileSync('C:/Users/Rishabh/.gemini/antigravity/brain/7b60a24a-fe3d-4588-9365-70f56f1fddcd/.system_generated/steps/131/output.txt', 'utf8');
const json = JSON.parse(data);
fs.writeFileSync('stitch_result.txt', typeof json.output_components === 'string' ? json.output_components : JSON.stringify(json.output_components, null, 2));
console.log("Success");
