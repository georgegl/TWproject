const http = require("http");
const fs = require('fs');
const qs = require('querystring');
const nodeSession = require('node-session');
const pdf = require('html-pdf');

const dbservice = require('./../services/dbservice');
const templateEngine = require('./../model/templateEngine.js');
const PDFGenerator = require('./../services/pdfgenerator');

let contentType = [
    {key:"html",value:"text/html"},
    {key:"css",value:"text/css"},
    {key:"png",value:"image/png"},
    {key:"jpg",value:"image/jpg"},
    {key:"ico",value:"image/x-icon"},
    {key:`pdf`,value:`application/pdf`}
    ];

let session = new nodeSession({secret: 'Q3UBzdH9GEfiRCTKbi5MTPyChpzXLsTD'});

http.createServer(function(req,res){
    session.startSession(req,res,function(){
    switch(req.method){
        case "GET":
            try {
                let extractEndURL = req.url.split(".")[req.url.split(".").length - 1];
                let getContentType = "";

                for (let i = 0; i < contentType.length; i++) {
                    if (extractEndURL === contentType[i].key) {
                        getContentType = contentType[i].value;
                    }
                }

                res.writeHead(200, {"Content-Type": getContentType});

                if (req.url === "/") {

                    dbservice.getPetitions(function (data) {

                        let map = [];

                        for (let i = 0; i < data.length; i++) {
                            if (req.session.has('username')) {
                                map.push({key: 'Login or Register', value: `Logout(${req.session.get('username')})`});
                                map.push({
                                    key: `<a class='controlpanel' href="controlpanel.html"></a>`,
                                    value: `<a class='controlpanel' href="controlpanel.html">Dashboard</a>`
                                });
                            }
                            map.push({key: `%title${i}%`, value: data[i].title});
                            map.push({key: `%description${i}%`, value: data[i].description});
                            map.push({key: `%author${i}%`, value: data[i].author});
                            map.push({key: `%signs${i}%`, value: data[i].currentsignatures});
                            map.push({key: `%signgoal${i}%`, value: data[i].signaturegoal});
                            map.push({key: `%petitionid${i}%`, value: data[i].id});
                        }

                        let parsedIndex = templateEngine.getReplacedFile(req.url, map);

                        res.end(parsedIndex);

                    });
                    return;
                }

                if (extractEndURL === 'png' || extractEndURL === 'jpg' || extractEndURL === 'ico') {
                    let fileContents = fs.readFileSync(`${__dirname}/../view${req.url}`);
                    res.end(fileContents, 'binary');
                    return;
                }

                if(req.url==='/pdfreport.pdf'){
                    PDFGenerator.getPDFReport(function(PDFfile){
                       res.end(PDFfile) ;
                    });
                    /* dbservice.getPetitions(function(data){

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

                                fs.readFile('./../output/generatedpdf.pdf', function (err,data){
                                    res.end(data);
                                });

                            });

                        });
                     }); */
                    return;
                }

                if (extractEndURL.match(/html/) || extractEndURL.match(/css/)) {
                    let map = [];
                    if (req.session.has('username')) {
                        map.push({key: 'Login or Register', value: `Logout(${req.session.get('username')})`});
                        map.push({
                            key: `<a class='controlpanel' href="controlpanel.html"></a>`,
                            value: `<a class='controlpanel' href="controlpanel.html">Dashboard</a>`
                        });
                        if (req.url === "/registerpage.html") {
                            req.session.flush();
                        }
                    }
                    else {
                        map.push({
                            key: '<input name="createpetition" type="submit">',
                            value: `Register or Login before creating a petition!`
                        });

                    }

                    if (req.url.match(/petitionview.html/)) {
                        let startSubString = 'petitionview.html?id=';
                        let petitionID = req.url.substring(req.url.indexOf(startSubString) + startSubString.length, req.url.length);

                        dbservice.getPetitions(function (data) {
                            for (let i = 0; i < data.length; i++) {
                                if (data[i].id == petitionID) {
                                    map.push({key: `%title%`, value: data[i].title});
                                    map.push({key: `%description%`, value: data[i].description});
                                    map.push({key: `%author%`, value: data[i].author});
                                    map.push({key: `%status%`, value: data[i].status});
                                    map.push({key: `%signs%`, value: data[i].currentsignatures});
                                    map.push({key: `%signgoal%`, value: data[i].signaturegoal});
                                    map.push({key: `%petitionid%`, value: data[i].id});
                                }
                            }
                            let parsedHTML = templateEngine.getReplacedFile('petitionview', map);
                            res.end(parsedHTML);
                        });
                        return;
                    }
                    if (req.url.match(/controlpanel.html/)) {

                        if(req.url.match(/petid/)){
                            let startIndex='controlpanel.html?petid=';
                            let petitionID = req.url.substring(startIndex.length+1,req.url.length);
                            dbservice.deletePetition(petitionID);
                        }

                        if (!req.session.has('role')) {
                            res.end('Please login before accessing control panel!');
                        } else {
                            if (req.session.get('role') === 'administrator') {
                                dbservice.getPetitions(function (data) {

                                    let HTMLToAppend = '';

                                    if (data.length === 0) {
                                        HTMLToAppend += "<div class='standbytext'> You have no petitions! </div>"
                                    } else {
                                        for (let i = 0; i < data.length; i++) {
                                            HTMLToAppend += `<div class=\"listpetitions\"> <p>Title: ${data[i].title}</p> <p>Author: ${data[i].author}</p> <p>Status: ${data[i].status}</p><p>Description: ${data[i].description}</p> <p>Signed ${data[i].currentsignatures} times, need total of ${data[i].signaturegoal}</p> <button class='buttonlistpetition' onclick="location.href='petitionview.html?id=${data[i].id}'" type="button"> Visit petition</button> <form method="get"><button class="deletebutton" name="petid" value="${data[i].id}" type="submit">Delete</button></form> </div>`;
                                        }
                                    }
                                    map.push({key:`<b></b>`,value:`<button onclick="location.href='htmlreport.html'" type="button">Generate HTML Report</button><button onclick="location.href='pdfreport.pdf'" type="button">Generate PDF Report</button>`})
                                    map.push({key: '%userid%', value: req.session.get('userid')});
                                    map.push({key: '%fullname%', value: req.session.get('name')});
                                    map.push({key: '%accounttype%', value: req.session.get('role')});
                                    map.push({key: "<div class=\"standbytext\"></div>", value: HTMLToAppend});

                                    let parsedHTML = templateEngine.getReplacedFile("controlpanel", map);

                                    res.write(parsedHTML);
                                    res.end();
                                })
                            } else {
                                dbservice.getPetitions(function (data) {

                                    let HTMLToAppend = '';
                                    let petitionsByUserID = [];

                                    for (let i = 0; i < data.length; i++) {
                                        if (req.session.get('userid') == data[i].userid) {
                                            petitionsByUserID.push(data[i]);
                                        }
                                    }

                                    if (petitionsByUserID.length === 0) {
                                        HTMLToAppend += "<div class='standbytext'> You have no petitions! </div>"
                                    } else {
                                        for (let i = 0; i < petitionsByUserID.length; i++) {
                                            HTMLToAppend += `<div class=\"listpetitions\"> <p>Title: ${petitionsByUserID[i].title}</p> <p>Author: ${petitionsByUserID[i].author}</p> <p>Description: ${petitionsByUserID[i].description}</p> <p>Signed ${petitionsByUserID[i].currentsignatures} times, need total of ${petitionsByUserID[i].signaturegoal}</p> <button class='buttonlistpetition' onclick="location.href='petitionview.html?id=${petitionsByUserID[i].id}'" type="button"> Visit petition</button> <form method="get"><button class="deletebutton" name="petid" value="${data[i].id}" type="submit">Delete</button></form></div>`;
                                        }
                                    }

                                    map.push({key: '%userid%', value: req.session.get('userid')});
                                    map.push({key: '%fullname%', value: req.session.get('name')});
                                    map.push({key: '%accounttype%', value: req.session.get('role')});
                                    map.push({key: "<div class=\"standbytext\"></div>", value: HTMLToAppend});

                                    let parsedHTML = templateEngine.getReplacedFile("controlpanel", map);

                                    res.write(parsedHTML);
                                    res.end();
                                })
                            }
                        }
                        return;
                    }
                    if(req.url==='/htmlreport.html'){
                        dbservice.getPetitions(function(data){

                            let HTMLToAppend='';

                            for(let i=0;i<data.length;i++){
                                HTMLToAppend+=`<tr> <td>${data[i].id}</td> <td>${data[i].title}</td> <td>${data[i].author}</td> <td>${data[i].description}</td><td>${data[i].currentsignatures}</td><td>${data[i].signaturegoal}</td></tr>`;
                            }

                            let map = [{key:'<p></p>',value:HTMLToAppend}];

                            let parsedHTML = templateEngine.getReplacedFileByRequest(req.url, map);
                            res.end(parsedHTML);
                        });
                    return;
                    }

                    let parsedHTML = templateEngine.getReplacedFileByRequest(req.url, map);
                    res.end(parsedHTML);
                    return;
                }
            }catch(err){
                res.end("Bad request, please retry! \n Error text: "+err);
            }

            break;

        case "POST":
            try {
                if (req.url === '/searchpage.html') {

                    let body = '';

                    req.on('data', function (data) {

                        body += data;

                        if (body.length > 1e6) {
                            req.connection.destroy();
                        }

                    });

                    req.on('end', function () {

                        let dataFromPost = qs.parse(body);
                        let searchInput = dataFromPost.searchpetition;
                        let authorSearchInput = dataFromPost.createdby;

                        dbservice.getPetitions(function (data) {

                            let HTMLToAppend = '';
                            let searchResults = [];
                            for (let i = 0; i < data.length; i++) {
                                if (data[i].description.toLowerCase().includes(searchInput) && !authorSearchInput) {
                                    searchResults.push(data[i]);
                                } else if (data[i].description.toLowerCase().includes(searchInput) && data[i].author.toLowerCase().includes(authorSearchInput)) {
                                    searchResults.push(data[i]);
                                }
                            }

                            if (searchResults.length === 0) {
                                HTMLToAppend += "<div class='standbytext'> Found no petition that matches your filters! </div>"
                            } else {
                                for (let i = 0; i < searchResults.length; i++) {
                                    HTMLToAppend += `<div class=\"listpetitions\"> <p>Title: ${searchResults[i].title}</p> <p>Author: ${searchResults[i].author}</p> <p>Description: ${searchResults[i].description}</p> <p>Signed ${searchResults[i].currentsignatures} times, need total of ${searchResults[i].signaturegoal}</p> <button class='buttonlistpetition'  onclick="location.href='petitionview.html?id=${searchResults[i].id}'" type="button"> Visit petition</button> </div>`;
                                }
                            }

                            let map = [{
                                key: "<div class=\"standbytext\"> Waiting for an action...</div>",
                                value: HTMLToAppend
                            }];

                            res.writeHead(200, {"Content-Type": "text/html"});

                            let parsedHTML = templateEngine.getReplacedFile("searchpage", map);

                            res.write(parsedHTML);
                            res.end();

                        })
                    })

                }
                if (req.url === '/registerpage.html') {

                    let body = '';

                    req.on('data', function (data) {

                        body += data;

                        if (body.length > 1e6) {
                            req.connection.destroy();
                        }

                    });

                    req.on('end', function () {

                        let dataFromPost = qs.parse(body);
                        let dataFromPostLength = Object.keys(dataFromPost).length;

                        if (dataFromPostLength === 6) {

                            dbservice.getAccounts(function (data) {

                                let alreadyRegistered = false;
                                let map = [{key: "<label class=\"message\"></label>", value: ''}];

                                for (let i = 0; i < data.length; i++) {
                                    if (dataFromPost.userNameRegister === data[i].username || dataFromPost.email === data[i].email) {
                                        map[0].value = "<label class=\"message\">Already existing user!</label>";
                                        alreadyRegistered = true;
                                    }
                                }

                                if (!alreadyRegistered) {
                                    dbservice.registerUser(dataFromPost.firstName, dataFromPost.lastName, dataFromPost.userNameRegister, dataFromPost.email, dataFromPost.passwordRegister);
                                    map[0].value = "<label class=\"message\">User registered successfully!</label>";

                                }

                                let parsedHTML = templateEngine.getReplacedFile("registerpage", map);

                                res.write(parsedHTML);
                                res.end();

                            });

                        }
                        if (dataFromPostLength === 2) {
                            dbservice.getAccounts(function (data) {

                                let map = [{key: "<label class=\"loginmessage\"></label>", value: ''}];
                                let loggedSuccessfully = false;

                                for (let i = 0; i < data.length; i++) {
                                    if (dataFromPost.userNameLogin === data[i].username && dataFromPost.passwordLogin === data[i].password) {
                                        map[0].value = "<label class=\"loginmessage\">User logged in successfully!</label>";
                                        req.session.put("username", data[i].username);
                                        req.session.put("userid", data[i].id);
                                        req.session.put("role", data[i].role);
                                        req.session.put("name", data[i].fname + " " + data[i].lname);
                                        loggedSuccessfully = true;
                                    }
                                }

                                if (!loggedSuccessfully) {
                                    map[0].value = "<label class=\"message\">Wrong username or password!</label>";
                                }

                                let parsedHTML = templateEngine.getReplacedFile("registerpage", map);

                                res.write(parsedHTML);
                                res.end();

                            });

                        }

                    })

                }
                if (req.url === '/petitionview.html') {

                    let body = '';

                    req.on('data', function (data) {

                        body += data;

                        if (body.length > 1e6) {
                            req.connection.destroy();
                        }

                    });

                    req.on('end', function () {

                        let dataFromPost = qs.parse(body);

                        dbservice.checkIfEmailAlreadySignedThePetition(dataFromPost.email, dataFromPost.petid, function (result) {
                            if (!result) {
                                dbservice.signPetition(dataFromPost.petid, dataFromPost.firstName, dataFromPost.lastName, dataFromPost.email, dataFromPost.country);
                                dbservice.incrementSign(dataFromPost.petid);
                            }
                            dbservice.getPetitions(function (data) {
                                let map = [];
                                for (let i = 0; i < data.length; i++) {
                                    if (data[i].id == dataFromPost.petid) {
                                        map.push({key: `%title%`, value: data[i].title});
                                        map.push({key: `%description%`, value: data[i].description});
                                        map.push({key: `%author%`, value: data[i].author});
                                        map.push({key:`%status%`,value:data[i].status});
                                        if (!result) {
                                            map.push({key: `%signs%`, value: data[i].currentsignatures + 1});
                                            map.push({
                                                key: `<input type="text" name="country" maxlength="30">`,
                                                value: `<input type="text" name="country" maxlength="30"> <p>Congratulations! Successfully signed!</p>`
                                            })

                                        } else {
                                            map.push({key: `%signs%`, value: data[i].currentsignatures});
                                            map.push({
                                                key: `<input type="text" name="country" maxlength="30">`,
                                                value: `<input type="text" name="country" maxlength="30"> <p>Sorry, you already signed this petition!</p>`
                                            })
                                        }
                                        map.push({key: `%signgoal%`, value: data[i].signaturegoal});
                                        map.push({key: `%petitionid%`, value: data[i].id});
                                    }
                                }
                                let parsedHTML = templateEngine.getReplacedFile('petitionview', map);
                                res.end(parsedHTML);
                            });

                        });

                    })

                }
                if (req.url === '/createpage.html') {

                    let body = '';

                    req.on('data', function (data) {

                        body += data;

                        if (body.length > 1e6) {
                            req.connection.destroy();
                        }

                    });

                    req.on('end', function () {

                        let dataFromPost = qs.parse(body);

                        dbservice.getPetitions(function (data) {

                            let titleExists = false;
                            let newPetitionID = data[data.length - 1].id + 1;

                            for (let i = 0; i < data.length; i++) {
                                if (dataFromPost.title === data[i].title) {
                                    titleExists = true;
                                }

                            }

                            if (titleExists) {
                                res.writeHead(200, {"Content-Type": "text/html"});

                                let map = [{key: 'Do your best to change the world! Be the change!', value: `Petition name already exists!`},
                                    { key: `<a class='controlpanel' href="controlpanel.html"></a>`,
                                        value: `<a class='controlpanel' href="controlpanel.html">Dashboard</a>`
                                    }];

                                let parsedHTML = templateEngine.getReplacedFile("createpage", map);

                                res.write(parsedHTML);
                                res.end();

                            } else {
                                dbservice.createPetIDTable(newPetitionID);
                                dbservice.registerPetition(req.session.get('userid'), req.session.get('name'), dataFromPost.title, dataFromPost.recipient, dataFromPost.signaturegoal, dataFromPost.amountdays, dataFromPost.description);

                                res.writeHead(200, {"Content-Type": "text/html"});

                                let map = [{
                                    key: 'Do your best to change the world! Be the change!',
                                    value: `Petition registered successfully, check your dashboard!`},
                                    { key: `<a class='controlpanel' href="controlpanel.html"></a>`,
                                        value: `<a class='controlpanel' href="controlpanel.html">Dashboard</a>`
                                    }];

                                let parsedHTML = templateEngine.getReplacedFile("createpage", map);

                                res.write(parsedHTML);
                                res.end();

                            }
                        });

                    })

                }
            }catch(err){
                res.end("Bad request please retry!");
            }
            break;
        default :
            break;

    }
    });
}).listen(3333);




