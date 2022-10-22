const scoreData = JSON.parse(localStorage.getItem("scoreData")) || null;
const surveyCode = localStorage.getItem("lastSurveyCode");

// Aqui se carga la información que se presenta al finalizar un Quiz
$(document).ready(function() { 
    setScoreData();
});

async function setScoreData() {
    const entity = {
        username: session.username,
        surveyCode: surveyCode,
        score: scoreData.score,

        // Los puntajes se presentan de 100 en 100
        maxScore: scoreData.maxScore * 100 
    };

    let res = await postInfo({
        task: "set_scores",
        data: entity
    });

    if (res.status == 400) {
        return alert("Ha ocurrido un error al momento de establecer el puntaje.");
    };

    res = await getInfo(`getSurveyByCode?code=${surveyCode}`);
    if (!res.data) return alert("Hubo un error al momento de obtener la encuesta, intenta de nuevo más tarde.");
    const survey = res.data; 

    // Maquetamos
    const txt = `<div>
        <p style="font-size: 6em" class="white-text">${session.username}</p>
        <p style="font-size: 3em" class="white-text">Terminaste: ${survey.surveyName}</p>
        <p style="font-size: 3em; background: green" class="white-text">Puntaje total: ${entity.score}/${entity.maxScore}</p>
    </div>`;

    // Reemplazamos
    $("#final-score").replaceWith(txt);  
};