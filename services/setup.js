function databaseSetup(sql) {
    sql.prepare("CREATE TABLE IF NOT EXISTS teacher (username TEXT, password TEXT)").run();
    sql.prepare("CREATE TABLE IF NOT EXISTS student (username TEXT, password TEXT)").run();

    sql.prepare("CREATE TABLE IF NOT EXISTS classroom (classroomCode TEXT, classroomName TEXT, classroomSection TEXT, classroomSubject TEXT, classroomPlace TEXT, teacherUsername TEXT)").run();
    sql.prepare("CREATE TABLE IF NOT EXISTS student_classroom (studentUsername TEXT, classroomCode TEXT)").run();

    sql.prepare("CREATE TABLE IF NOT EXISTS bank (bankCode TEXT, classroomCode TEXT)").run();
    sql.prepare("CREATE TABLE IF NOT EXISTS question (questionCode TEXT, questionTitle TEXT, questionUrl TEXT, questionType TEXT, showToStudents INTEGER, bankCode TEXT)").run();
    sql.prepare("CREATE TABLE IF NOT EXISTS option (optionTitle TEXT, optionUrl TEXT, isValid INTEGER, questionCode TEXT)").run();
    sql.prepare("CREATE TABLE IF NOT EXISTS classification (studentUsername TEXT, sensitiveIntuitive INTEGER, visualVerbal INTEGER, inductiveDeductive INTEGER, sequentialGlobal INTEGER, activeReflective INTEGER)").run();

    sql.prepare("CREATE TABLE IF NOT EXISTS score (score INTEGER, maxScore INTEGER, surveyCode TEXT, studentUsername TEXT)").run();
    sql.prepare("CREATE TABLE IF NOT EXISTS survey (surveyCode TEXT, surveyName TEXT, classroomCode TEXT, questionsQuantity INTEGER)").run();
    sql.prepare("CREATE TABLE IF NOT EXISTS student_survey (studentUsername TEXT, surveyCode TEXT)").run();


    setupPublicBank(sql);
}

function setupPublicBank(sql) {
    let publicBank = sql.prepare("SELECT * FROM bank WHERE bankCode=?").get("1");
    if (publicBank) return;
    
    sql.prepare("INSERT INTO bank (bankCode) VALUES (?)").run("1");
}

module.exports = {databaseSetup}