const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');


function validateXML(xmlString, schemaName) {
    try {
        const errors = [];

        const errorHandler = {
            warning: (msg) => errors.push({ level: 'warning', message: msg }),
            error: (msg) => errors.push({ level: 'error', message: msg }),
            fatalError: (msg) => errors.push({ level: 'fatal', message: msg })
        };

        const parser = new DOMParser({ errorHandler });
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

        const parserErrors = xmlDoc.getElementsByTagName('parsererror');
        if (parserErrors.length > 0) {
            errors.push({
                level: 'error',
                message: 'XML parsing error: ' + parserErrors[0].textContent
            });
        }

        const schemaPath = getSchemaPath(schemaName);

        if (!fs.existsSync(schemaPath)) {
            errors.push({
                level: 'warning',
                message: `XSD schema not found: ${schemaPath}`
            });
            return {
                valid: errors.filter(e => e.level === 'error' || e.level === 'fatal').length === 0,
                errors: errors,
                message: errors.length > 0 ? errors.map(e => `[${e.level}] ${e.message}`).join('; ') : 'XML is well-formed'
            };
        }

        const xsdContent = fs.readFileSync(schemaPath, 'utf-8');
        const xsdDoc = parser.parseFromString(xsdContent, 'text/xml');

        const xmlRoot = xmlDoc.documentElement;
        const xsdElements = xsdDoc.getElementsByTagName('xs:element');

        if (xsdElements.length > 0) {
            const xsdRoot = xsdElements[0];
            const expectedRootName = xsdRoot.getAttribute('name');

            if (expectedRootName && expectedRootName !== xmlRoot.tagName) {
                errors.push({
                    level: 'error',
                    message: `Root element mismatch. Expected: ${expectedRootName}, Got: ${xmlRoot.tagName}`
                });
            }
        }

        if (!xmlRoot) {
            errors.push({
                level: 'error',
                message: 'No root element found in XML'
            });
        }

        const hasErrors = errors.filter(e => e.level === 'error' || e.level === 'fatal').length > 0;

        console.log(`XML validation for ${schemaName}: ${hasErrors ? 'FAILED' : 'PASSED'}`);

        return {
            valid: !hasErrors,
            errors: errors,
            message: hasErrors
                ? errors.filter(e => e.level === 'error' || e.level === 'fatal').map(e => e.message).join('; ')
                : 'XML validation successful'
        };

    } catch (error) {
        return {
            valid: false,
            errors: [{ level: 'fatal', message: error.message }],
            message: `Validation error: ${error.message}`
        };
    }
}

function getSchemaPath(schemaName) {
    return path.join(__dirname, '..', 'schemas', `${schemaName}.xsd`);
}

function schemaExists(schemaName) {
    const schemaPath = getSchemaPath(schemaName);
    return fs.existsSync(schemaPath);
}

/**
 * @param {string} xmlFilePath 
 * @param {string} schemaName 
 * @returns {Object} 
 */
function validateXMLFile(xmlFilePath, schemaName) {
    try {
        const xmlContent = fs.readFileSync(xmlFilePath, 'utf-8');
        return validateXML(xmlContent, schemaName);
    } catch (error) {
        return {
            valid: false,
            errors: [{ level: 'fatal', message: error.message }],
            message: `File read error: ${error.message}`
        };
    }
}

module.exports = {
    validateXML,
    validateXMLFile,
    getSchemaPath,
    schemaExists
};
