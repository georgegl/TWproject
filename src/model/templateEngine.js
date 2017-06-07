const fs = require('fs');

exports.getReplacedFile = function(filename, mapToReplace) {

    let content = readViewHTML(filename);
    return replaceInFile(content,mapToReplace);

};


function readViewHTML(filename){

    if(filename==="/"){
        return fs.readFileSync(`${__dirname}/../view/index.html`, 'utf8');
    }

    return fs.readFileSync(`${__dirname}/../view/${filename}.html`, 'utf8');

}

exports.getReplacedFileByRequest = function(reqUrl,mapToReplace){

    let content = readViewByRequest(reqUrl);
    return replaceInFile(content,mapToReplace);

};

function readViewByRequest(reqUrl){

    if(reqUrl==="/"){
        return fs.readFileSync(`${__dirname}/../view/index.html`, 'utf8');
    }

    return fs.readFileSync(`${__dirname}/../view${reqUrl}`, 'utf8');

}

function replaceInFile(filename,mapToReplace){

    mapToReplace.forEach(item => {
        filename = filename.replace(item.key, item.value);
    });

    return filename;

}