const choices = Array.from(document.querySelectorAll('.choice-text'));
const progressText = document.querySelector('#progressText');
const progressBarFull = document.querySelector('#progressBarFull');
const scoreText = document.querySelector('#score');
const loadChoicesArea = document.querySelector("#load-choices");
const titleTextImageArea = document.querySelector("#option-text-image");

let imageOpening = false;
let availableQuestions = [];
let questionCounter = 0;
let score = 0;
let acceptingAnswers = true;

const SCORE_POINTS = 100;
let MAX_QUESTIONS;

// Al ingresar por primera vez a la vista, se despliega el quiz
function startQuestionary() {
    questionCounter = 0;
    score = 0;

    // Se obtienen las preguntas cargadas anteriormente en la vista de surveys (encuestas)
    let questions = JSON.parse(localStorage.getItem("quizQuestions")) || null;
    MAX_QUESTIONS = questions.length;

    availableQuestions = [...questions];
    getNewQuestion();
}

// Función para obtener una nueva pregunta en cada ciclo.
getNewQuestion = () => { 
    // Si no hay preguntas disponibles o ya se ha dado respuesta a todas, se va a la vista final.
    if(availableQuestions.length === 0 || questionCounter >= MAX_QUESTIONS) {
        localStorage.setItem('scoreData', JSON.stringify({score, maxScore: MAX_QUESTIONS}));
        return window.location.assign('../html/end.html');
    }
    
    questionCounter++;
    progressText.innerText = `Pregunta ${questionCounter} de ${MAX_QUESTIONS}`;
    progressBarFull.style.width = `${(questionCounter/MAX_QUESTIONS) * 100}%`;

    const qIndex = 0; //Math.floor(Math.random() * availableQuestions.length)
    let crtQuestion = availableQuestions[qIndex];

    //Mostrar resultados
    showResults() // TEMPORAL

    // Maqueta la pregunta seleccionada
    setQuestion(crtQuestion, qIndex); 
}

async function showResults() {
    const res = await getInfo(`getClassificationByUsername?username=${session.username}`);
    console.log(res.data);
}

// Maqueta la pregunta seleccionada
async function setQuestion(currentQuestion, questionsIndex) {
    let title_area = "", txt = "";
    let dataNumberCounter = 0;

    const res = await getInfo(`getOptionsByQuestionCode?code=${currentQuestion.questionCode}`);
    const options = res.data;

    const MAX_QUIZ_QUESTION_TITLE_LENGTH = 125; // Maximo texto a mostrar en la presentación del ENUNCIADO DE LA PREGUNTA
    // Maqueta
    title_area = `
        <div style="margin-top: 5%; margin-left: 5%; margin-right: 5%;">
            <div style="margin-bottom: 5%;">
                <h1 id="question" class="white-text">${formatText(currentQuestion.questionTitle, MAX_QUIZ_QUESTION_TITLE_LENGTH)}</h1>
                ${currentQuestion.questionTitle.length > MAX_QUIZ_QUESTION_TITLE_LENGTH ? `<a style="width: 10em; color: aqua; font-size: 1.5em;" class="link-reference white-text" onclick="openFullText(event, '${currentQuestion.questionTitle}')">Ver más</a>` : ""}            
            </div>
            ${currentQuestion.questionUrl.length == 0 || !isValidUrl(currentQuestion.questionUrl) ? "" : `<a style="width: 10em;" class="pointer btn btn-save-classroom" onclick="openImage(event, '${currentQuestion.questionUrl}')">Ver imagen <i class="fas fa-location-arrow"></i></a>`}
        </div>
    `;

    // Reemplaza
    titleTextImageArea.innerHTML = title_area;

    // Maqueta las opciones y reemplaza
    for(const option of options) {
        const IS_VALID_URL = option.optionUrl.length != 0 && isValidUrl(option.optionUrl);

        // Si hay una URL valida, va a haber un boton a la derecha, si no hay URL valida
        // ese boton no aparecera entonces aprovechamos ese espacio para expander el limite
        // de texto que se puede mostrar en las opcioness 
        const MAX_QUIZ_OPTION_TITLE_LENGTH = IS_VALID_URL ? 20 : 35; 

        // Maquetamos
        txt += `
            <div onclick="checkAnswers(event, \'#choice-container-${dataNumberCounter}\', ${option.isValid}, ${questionsIndex})" id="choice-container-${dataNumberCounter}" class="choice-container">                    
                <div class="flex left">
                    <p class="choice-prefix">${dataNumberCounter + 1}</p>
                    <p class="choice-text" data-number="${dataNumberCounter}">${formatText(option.optionTitle, MAX_QUIZ_OPTION_TITLE_LENGTH)}
                    ${option.optionTitle.length > MAX_QUIZ_OPTION_TITLE_LENGTH ? `<a class="link-option-reference align pointer white-text" onclick="openFullText(event, '${option.optionTitle}')">Ver más</a>` : ""}
                    </p>
                </div>
                ${!IS_VALID_URL ? "" : `
                <div class="flex right align" style="margin-right: 2%;" onclick="openImage(event, '${option.optionUrl}')">
                    <a class="btn btn-save-classroom" style="font-size: 0.7em; height: 1em; width: 9em;" href="#divOne">Ver imagen <i class="fas fa-location-arrow"></i></a>
                </div>`
                }
            </div>`

        // Reemplazamos
        dataNumberCounter = dataNumberCounter + 1;
    };

    loadChoicesArea.innerHTML = txt;
    acceptingAnswers = true;
}

async function checkAnswers(e, containerId, isValid, questionIndex) {
    e.preventDefault();

    // Se evita el caso en el que se intento respondar a otra opción en medio del cambio entre preguntas
    if (!acceptingAnswers) return; 
    acceptingAnswers = false;

    // Valida si la respuesta es correcta, si es así, notifica e incrementa los puntos
    if (isValid) {
        const question = availableQuestions[questionIndex];
        const res = await incrementClassification(question, session.username);
        if (res.status == 400) return alert("Ha ocurrido un error al momento de guardar tu respuesta, intenta de nuevo más tarde.");

        incrementScore(SCORE_POINTS);
        $(containerId).css("background", "linear-gradient(32deg, rgba(11, 223, 36) 0%, rgb(41, 232, 111) 100%)");
    } else {
        $(containerId).css("background", "linear-gradient(32deg, rgba(230, 29, 29, 1) 0%, rgb(224, 11, 11, 1) 100%)");
    }

    // Elimina la pregunta respuesta de las disponibles, y lanza una nueva pregunta.
    setTimeout(() => {
        $(containerId).css("background", "rgb(80, 125, 221)");
        availableQuestions = availableQuestions.filter((_, index) => index != questionIndex);
        getNewQuestion();
    }, 1000);
}

// Función para abrir una imagen completa en una vista
function openImage(e, url) {
    e.preventDefault();

    $("#title-image").attr("src", url);
    window.location.assign("#divOne");

    // Para evitar la propagación de eventos, ya que usamos botones anidados
    if (!e) var e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();
}

// Función para abrir el texto completo en una vista (se trata de una opción
// que solo se presenta cuando el texto supera un limite de caracteres)
function openFullText(e, fullText) {
    e.preventDefault();

    $("#option-text").html(fullText);
    window.location.assign("#divTwo");

    // Para evitar la propagación de eventos, ya que usamos botones anidados
    if (!e) var e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();
}

async function incrementClassification(question, username) {
    const res = await postInfo({
        task: "increment_classification",
        data: {
            username,
            questionCode: question.questionCode,
            questionType: question.questionType
        }
    });

    return res;
}

incrementScore = num => {
    score +=num
    scoreText.innerText = score
}

formatText = (string, length) => {
    if (string.length > length)
        return string.substring(0,length)+'...';
    else
        return string;
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

startQuestionary();
