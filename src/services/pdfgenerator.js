const pdf = require('html-pdf');
const fs = require('fs');

const dbservice = require('./../services/dbservice');
const templateEngine = require('./../model/templateEngine.js');


exports.getPDFReport = function(PDFfile){
    dbservice.getPetitions(function(data){

        let HTMLToAppend='';

        for(let i=0;i<data.length;i++){
            HTMLToAppend+=`<tr> <td>${data[i].id}</td> <td>${data[i].title}</td> <td>${data[i].author}</td> <td>${data[i].description}</td><td>${data[i].currentsignatures}</td><td>${data[i].signaturegoal}</td></tr>`;
        }

        let map = [{key:'<p></p>',value:HTMLToAppend}];

        let parsedHTML = templateEngine.getReplacedFile('htmlreport', map);
        fs.writeFile("./../output/pdftogenerate.html", parsedHTML, function(err) {
            if(err) {
                return console.log(err);
            }
            let html = fs.readFileSync('./../output/pdftogenerate.html', 'utf8');
            let options = { format: 'Letter' };

            pdf.create(html, options).toFile('./../output/generatedpdf.pdf', function(err, response) {
                if (err) return console.log(err);

                fs.readFile('./../output/generatedpdf.pdf', function (err,dataresult){
                    PDFfile(dataresult);
                });

            });

        });
    });

};
