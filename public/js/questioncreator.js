const bankTypeSelected = localStorage.getItem("bankType");
const bankTypeText = document.querySelector("#bankIndicatorText");
const classroomSelectedText = document.querySelector("#classroomIndicatorText");

// Si el banco es privado, mostramos la información ya que son independientes.
// Si es publico no interesa, puesto que este ultimo es global.
if (bankTypeSelected == "private") {
    classroomSelectedText.innerHTML = localStorage.getItem("classroomBankSelectionViewInput");
}

// Segun la sesion iniciada, muestra un encabezado distinto.
if (session.entityName == "teacher") {
    bankTypeText.innerHTML = `Creación de preguntas ${bankTypeSelected == "private" ? "privadas" : "publicas"}`;
} else if (session.entityName == "student") {
    bankTypeText.innerHTML = `Visualización de preguntas ${bankTypeSelected == "private" ? "privadas" : "publicas"}`
}
$(document).ready(function() {
    localStorage.setItem("updatableQuestionCode", 0);
    instanceViews();  
    instanceClassroomViewSelector("#select-classroom-update")
});

// Instancia las vistas segun la sesión
async function instanceViews(){
    // Maqueta el boton de crear encuesta, si la sesion es de profesor, lo reemplaza, si es estudiante lo oculta.
    instanceCreateQuestionButton(); 

    // Obtiene el codigo unico del banco seleciconado, si el banco es publico responde con 1
    const code = getSelectedBankCode();
    if (!code) return;
    
    let res;
    // Obtiene las preguntas segun el banco    
    if (bankTypeSelected == "private") res = await getInfo(`getQuestionsByClassroomCode?code=${code}`);
    else if (bankTypeSelected == "public") res = await getInfo(`getQuestionsByPublicBank`);
    if (res.status == 400) return alert("Ha ocurrido un error al localizar la información, intente de nuevo más tarde.");
        
    // Revisamos primero si hay preguntas a este banco, si las hay, revisamos que sean publicas.
    let thereIsPublicQuestions = false;
    let isStudent = false;

    const thereIsData = res.data;
    if (thereIsData)  {
        isStudent = session.entityName == "student";
        thereIsPublicQuestions = res.data.find(elem => elem.showToStudents == 1);
    }
    
    // No hay preguntas, o si las hay, no son publicas para el estudiante, entonces notificamos
    if (!thereIsData || (isStudent && !thereIsPublicQuestions)) {
        $("#warn-message").parent().attr("class", "center")
        $("#warn-message").replaceWith(`
                <div class="warn-message-presentation">
                    <p>
                    ${(isStudent && !thereIsPublicQuestions)
                    ? "No existen preguntas publicas a estudiantes en este banco" 
                    : "No existen preguntas creadas para este banco."}
                    </p>
                </div>`);
        $("#load_questions").replaceWith(`<div style="display: none"></div>`);
        $("#load_questions_view").replaceWith(`<div style="display: none"></div>`);
        return;
    }

    // Maqueta las preguntas para la vista, y para una ventana que muestra la información completa de estas
    const questions = res.data;
    var txtQuestions = "", txtQuestionsResume = "";

    let index = 0;
    for(const question of questions) {
        txtQuestions += await instanceQuestion(question, index);
        txtQuestionsResume += await instanceQuestionVisualization(question, index);
        index = index + 1;
    };

    $("#load_questions").replaceWith(txtQuestions);
    $("#load_questions_view").replaceWith(txtQuestionsResume);
    $("#warn-message").replaceWith(`<div style="display: none"></div>`);
}

function instanceCreateQuestionButton() {
    let create_question_btn = `<div class="total-width">     
        <div onclick="openWindow(event, '#divOne')" class="question_button_area question_create_button">
            <div class="total-width total-height white-text flex align center">                     
                <i class="large-font fa fa-user"></i>
                <p style="margin-left: 1em;" class="small-font white-text" id="classroom_button_text">Crear pregunta</p>                    
            </div>                   
        </div>
    </div>`

    if (session.entityName == "teacher") {
        $("#create-question-button").replaceWith(create_question_btn);
    } else if (session.entityName == "student") {
        $("#create-question-button").replaceWith(`<div style="display: none"></div>`);
    }
}

// Instancia las preguntas para mostrarlas en la vista
async function instanceQuestion(question, index) {
    // Si la sesión es de un estudiante, pero la pregunta no esta marcada como publica para estudiante, no la maqueta
    if (session.entityName == "student" && question.showToStudents == 0) return "";

    const MAX_QUESTION_TITLE_LENGTH = 35; // Maximo numero de caracteres antes de cortar el texto en la presentación de la vista
    const res = await getInfo(`getOptionsByQuestionCode?code=${question.questionCode}`);
    const options = res.data;

    text = `
    <div onclick="openWindow(event, '#div${index}')" class="pointer question-presentation flex">
        <div id="question-button-${index}" class="questions-text-button total-height">                    
            <p class="question-title">${formatText(question.questionTitle, MAX_QUESTION_TITLE_LENGTH)}</p>
            <p class="question-options-number">Cantidad de opciones: ${options.length}</p>
        </div>

        ${session.entityName == "student" ? "" : 
        `<div onclick="openWindow(event, '#divThree', \'${question.questionCode}\')" class="update-question-button align center right">
            <i class="fa fa-bookmark"></i>
        </div>`}

        ${session.entityName == "student" ? "" : 
        `<div onclick="deleteQuestion(event, \'${question.questionCode}\')" class="delete-question-button align center right">
            <i class="fas fa-bomb"></i>
        </div>`}
    </div>`

    return text;
}

// Instancia la ventana donde se muestra la pregunta (que se selecciona) completa
async function instanceQuestionVisualization(question, index) {
    const res = await getInfo(`getOptionsByQuestionCode?code=${question.questionCode}`);
    const options = res.data;
    let answers = "", view = "";

    // Declara las opciones, con el texto completo y con su imagen, si tiene.
    for(const option of options) {
        answers += `
        <div class="${option.isValid ? "answers-valid-option-presentation" : "answers-option-presentation"}">
            <p>${option.optionTitle}</p>

            ${option.optionUrl.length != 0 && isValidUrl(option.optionUrl) ? `<img src="${option.optionUrl}"/>` : ""}
        </div>
        `;
    }

    // Maqueta
    view = `
    <div class="overlay" style="overflow-y: auto;display: block;" id="div${index}">
        <div class="wrapper" style="width: 50%; margin-top: 1%;">
            <h2>Visualización de la pregunta</h2><a class="close" href="#">&times;</a>
            <div class="content">
                <div class="container">     
                    <p style="margin-bottom: 1em;">Tipo: ${makeItReadable(question.questionType)}</p>               
                    <p style="font-size:1em; margin-right: 1em;" class="question-title-view">${question.questionTitle}</p>
                    <div style="width: 30em; heigth: 20em; margin-top: 2%;">
                    ${question.questionUrl.length != 0 && isValidUrl(question.questionUrl) ? `<img style="object-fit: cover;" src="${question.questionUrl}"/>` : ""}
                    </div>                        
                    <div class="answers-presentation">${answers}</div>                         
                </div>
            </div>
        </div>
    </div>`
 
    return view;
}

function instanceClassroomViewSelector(div) {
    const options = `
        <li class="option-text" id="sensitiveIntuitive*">Sentitivos-Intuitivos</li>
        <li class="option-text" id="visualVerbal*">Visuales-Verbales</li>
        <li class="option-text" id="inductiveDeductive*">Inductivos-Deductivos</li>
        <li class="option-text" id="sequentialGlobal*">Secuenciales-Globales</li>
        <li class="option-text" id="activeReflective*">Activos-Reflexivos</li>`;

    let text = `
    <div style="margin-bottom: 1em;" class="dropdown">
        <div style="padding: 30px; padding-top: 15px; padding-bottom: 15px;" class="select">
        <span>Selecciona un tipo</span>
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

async function deleteQuestion(e, questionCode) {
    e.preventDefault();

    // Para evitar la propagación de eventos, ya que usamos botones anidados
    if (!e) var e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();

    const confirmation = confirm("¿Estas seguro de borrar esta pregunta?")
    if (!confirmation) return;

    const res = await postInfo({
        task: "delete_question",
        data: questionCode
    });

    if (res.status == 400) return alert("No ha sido posible eliminar la pregunta, intente de nuevo más tarde.");

    if (res.status == 200) {
        alert("Pregunta eliminada satisfactoriamente.");
        window.location.assign("../html/createquestion.html");
    }
}

$('#createQuestionBtn').click(async function(){
    const questionType = localStorage.getItem("questionTypeSelected");
    if (!questionType) return alert("Por favor, selecciona un tipo de pregunta.");

    const questionTitle = $("#title-text").val();
    if (questionTitle.length == 0) return alert("Por favor, escribe un enunciado para la pregunta.");

    const listLength = $("#total-list li").length;
    if (listLength <= 1) return alert("Por favor, selecciona al menos dos opciones de respuesta.");

    const optionChecked = valideOptionChecked();
    if (!optionChecked) return alert("Por favor, seleccione cual será la respuesta correcta.");

    const everyAnswerHasTitle = checkEveryAnswerTitle();
    if (!everyAnswerHasTitle) return alert("Por favor, ingrese los enunciados para todas las opciones de respuesta.");

    const questionUrl = $("#image-url").val();
    const showToStudentsOption = showToStudentsToggle(); // Obtiene si la pregunta es publica o no a estudiantes, segun el color del switch

    // Obtiene las opciones de respuesta directamente del html, 
    // la opción correcta la filtra por el color del elemento
    // (recordar que al seleccionar que opción sera correcta
    // el color del bordeado cambia respecto a las demas opciones)
    const answerOptions = getAnswerOptions(); 

    const entity = {
        questionTitle,
        questionUrl,
        questionType,
        bankCode: await getBankCode(),
        showToStudents: showToStudentsOption,

        answerOptions
    };

    registerQuestion(entity);
});


$("#updateQuestionBtn").click(async function() {
    const questionType = localStorage.getItem("updatableQuestionType");
    const showToStudentsOption = showToStudentsToggle(); // Obtiene si la pregunta es publica o no a estudiantes, segun el color del switch

    const entity = {
        questionCode: localStorage.getItem("updatableQuestionCode"),
        questionType,
        showToStudents: showToStudentsOption,
    }

    updateQuestion(entity);
});


async function registerQuestion(entity) {
    const res = await postInfo({
        task: "register_question",
        data: entity
    });

    if (res.status == 400) return alert("No ha sido posible crear la pregunta, intente de nuevo más tarde.");
    
    if (res.status == 200) {
        alert("Pregunta registrada satisfactoriamente.");
        window.location.assign("../html/createquestion.html");
    }
}

async function updateQuestion(entity) {
    const res = await postInfo({
        task: "update_question",
        data: entity
    });

    if (res.status == 400) return alert("No ha sido posible actualizar la pregunta, intente de nuevo más tarde.");
    
    if (res.status == 200) {
        alert("Pregunta actualizada satisfactoriamente.");
        window.location.assign("../html/createquestion.html");
    }
}

async function getBankCode() {
    // Obtiene la información del banco, si es publico, el identificador será simplemente 1
    // si es privado, filtramos la info segun el banco seleccionado y la validamos con el backend
    const isPublicBank = bankTypeSelected == "public";
    if (isPublicBank) return "1";
    
    const code = getSelectedBankCode();
    const res = await getInfo(`getBankCodeByClassroomCode?code=${code}`);
    if (!res.data) return alert("Ha ocurrido un error obteniendo su banco privado, intente de nuevo más tarde.")
    return res.data;
}

function showToStudentsToggle() {
    const toggleRgbValue = $(".toggler-slider").css("border-color");
    switch(toggleRgbValue) {
        case "rgb(68, 204, 102)": // YES
            return 1;
        case "rgb(235, 79, 55)": // NO
            return 0;
    }
}

function valideOptionChecked() {
    let result = false;
    const validBorder = "5px double rgb(0, 255, 0)";    
    $("#total-list ul").children().each(function(_, elem) {
        if (elem.style.border == validBorder) result = true;
    });

    return result;
}

function checkEveryAnswerTitle() {
    let result = true;

    $("#total-list ul").children().each(function(index) {
        const txtValue = $(`#submission-line-1-${index}`).val();
        if (txtValue.length == 0) result = false;
    });

    return result;
}

function getAnswerOptions() {
    let totalOptions = [];
    $("#total-list ul").children().each(function(index, elem) {
        const optionTitle = $(`#submission-line-1-${index}`).val();
        const optionUrl = $(`#submission-line-2-${index}`).val();
        const validBorder = "5px double rgb(0, 255, 0)";
        const elementColor = $(`#submission-line-1-${index}`).parent().parent().css("border");

        totalOptions.push({
            optionTitle, 
            optionUrl,
            isValid: elementColor == validBorder ? 1 : 0
        })
    });

    return totalOptions;
}

function getSelectedBankCode() {
    const selectedBank = localStorage.getItem("classroomBankSelectionViewInput");   
    if (!selectedBank) return null;
    if (selectedBank == 1) return 1;     

    const code = selectedBank.split("-")[1];
    return code;
}

// Validar si un string es una URL
const isValidUrl = urlString=> {
    var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
    '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
    return urlPattern.test(urlString);
}

function formatText(string, length) {
    if (string.length > length)
        return string.substring(0,length)+'...';
    else
        return string;
}

function openFullText(e, fullText) {
    e.preventDefault();
    $("#option-text").append(fullText);
    window.location.assign("#divTwo");
}

function openWindow(e, windowId, questionCode) {
    if (windowId != "#divThree") return window.location.assign(windowId); 

    e.preventDefault();
    // Para evitar la propagación de eventos, ya que usamos botones anidados
    if (!e) var e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();

    localStorage.setItem("updatableQuestionCode", questionCode);
    setUpdateWindowData(windowId, questionCode)
};

async function setUpdateWindowData(windowId, questionCode) {
    //const res = await getInfo(`getQuestionByCode?code=${questionCode}`);
    //if (!res.data) return alert("Ha ocurrido un error al obtener la información de la pregunta seleccionada. Intente de nuevo más tarde.")
    //const question = res.data;
    //document.querySelector("#update-title-text").innerHTML = question.questionTitle;
    //document.querySelector("#update-image-url").innerHTML = question.questionUrl;
    window.location.assign(windowId);
}

function makeItReadable(name) {
    switch(name) {
        case "sensitiveIntuitive":
            return "Sentitivos y Intuitivos";       
        case "visualVerbal":
            return "Visuales y Verbales";
        case "inductiveDeductive":
            return "Inductivos y Deductivos";
        case "sequentialGlobal":
            return "Secuenciales y Globales";
        case "activeReflective":
            return "Activos y Reflexivos";
    }
}