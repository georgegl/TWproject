const mysql = require('mysql');
const dbservice = require('./../services/dbservice');

const connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'Fender33!',
    database:'changetheworld'
});



exports.getPetitions = function(result){

    connection.query('select * from petitions',function(error,data){
        if(error) throw error;

        result(data);

    });
};

exports.getAccounts = function(result){

    connection.query('select * from accounts',function(error,data){
        if(error) throw error;

        result(data);

    });
};


exports.registerUser = function(fname,lname,username,email,password){

    connection.query(`insert into accounts (fname,lname,username,email,password) values ("${fname}","${lname}","${username}","${email}","${password}")`);

};

exports.signPetition = function(petitionid,fname,lname,email,country){

    connection.query(`insert into petid${petitionid} (fname,lname,email,country) values ("${fname}","${lname}","${email}","${country}")`);

};

exports.incrementSign = function(petitionid){

    dbservice.getPetitions(function(data){

        let signs=-1;

        for(let i=0;i<data.length;i++){
            if(data[i].id==petitionid){
                signs=data[i].currentsignatures;
            }
        }
           signs = signs+1;

        connection.query(`update petitions set currentsignatures=${signs} where id=${petitionid}`);

    })
};

exports.registerPetition = function(userid,author,title,recipient,signaturegoal,amountdays,description){

    connection.query(`insert into petitions (userid,title,recipient,description,signaturegoal,author,amountdays) values ("${userid}","${title}","${recipient}","${description}",${signaturegoal},"${author}",${amountdays})`);

};

exports.createPetIDTable = function(petitionID){

    connection.query(`create table petid${petitionID}(id int not null auto_increment primary key,fname varchar(30) null,lname varchar(30) not null,email varchar(30) not null,country varchar(30) default 'hidden' null);`);

};

exports.getSignsFromPetitionID = function(petitionID,result){

    connection.query(`select * from petid${petitionID}`,function(error,data){
        if(error) throw error;

        result(data);

    });

};

exports.checkIfEmailAlreadySignedThePetition = function(email,petitionID,result){


    connection.query(`select * from petid${petitionID} where email="${email}"`,function(error,data){
       if(data.length===0){
           result(false);
       }else{
           result(true);
       }

    });

    /*dbservice.getSignsFromPetitionID(petitionID,function(data){

        for(let i=0;i<data.length;i++){
            if(data[i].email===email){
                result(true);
                return;
            }
        }
        result(false);
    })*/

};

exports.deletePetition = function(petitionID){

  connection.query(`DELETE FROM petitions WHERE id=${petitionID}`);

  connection.query(`DROP TABLE petid${petitionID}`);

};


