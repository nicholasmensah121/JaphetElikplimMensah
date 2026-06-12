const fs = require('fs');
const path = require('path');

// Read login.html
const loginHtmlPath = path.join(__dirname, 'login.html');
let loginContent = fs.readFileSync(loginHtmlPath, 'utf8');

// Find and replace the login.container CSS
loginContent = loginContent.replace(
    /\.login-container \{\s*min-height: calc\(100vh - 200px\);\s*display: flex;\s*align-items: center;\s*justify-content: center;\s*padding: 40px 20px;\s*background: linear-gradient\(135deg, #f5f5f5 0%, #ffffff 100%\);\s*\}/,
    `.login-container {
            min-height: calc(100vh - 200px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: clamp(15px, 4vw, 40px);
            background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
            width: 100vw;
            overflow-x: hidden;
        }`
);

// Replace login-wrapper
loginContent = loginContent.replace(
    /\.login-wrapper \{\s*background: white;\s*padding: 40px;\s*border-radius: 12px;\s*box-shadow: 0 10px 40px rgba\(0, 0, 0, 0\.1\);\s*max-width: 450px;\s*width: 100%;\s*\}/,
    `.login-wrapper {
            background: white;
            padding: clamp(20px, 5vw, 40px);
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            max-width: 450px;
            width: clamp(100% - 20px, 90vw, 450px);
            box-sizing: border-box;
        }`
);

// Replace login-header h1
loginContent = loginContent.replace(
    /\.login-header h1 \{\s*font-size: 28px;\s*color: #333;\s*margin-bottom: 10px;\s*\}/,
    `.login-header h1 {
            font-size: clamp(20px, 5vw, 28px);
            color: #333;
            margin-bottom: clamp(8px, 2vw, 15px);
        }`
);

// Replace form-group input
loginContent = loginContent.replace(
    /\.form-group input \{\s*width: 100%;\s*padding: 12px 15px;\s*border: 2px solid #ddd;\s*border-radius: 6px;\s*font-size: 14px;\s*font-family: inherit;\s*transition: all 0\.3s ease;\s*\}/,
    `.form-group input {
            width: 100%;
            padding: clamp(10px, 2vw, 12px) clamp(12px, 2vw, 15px);
            border: 2px solid #ddd;
            border-radius: 6px;
            font-size: clamp(13px, 3vw, 14px);
            font-family: inherit;
            transition: all 0.3s ease;
            min-height: 44px;
            box-sizing: border-box;
        }`
);

// Replace .btn styling
loginContent = loginContent.replace(
    /\.btn \{\s*padding: 12px 24px;\s*border: none;\s*border-radius: 6px;\s*cursor: pointer;\s*font-size: 14px;\s*font-weight: 600;\s*transition: all 0\.3s ease;\s*text-decoration: none;\s*text-align: center;\s*display: flex;\s*align-items: center;\s*justify-content: center;\s*\}/,
    `.btn {
            padding: clamp(10px, 2vw, 12px) clamp(16px, 3vw, 24px);
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: clamp(12px, 3vw, 14px);
            font-weight: 600;
            transition: all 0.3s ease;
            text-decoration: none;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 44px;
            width: 100%;
            box-sizing: border-box;
        }`
);

// Replace media queries
const oldMediaQuery = /@media \(max-width: 480px\) \{[^}]*\}/s;
const newMediaQueries = `@media (max-width: 768px) {
            .login-container {
                min-height: calc(100vh - 140px);
                padding: clamp(12px, 3vw, 30px);
            }

            .login-wrapper {
                padding: clamp(20px, 4vw, 35px);
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
            }

            .form-group {
                margin-bottom: clamp(12px, 2vw, 18px);
            }

            .form-group label {
                font-size: clamp(12px, 2.5vw, 13px);
            }
        }

        @media (max-width: 600px) {
            .login-container {
                padding: clamp(10px, 2.5vw, 25px);
            }

            .form-options {
                flex-direction: column;
                gap: clamp(8px, 1.5vw, 12px);
                margin-bottom: clamp(15px, 2.5vw, 20px);
            }
        }

        @media (max-width: 480px) {
            .login-container {
                min-height: calc(100vh - 100px);
                padding: clamp(8px, 2vw, 15px);
            }

            .login-wrapper {
                padding: clamp(14px, 3vw, 24px);
                border-radius: clamp(6px, 1.5vw, 12px);
                width: 100%;
            }

            .login-header {
                margin-bottom: clamp(15px, 3vw, 25px);
            }

            .login-header h1 {
                font-size: clamp(16px, 3.5vw, 22px);
                margin-bottom: clamp(4px, 1vw, 8px);
            }

            .login-header p {
                font-size: clamp(11px, 2.5vw, 12px);
            }

            .form-group {
                margin-bottom: clamp(10px, 2vw, 15px);
            }

            .form-group label {
                font-size: clamp(11px, 2.5vw, 12px);
            }

            .form-group input {
                padding: clamp(8px, 1.5vw, 10px) clamp(10px, 1.5vw, 12px);
                font-size: clamp(11px, 2.5vw, 12px);
                min-height: 44px;
            }

            .form-options {
                flex-direction: column;
                gap: clamp(6px, 1vw, 10px);
                font-size: clamp(10px, 2.5vw, 11px);
            }

            .btn {
                padding: clamp(8px, 1.5vw, 10px) clamp(12px, 2.5vw, 16px);
                font-size: clamp(11px, 2.5vw, 12px);
                min-height: 44px;
                width: 100%;
            }

            .loading-spinner {
                width: 14px;
                height: 14px;
                margin-right: clamp(4px, 1vw, 6px);
            }
        }

        @media (max-width: 360px) {
            .login-wrapper {
                padding: clamp(12px, 2.5vw, 18px);
            }

            .login-header h1 {
                font-size: clamp(14px, 3vw, 18px);
            }
        }`;

loginContent = loginContent.replace(oldMediaQuery, newMediaQueries);

// Write back
fs.writeFileSync(loginHtmlPath, loginContent, 'utf8');
console.log('✅ Updated login.html with responsive CSS');

// Read and update style.css
const styleCssPath = path.join(__dirname, 'style.css');
let styleContent = fs.readFileSync(styleCssPath, 'utf8');

// Update html font-size clamp
styleContent = styleContent.replace(
    /html \{\s*box-sizing: border-box;\s*font-size: clamp\(14px, 2vw, 18px\);/,
    `html {
    box-sizing: border-box;
    font-size: clamp(14px, 2vw, 18px);`
);

fs.writeFileSync(styleCssPath, styleContent, 'utf8');
console.log('✅ Updated style.css');

console.log('\n📱 Responsive design improvements applied!');
console.log('✨ Features:');
console.log('  - Fluid typography with clamp()');
console.log('  - Touch-friendly elements (44px+)');
console.log('  - No horizontal overflow');
console.log('  - Breakpoints: 360px, 480px, 600px, 768px, 1024px+');
