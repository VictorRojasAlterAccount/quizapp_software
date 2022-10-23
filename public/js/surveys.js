const classroomIdentifier = document.querySelector("#classroomIdentifier");
const REDIRECT_TO_FORMULARY = true;
const MAX_QUESTIONS_AVAILABLE = 20;

$(document).ready(function() {
    instanceViews(); // Instancia las vistas una vez se cargue el documento
});

async function instanceViews() {
    instanceCreateSurveyButton(); // Instancia el boton de crear encuesta segun la sesión

    let res;
    const entityName = session.entityName;
    // Segun el modelo de datos, tenemos dos formas distintas de acceder a los classrooms, depende de la sesión.
    if (entityName == "teacher") {
        res = await getInfo(`getClassroomsByTeacherUsername?username=${session.username}`);
    } else if (entityName == "student") {
        res = await getInfo(`getClassroomsByStudentUsername?username=${session.username}`);
    }

    if (!res.data) { // No hay classrooms registrados, notificamos
        $("#questions-menu-presentation").attr("href", "");
        $("#warn-message").parent().parent().css("width", "auto")
        $("#warn-message").parent().css("border", "none")
        $("#warn-message").replaceWith(`
        <div class="warn-message-createq-presentation">
            <p>No existen classrooms enlazados a tu cuenta</p>
        </div>`);
        return;
    }

    const classrooms = res.data;

    // Para evitar conflicto entre selectores (el que selecciona un classroom para mostrar encuestas,
    // y el que selecciona un classroom para asignarlo en la creación de encuesta, los definimos separados);
    instanceClassroomViewSelector(classrooms, "#select-classroom-view"); // Seleccionar classroom para mostrar encuestas
    instanceClassroomOptionsSelector(classrooms, "#classroom-options"); // Seleccionar classroom para asignar encuesta

    const classroomSelected = localStorage.getItem("classroomSelectionViewInput");
    if (!classroomSelected) return setWarnMessage("Selecciona un classroom para visualizar las encuestas.");

    const dataClassroom = await getClassroom(classroomSelected);
    if (!dataClassroom.data) return setWarnMessage("Selecciona un classroom válido para visualizar las encuestas.");

    // Tenemos un classroom seleccionado, ahora toca averiguar si tiene encuestas.
    instanceSurveysPresentation(dataClassroom.data, session);
}

function instanceCreateSurveyButton() {
    let create_survey_area_presentation = `
        <div class="question-area-presentation total-width">     
            <div class="survey_button_area survey_create_button">
                <a class="pointer" onclick="openCreateSurveyView('#divOne')" id="questions-menu-presentation">
                    <div class="total-width total-height white-text flex align center">                     
                        <i class="large-font fa fa-user"></i><p style="margin-left: 1em;">Crear encuesta</p>
                    </div>                
                </a>                
            </div>
        </div>`;
    if (session.entityName == "teacher") {
        $("#create-survey-button-presentation").replaceWith(create_survey_area_presentation);
    } else if (session.entityName == "student"){
        $("#create-survey-button-presentation").replaceWith(`<div style="display: none"></div>`);
    }
}

async function instanceSurveysPresentation(classroom, session) {
    // Buscamos las encuestas segun el classroom seleccionado, al profesor
    // enseñaremos todas las encuestas del classroom, al estudiante solo las que tenga
    // individualmente pendientes en ese classroom

    if (session.entityName == "teacher") {
        res = await getInfo(`getSurveysByClassroomCode?code=${classroom.classroomCode}`);
    } else if (session.entityName == "student") {
        res = await getInfo(`getSurveysByStudentUsernameAndClassroomCode?data=${session.username}-${classroom.classroomCode}`);
    }

    if (!res.data) return setWarnMessage(
        session.entityName == "teacher" 
        ? `${classroom.classroomName}: No tienes encuestas creadas en este classroom.`
        : `${classroom.classroomName}: No tienes encuestas pendientes en este classroom.`);

    const surveys = res.data;
    // Desplegamos las encuestas
    const txt = instanceSurveys(surveys, classroom, session.entityName == "student" ? REDIRECT_TO_FORMULARY : null);

    $("#surveys-view").replaceWith(txt);
}

function instanceSurveys(surveys, classroom, redirectToFormulary) {
    let txt = "";
    for(const survey of surveys) {
        // Maquetamos las encuestas segun la información que tenemos
        // No mandamos el identificador de la encuesta ya a los profesores, 
        // a estos los redirigimos al classroom en lugar de al formulario
        txt += surveyPresentation(survey, classroom, redirectToFormulary ? survey.surveyCode : undefined);
    }
    return txt;
}

function surveyPresentation(survey, classroom, surveyCode) {
    return `<div class="survey-area-presentation total-width">     
        <div class="survey_button_area survey_create_button">
            <a class="pointer" id="questions-menu-presentation" onclick="redirectToSurveyView(event, '${surveyCode}')">
                <div class="total-width total-height white-text flex">                                
                    <div class="survey-title-area">
                        <p class="survey-title">${survey.surveyName}</p>
                        <p class="question-options-number">Cantidad de preguntas (Maximas): ${survey.questionsQuantity}</p>
                    </div>
                    <div class="right" style="display:block;margin-top:1%;margin-right:1%">
                        <p>${classroom.classroomName}</p>
                        <p>${classroom.classroomCode}</p>
                    </div>
                </div>
            </a>                
        </div>
    </div>`
}

function redirectToSurveyView(e, surveyCode) {
    e.preventDefault();
    if (surveyCode == "undefined") return window.location.assign("../html/classrooms.html");
    loadQuestions(surveyCode);
}

// Si el usuario hace click sobre la encuesta, verificamos la existenica de esta en el backend, 
// su relación con el classroom y si todo esta bien, cargamos las preguntas correspondientes.
async function loadQuestions(surveyCode) {
    let res = await getInfo(`getSurveyByCode?code=${surveyCode}`);
    if (!res.data) return alert("Hubo un error al momento de obtener la encuesta, intenta de nuevo más tarde.");
    
    const survey = res.data;
    const quantity = survey.questionsQuantity;
    const classroomCode = survey.classroomCode;

    res = await getInfo(`getQuestionsByClassification?data=${session.username}-${classroomCode}-${quantity}`);
    if (!res.data) return alert("Hubo un error al momento de obtener el cuestionario, es posible que no hayan preguntas registradas, intente de nuevo más tarde.");
    const questions = res.data;

    localStorage.setItem("lastSurveyCode", surveyCode);
    localStorage.setItem("quizQuestions", JSON.stringify(questions));
    window.location.assign("../html/quiz.html");
}

async function createSurvey(e) {
    e.preventDefault();

    const surveyName = $("#survey_name").val();
    if (surveyName.length == 0) return alert("Por favor, ingresa un nombre para la encuesta");

    const classroomSelected = localStorage.getItem("classroomCreateSurvey");
    if (!classroomSelected) return alert("Por favor, selecciona un classroom antes.");

    const quantity = $("#quantity-questions").val();
    if (quantity.length == 0 || !parseInt(quantity) || parseInt(quantity) > MAX_QUESTIONS_AVAILABLE || parseInt(quantity) < 1) 
        return alert("Por favor, selecciona una cantidad de preguntas entre 1 y 20.");

    const classroomSelectedId = classroomSelected.split("-")[1];
    const entity = {
        surveyName,
        classroomCode: classroomSelectedId,
        quantity: parseInt(quantity)
    }

    const res = await postInfo({
        task: "create_survey",
        data: entity
    });

    if (res.status == 400) return alert("Ha ocurrido un error al momento de crear esta encuesta.");
    
    if (res.status == 200) {
        alert(`Creación satisfactoria de la encuesta con el nombre ${surveyName}.`);
        window.location.assign("../html/surveys.html");
    }
};

// Obtener el codigo del classroom seleccionado para la vista
async function getClassroom(dropdownClassroomSelected) {
    let dropdownClassroomSelectedCode = dropdownClassroomSelected.split("-")[1];
    let res = await getInfo(`getClassroomByCode?code=${dropdownClassroomSelectedCode}`);
    return res;
}

function instanceClassroomViewSelector(classrooms, div) {
    let options = "";
    // Instanciamos la lista de opciones
    for(let classroom of classrooms) {
        let v = `${classroom.classroomName}-${classroom.classroomCode}`;
        options += `<li class="option-text" id="${v}">${v}</li>`
    }

    let text = `
    <div class="dropdown">
        <div class="select">
        <span>Selecciona el classroom</span>
        <i class="fa fa-chevron-left"></i>
        </div>
        <input type="hidden">
        <ul class="dropdown-menu">
        ${options}
        </ul>
    </div>`

    $(div).replaceWith(`<div>${text}</div>`); // Reemplazamos
    instanceDropdown(); // Ejecutamos la instancia
    return true;
};

function instanceClassroomOptionsSelector(classrooms, div) {
    let options = "";
    // Instanciamos la lista de opciones
    for(let classroom of classrooms) {
        let v = `${classroom.classroomName}-${classroom.classroomCode}`;
        options += `<option value="${v}*">${v}</option>`
    }

    // Notese que definimos un segundo bloque de contenedores, en esos se
    // reemplazará la lista de opciones definida.
    let text = `
    <select class="old-select">
        ${options}
        <option value="default" selected>Selecciona el classroom</option>
    </select>

    <div class="new-select">
        <div class="selection">
            <p>
                <span></span>
                <i></i>
            </p>
            <span></span>
        </div>
    </div>
    `
    $(div).replaceWith(`<div>${text}</div>`); // Reemplazamos
    instanceSelect(); // Ejecutamos la instancia
};

function setWarnMessage(warnMsg) {
    //$("#warn-message").parent().parent().css("width", "auto")
    $("#warn-message").parent().css("border", "none")
    $("#warn-message").parent().css("margin-left", "8%")
    $("#warn-message").parent().css("margin-top", "-2.5%")
    $("#warn-message").replaceWith(`
    <div style="width: 27em;" class="warn-message-createq-presentation">
        <p>${warnMsg}</p>
    </div>`);
}

function openCreateSurveyView(viewId) {
    window.location.assign(viewId);
}

// esta vaina será pa la siguiente entrega
/*
async function deleteSurvey(classroomId) {
    let res = await postInfo({
        task: "create_survey",
        data: entity
    });
};
async function deleteSurveyFromTeacher(classroomId) {
    let res = await postInfo({
        task: "create_survey",
        data: entity
    });
};
async function deleteSurveyFromStudent(classroomId) {
    let res = await postInfo({
        task: "create_survey",
        data: entity
    });
};
*/
