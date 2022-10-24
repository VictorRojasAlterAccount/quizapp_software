const classroomCodeText = document.querySelector("#classroom_code_text");
const classroomNameText = document.querySelector("#classroom_name");
const classroomSectionText = document.querySelector("#classroom_section");
const classroomPresentationText = document.querySelector('#classroom-presentation-text');
const chart = document.querySelector("#chart");

// Segun la sesión mostramos un mensaje de encabezado
if (session.entityName == "teacher") {
    classroomPresentationText.innerHTML = "Lista de estudiantes"
} else if (session.entityName == "student") {
    classroomPresentationText.innerHTML = "Classroom"
}

const classroomSelectedCode = localStorage.getItem("classroomSelected") || null;
if (!classroomSelectedCode) { // Si accede aca sin seleccionar un classroom, no es posible operar, regresa a la vista anterior
    window.location.assign("../html/classrooms.html");
};

$(document).ready(function() { 
    getClassroom(); // Según el classroom seleccionado, completa la información de la ficha.
    
    // Segun la sesion, mostramos una vista dependiente del classroom
    if (session.entityName == "teacher") instanceTeacherClassroomView(); else
    if (session.entityName == "student") instanceStudentClassroomView();   
});

async function instanceTeacherClassroomView() {
    // Si la sesion es del profesor, mostraremos la lista de estudiantes segun el classroom seleccionado
    const res = await getInfo(`getStudentsByClassroomCode?code=${classroomSelectedCode}`);
    const studentList = res.data;

    // Si no hay estudiantes, notificamos
    if (!res.data || studentList.length == 0) {
        const txt = `
        <div style="margin-top:1%;" class="warn-message-presentation">
            <p>No existen estudiantes registrados en esta aula</p>
        </div>`

        return $("#load-classroom-data").replaceWith(txt);
    }

    // Si hay al menos un estudiante, maqueta sus datos
    let txtStudents = "";
    studentList.forEach(username => {
        txtStudents += loadStudentView(username);
    });

    // Reemplaza
    $("#load-classroom-data").replaceWith(txtStudents);
}

function loadStudentView(username) {
    return `<div onclick="redirectToStudentInfo(event, \'${username}\')" style="margin-top: 1%;margin-left: 3%;" class="pointer question-presentation flex">
        <div class="questions-text-button total-height">
            <div class="flex">
                <i style="font-size: 3em; color: rgb(15, 87, 155);" class="fas fa-user"></i>
                <p style="margin-left: 1em;" class="question-title">${username}</p>
            </div>
        </div>

        <div onclick="deleteStudent(event, \'${username}\', \'${classroomSelectedCode}\')" style="margin-left: auto; margin-right: 0.5em;" class="delete-question-button align center right">
            <i class="fas fa-bomb"></i>
        </div>
    </div>`;
}

async function instanceStudentClassroomView() {
    // Si la sesion es del estudiante, muestra sus resultados de encuestas realizadas para el classroom seleccionado
    let res = await getInfo(`getScoresByUsername?username=${session.username}`);
    const scoreList = res.data;
    
    // Si no hay calificaciones en este classroom, notifica.
    if (!res.data || scoreList.length == 0) {
        const txt = `
        <div style="margin-top: 0.5%; margin-bottom: 3%" class="warn-message-presentation">
            <p>No existen resultados de encuestas para este usuario</p>
        </div>`

        return $("#load-classroom-data").replaceWith(txt);
    }

    let txt = "";
    // Si hay al menos un puntaje, obtiene su encuesta y classroom correspondiente, 
    // si coincide con el classroom seleccionado, entonces maqueta.
    for(const scoreData of scoreList) {
        res = await getInfo(`getSurveyByCode?code=${scoreData.surveyCode}`);
        if (!res.data) continue;                
        const survey = res.data;

        if (survey.classroomCode == classroomSelectedCode)
            txt += `<div class="survey-results-presentation">
                <p style="padding: 15px">${survey.surveyName}</p>
                <p style="margin-left: 15px; margin-bottom: 15px; margin-right: 15px">${scoreData.score} / ${scoreData.maxScore}</p>
            </div>`;
    }

    txtScores = loadStudentScores(txt); // Maqueta

    // Reemplaza
    $("#load-classroom-data").replaceWith(txtScores);
}

function loadStudentScores(scores) {
    return `
    <div style="margin-top: 1%;margin-left: 3%;height: auto" class="question-presentation flex">
        <div class="questions-text-button total-height">
            <div class="flex">
                <i style="font-size: 3em; color: rgb(15, 87, 155);" class="fas fa-user"></i>
                <p style="margin-left: 1em;" class="question-title">${session.username}</p>
            </div>
            <div class="survey-results-area">
                ${scores}
            </div>
        </div>
    </div>`;
}

// Los estudiantes borrados, se borran del classroom y sus relacionados
async function deleteStudent(e, username, classroomCode) {
    e.preventDefault();

    // Para evitar la propagación de eventos, ya que usamos botones anidados
    if (!e) var e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();

    const confirmation = confirm("¿Estas seguro de borrar a esta estudiante?")
    if (!confirmation) return;

    const res = await postInfo({
        task: "delete_classroom_student",
        data: {
            username, classroomCode 
        }
    });

    if (res.status == 400) return alert("No ha sido posible eliminar el estudiante, intente de nuevo más tarde.");
    
    if (res.status == 200) {
        alert("Estudiante eliminado satisfactoriamente.");
        window.location.assign("../html/classroom.html");
    }
}

// Función para copiar texto al portapapeles
function copyClipboard(e, txt) {
    e.preventDefault();

    // Pequeña animación para notificar al usuario de la acción
    $("#clipboardBtn").css("color", "#ffac00");
    setTimeout(() => {
        $("#clipboardBtn").css("color", "#fff");
    }, 1000);

    // Copiar al portapapeles
    navigator.clipboard.writeText(txt);
}

// Función para maquetar la ficha del classroom
async function getClassroom() {
    const res = await getInfo(`getClassroomByCode?code=${classroomSelectedCode}`);
    if (!res.data) return window.location.assign("../html/classrooms.html");
    const classroom = res.data;

    // La información del classroom seleccionado la completa en una ficha.
    classroomCodeText.innerHTML = `
    <div class="flex">
        <p>Codigo: ${classroom.classroomCode}</p>

        <div onclick="copyClipboard(event, \'${classroom.classroomCode}\')">
            <a style="width: 1em;height: 0.5em;margin-left:1em; cursor:pointer">
                <i id="clipboardBtn" class="white-text fas fa-copy"></i>
            </a>
        </div>
    </div>`;

    // Reemplaza
    classroomNameText.innerHTML = `<p>${classroom.classroomName}</p>`;
    classroomSectionText.innerHTML = classroom.classroomSection;
}

// Función para construir un grafico, usada en la vista desde la sesion de profesor,
// para representar los puntajes historicos de cada usuario.
async function instanceChart(username) {
    let res = await getInfo(`getScoresByUsername?username=${username}`);
    const scoreList = res.data || [];

    // Igual que en la función getClassroom, buscamos los resultados
    // que coincidan con el classroom seleccionado.

    let results = [];
    for(let scoreData of scoreList) {
        res = await getInfo(`getSurveyByCode?code=${scoreData.surveyCode}`);
        if (!res.data) continue;        
        const survey = res.data;

        if (survey.classroomCode == classroomSelectedCode)
            results.push([`${survey.surveyName}-${scoreData.surveyCode}`, scoreData.score]);
    }

    var chart = anychart.column(results); // Declaracion
    chart.title("Resultados por encuesta");
    chart.yScale().ticks().interval(100); // Imagenes de 100 en 100
    chart.container("chart").draw(); // Dibujar grafica

    window.location.assign("#divOne"); // Mostrar vista
}

function redirectToStudentInfo(e, username) {
    e.preventDefault();
    chart.innerHTML = "";
    instanceChart(username);
}