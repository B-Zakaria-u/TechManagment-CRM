const xml2js = require('xml2js');

const parseXML = async (xmlData) => {
    const parser = new xml2js.Parser({
        explicitArray: true,
        ignoreAttrs: false,
        tagNameProcessors: [xml2js.processors.stripPrefix],
        attrNameProcessors: [xml2js.processors.stripPrefix]
    });
    return await parser.parseStringPromise(xmlData);
};

const buildXML = (obj, rootName = 'root') => {
    const builder = new xml2js.Builder({ rootName });
    return builder.buildObject(obj);
};

module.exports = { parseXML, buildXML };
