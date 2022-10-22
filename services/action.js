const SQLite = require("better-sqlite3");
const sql = new SQLite('./mainDB.sqlite');

/*
*   FUNCIONES PARA ENVIAR INFORMACIÓN SOLICITADA POR EL FRONTEND
*   FUNCIONES PARA OPERAR INFORMACIÓN ENVIADA DESDE EL FRONTEND
*
*   VALIDA LAS ENTIDADES ANTES DE OPERAR Y NOTIFICA AL FRONTEND
*   DE CUALQUIER INCONVENIENTE, POR LO QUE LA INTERPRETACIÓN SE RESUME EN:
*
*   RESPUESTAS DEL BACKEND:
*
*   DATOS QUE SE ENVIAN DEL FRONTEND AL BACKEND (operateData) 
*       status == 400 - Si no eixste o se invalida la información en cualquier punto
*       status == 200 - Si la operación fue completada exitosamente, se notifica con el estado de la petición
*   
*   DATOS QUE SE ENVIAN DEL BACKEND AL FRONTEND (getData)
*       Object->null - Si no existe o se invalida la información en cualquier punto
*       JSON - Si existe, se responde con la informacíón solicitada por el frontend, en un JSON (string)
*       
*/

function getData(params, query) {    
    let entity, classroom, classrooms, classroomCode, questions, bankId, data, options;
    switch(params.task) {
        case "getEntityName":
            entity = obtainUser(query.username);
            if (!entity) return null;
            return entity.entityName;

        case "getRandomClassroomCode":
            classroomCode = generateUniqueRandomCodeFor("classroom", "classroomCode");
            if (!classroomCode) return null;
            return classroomCode; 

        case "getClassroomByCode":
            classroom = getClassroomByCode(query.code);
            if (!classroom) return null;
            return classroom;

        case "getClassroomsByTeacherUsername":
            entity = obtainUser(query.username);
            if (!entity) return null;
            classrooms = getClassroomsByTeacherUsername(query.username);
            if (isNullOrEmpty(classrooms)) return null;
            return classrooms;   

        case "getClassroomsByStudentUsername":
            entity = obtainUser(query.username);
            if (!entity) return null;
            classrooms = getClassroomsByStudentUsername(query.username);
            if (isNullOrEmpty(classrooms)) return null;
            return classrooms;   

        case "getStudentsByClassroomCode":
            entity = obtainEntity("classroom", "classroomCode", query.code);
            if (!entity) return null;
            entities = getStudentsByClassroomCode(query.code);
            if (isNullOrEmpty(entities)) return null;
            return entities;

        case "validateClassroomRegistered":
            data = query.data.split("-");
            entities = validateClassroomStudentRegistered(data[0], data[1]);
            if (isNullOrEmpty(entities)) return null;
            return entities;
               
        case "getQuestionsByClassroomCode":
            entity = obtainEntity("classroom", "classroomCode", query.code);
            if (!entity) return null;
            questions = getQuestionsByClassroomCode(query.code);
            if (isNullOrEmpty(questions)) return null;
            return questions;

        case "getBankCodeByClassroomCode":
            entity = obtainEntity("classroom", "classroomCode", query.code);
            if (!entity) return null;
            bankId = getBankCodeByClassroomCode(query.code);
            return bankId;

        case "getQuestionsByPublicBank":
            questions = getQuestionsByPublicBank();
            if (isNullOrEmpty(questions)) return null;
            return questions;

        case "getOptionsByQuestionCode":
            entity = obtainEntity("question", "questionCode", query.code);
            if (!entity) return null;
            options = getOptionsByQuestionCode(query.code);
            if (isNullOrEmpty(options)) return null;
            return options;

        case "getSurveysByClassroomCode":
            entity = obtainEntity("classroom", "classroomCode", query.code);
            if (!entity) return null;
            surveys = getSurveysByClassroomCode(query.code);
            if (isNullOrEmpty(surveys)) return null;
            return surveys;

        case "getSurveysByStudentUsernameAndClassroomCode":
            data = query.data.split("-");
            username = data[0];
            classroomCode = data[1];
            entity = obtainUser(username);
            if (!entity) return null;
            entity = obtainEntity("classroom", "classroomCode", classroomCode);
            if (!entity) return null;
            surveys = getSurveysByStudentUsernameAndClassroomCode(username, classroomCode);
            if (isNullOrEmpty(surveys)) return null;
            return surveys;

        case "getSurveyByCode":
            entity = obtainEntity("survey", "surveyCode", query.code);
            if (!entity) return null;
            return entity;

        case "getQuestionsByQuantity":
            data = query.data.split("-");
            quantity = data[0];
            classroomCode = data[1];
            entities = getQuestionsByQuantity(quantity, classroomCode);
            if (isNullOrEmpty(entities)) return null;
            return entities;

        case "getScoresByUsername":
            entity = obtainUser(query.username);
            if (!entity) return null;
            entities = getScoresByUsername(query.username);
            if (isNullOrEmpty(entities)) return null;
            return entities;
    };
}

function operateData(parcel) {
    parcel = JSON.parse(parcel);
    
    let entity, specialChars;
    switch(parcel.task) {
        case "register":
            entity = obtainUser(parcel.data.username)
            if (entity) return null;
            specialChars = containsSpecialChars(parcel.data.username);
            if (specialChars) return null;            
            return registerDB(parcel.entity, parcel.data.username, parcel.data.password);

        case "login":
            entity = obtainUser(parcel.data.username, parcel.data.password);
            if (!entity) return null;
            return entity;

        case "create_classroom":
            entity = obtainUser(parcel.data.teacherUsername);
            if (!entity) return null;
            specialChars = containsSpecialChars(parcel.data.classroomName);
            if (specialChars) return null;
            return registerClassroom(parcel.data);
            
        case "register_student_classroom":
            entity = obtainUser(parcel.data.studentUsername);
            if (!entity) return null;
            return joinToClassroom(parcel.data.studentUsername, parcel.data.classroomCode);

        case "register_question":
            entity = obtainEntity("bank", "bankCode", parcel.data.bankCode);
            if (!entity) return null;
            return registerQuestion(parcel.data);

        case "delete_question":   
            entity = obtainEntity("question", "questionCode", parcel.data);
            if (!entity) return null;            
            return deleteQuestion(parcel.data);

        case "create_survey":
            entity = obtainEntity("classroom", "classroomCode", parcel.data.classroomCode);
            if (!entity) return null;
            return createSurvey(parcel.data);

        case "set_scores":
            entity = obtainUser(parcel.data.username);
            if (!entity) return null;
            entity = obtainEntity("survey", "surveyCode", parcel.data.surveyCode);
            if (!entity) return null;
            entity = scoreActuallyExists(parcel.data.username, parcel.data.surveyCode);
            if (entity) return null;
            return setScoreToStudent(parcel.data);

        case "delete_classroom_student":
            entity = obtainUser(parcel.data.username);
            if (!entity) return null;
            entity = obtainEntity("classroom", "classroomCode", parcel.data.classroomCode);
            if (!entity) return null;
            return deleteStudentFromClassroom(parcel.data.username, parcel.data.classroomCode);
    }
}

function obtainEntity(table, attr, code) {
    const entity = sql.prepare(`SELECT * FROM ${table} WHERE ${attr}=?`).get(code);
    return entity;
}

function registerQuestion(data) {
    const questionCode = generateUniqueRandomCodeFor("question", "questionCode");
    sql.prepare("INSERT INTO question (questionCode, questionTitle, questionUrl, showToStudents, bankCode) VALUES (?,?,?,?,?)")
        .run(questionCode, data.questionTitle, data.questionUrl, data.showToStudents, data.bankCode);

    for(const option of data.answerOptions) {
        sql.prepare("INSERT INTO option (optionTitle, optionUrl, isValid, questionCode) VALUES (?,?,?,?)")
            .run(option.optionTitle, option.optionUrl, option.isValid, questionCode);
    }

    return true;
}

function deleteQuestion(code) {    
    sql.prepare("DELETE FROM question WHERE questionCode=?").run(code);
    sql.prepare("DELETE FROM option WHERE questionCode=?").run(code);
    return true;
}

function deleteStudentFromClassroom(username, classroomCode) {
    sql.prepare("DELETE FROM student_classroom WHERE studentUsername=? AND classroomCode=?").run(username, classroomCode);

    const surveys = sql.prepare("SELECT * FROM survey WHERE classroomCode=?").all(classroomCode);
    for(const survey of surveys) {
        sql.prepare("DELETE FROM student_survey WHERE studentUsername=? AND surveyCode=?").run(username, survey.surveyCode);
        sql.prepare("DELETE FROM score WHERE studentUsername=? AND surveyCode=?").run(username, survey.surveyCode);
    }
}

function createSurvey(data) {
    const surveyCode = generateUniqueRandomCodeFor("survey", "surveyCode");
    sql.prepare("INSERT INTO survey (surveyCode, surveyName, classroomCode, questionsQuantity) VALUES (?,?,?,?)")
        .run(surveyCode, data.surveyName, data.classroomCode, data.quantity);    

    asignSurveyToEntities(surveyCode, data.classroomCode);     
    return true;
}

function asignSurveyToEntities(surveyCode, classroomCode) {
    const classroomStudents = sql.prepare("SELECT * FROM student_classroom WHERE classroomCode=?").all(classroomCode);
    for(const classroom of classroomStudents) {
        sql.prepare("INSERT INTO student_survey (studentUsername, surveyCode) VALUES (?,?)")
            .run(classroom.studentUsername, surveyCode);
    }
    
    return true;
}

function obtainUser(username, password) {
    let teacher = sql.prepare("SELECT * FROM teacher WHERE username=?").get(username);
    if (password) {
        teacher = sql.prepare("SELECT * FROM teacher WHERE username=? AND password=?").get(username, password);
    }
    if (teacher) return {entityName: "teacher", entity: teacher};

    let student = sql.prepare("SELECT * FROM student WHERE username=?").get(username);
    if (password) {
        student = sql.prepare("SELECT * FROM student WHERE username=? AND password=?").get(username, password);
    }
    if (student) return {entityName: "student", entity: student};
    
    return null;
}

function registerDB(table, username, password) {
    sql.prepare(`INSERT INTO ${table} (username, password) VALUES (?,?)`).run(username, password);
    return true;
}

function getSurveysByClassroomCode(code) {
    const surveys = sql.prepare("SELECT * FROM survey WHERE classroomCode=?").all(code);
    return surveys;
}

function getSurveysByStudentUsernameAndClassroomCode(username, classroomCode) {
    const surveys = sql.prepare("SELECT * FROM survey WHERE classroomCode=?").all(classroomCode);

    let studentSurveysLoaded = [];
    for(const survey of surveys) {
        const studentSurvey = sql.prepare("SELECT * FROM student_survey WHERE studentUsername=? AND surveyCode=?").get(username, survey.surveyCode);
        if (studentSurvey) studentSurveysLoaded.push(survey);
    }

    return studentSurveysLoaded;
}

function getQuestionsByQuantity(quantity, classroomCode) {
    const privateBank = sql.prepare("SELECT * FROM bank WHERE classroomCode=?").get(classroomCode);
    const privateQuestions = sql.prepare("SELECT * FROM question WHERE bankCode=?").all(privateBank.bankCode);
    const publicQuestions = sql.prepare("SELECT * FROM question WHERE bankCode=?").all("1");

    let questions;
    if (publicQuestions.length != 0 && privateQuestions.length != 0) questions = publicQuestions.concat(privateQuestions);
    else if (privateQuestions.length != 0) questions = privateQuestions;
    else if (publicQuestions != 0) questions = publicQuestions;
    else return [];

    shuffle(questions); // Sortear los preguntas
    return questions.slice(0, quantity);
}

function getScoresByUsername(studentUsername) {
    const scores = sql.prepare("SELECT * FROM score WHERE studentUsername=?").all(studentUsername);
    return scores;
}

function getQuestionsByClassroomCode(classroomCode) {
    const bankCode = getBankCodeByClassroomCode(classroomCode);
    if (!bankCode) return null;

    const questions = sql.prepare("SELECT * FROM question WHERE bankCode=?").all(bankCode);
    return questions;
}

function getBankCodeByClassroomCode(classroomCode) {
    const bank = sql.prepare("SELECT * FROM bank WHERE classroomCode=?").get(classroomCode);
    if (!bank) return null;
    return bank.bankCode;
}

function getQuestionsByPublicBank() {
    const questions = sql.prepare("SELECT * FROM question WHERE bankCode=?").all("1");
    return questions;
}

function getOptionsByQuestionCode(code) {
    const options = sql.prepare("SELECT * FROM option WHERE questionCode=?").all(code);
    return options;
}

function getClassroomsByTeacherUsername(teacherUsername) {
    let classrooms = sql.prepare("SELECT * FROM classroom WHERE teacherUsername=?").all(teacherUsername);
    return classrooms;
}

function getClassroomsByStudentUsername(studentUsername) {
    const studentClassrooms = sql.prepare("SELECT classroomCode FROM student_classroom WHERE studentUsername=?").all(studentUsername);
    
    let classroomsLoaded = [];
    for (let classroom of studentClassrooms) {
        const code = classroom.classroomCode;
        classroom = sql.prepare("SELECT * FROM classroom WHERE classroomCode=?").get(code);
        classroomsLoaded.push(classroom);
    }

    return classroomsLoaded;
}

function getStudentsByClassroomCode(code) {
    const classrooms = sql.prepare("SELECT studentUsername FROM student_classroom WHERE classroomCode=?").all(code);
    const usernameList = classrooms.map(c => c.studentUsername);
    return usernameList;
}

function registerClassroom(data) {
    sql.prepare("INSERT INTO classroom (classroomCode, classroomName, classroomSection, classroomSubject, classroomPlace, teacherUsername) VALUES (?,?,?,?,?,?)")
        .run(data.classroomCode, data.classroomName, data.classroomSection, data.classroomSubject, data.classroomPlace, data.teacherUsername);    
    
    generatePrivateBank(data.classroomCode);
    return true;
}

function generatePrivateBank(classroomCode) {
    const code = generateUniqueRandomCodeFor("bank", "bankCode")
    sql.prepare(`INSERT INTO bank (bankCode, classroomCode) VALUES (?,?)`).run(code, classroomCode);
}

function joinToClassroom(username, classroomCode) {
    sql.prepare("INSERT INTO student_classroom (studentUsername, classroomCode) VALUES (?,?)").run(username, classroomCode);
    const surveys = sql.prepare("SELECT * FROM survey WHERE classroomCode=?").all(classroomCode);

    for(const survey of surveys) {
        sql.prepare("INSERT INTO student_survey (studentUsername, surveyCode) VALUES (?,?)").run(username, survey.surveyCode);
    }
    
    return true;
}

function scoreActuallyExists(username, surveyCode) {
    const score = sql.prepare("SELECT * FROM score WHERE studentUsername=? AND surveyCode=?").get(username, surveyCode);
    return score;
}

function setScoreToStudent(data) {
    sql.prepare("INSERT INTO score (score, maxScore, surveyCode, studentUsername) VALUES (?,?,?,?)")
        .run(data.score, data.maxScore, data.surveyCode, data.username);
    
    sql.prepare("DELETE FROM student_survey WHERE studentUsername=? AND surveyCode=?")
        .run(data.username, data.surveyCode);
      
    return true;
}

function getClassroomByCode(code) {
    const actualCode = sql.prepare("SELECT * FROM classroom WHERE classroomCode=?").get(code);    
    return actualCode;
}

function validateClassroomStudentRegistered(username, classroomCode) {
    const studentClassrooms = sql.prepare("SELECT * FROM student_classroom WHERE studentUsername=? AND classroomCode=?").get(username, classroomCode);
    return studentClassrooms;
}

// Funcion para asegurarnos de obtener un identificador unico para las entidades que lo requieran
function generateUniqueRandomCodeFor(table, attr) {
    let sixDigitsRandomNumber = generateRandomSixDigitsNumber();
    let object = sql.prepare(`SELECT * FROM ${table} WHERE ${attr}=?`).get(sixDigitsRandomNumber);
    if (object) return generateUniqueRandomCodeFor(table, attr);    
    return sixDigitsRandomNumber + "";
}

// Función para asegurarnos de obtener siempre un arreglo
function getParsedArray(string) {
    let arr = JSON.parse(string);
    if (!Array.isArray(arr)) {
        return [];
    } 
    return arr;
}

function generateRandomSixDigitsNumber() {
    return 100000 + Math.floor(Math.random() * 900000);
}

function containsSpecialChars(str) {
    const specialChars = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    return specialChars.test(str);
}

function isNullOrEmpty(arr) {
    if (!arr) return true;
    if (arr.length == 0) return true;
    return false;
}

function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
  }

module.exports = {operateData,getData}