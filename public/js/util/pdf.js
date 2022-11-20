async function getStudentsReport(event) {
    event.preventDefault();
    //const classroomSelectedCode = localStorage.getItem("classroomSelected") || null;
    //const res = await getInfo(`getReportOfStudentClassrooms?code=${classroomSelectedCode}`);
    //$("#pdfcontainer").hide();
    //$("#pdfcontent").replaceWith(`<div id='pdfcontent'>${res.data}</div>`);
    let element = document.getElementById("students-classroom-area-pdf");
    html2pdf().from(element).save();
}

function getQuestionsReport(event, id) {
    event.preventDefault();

    var opt = {
        margin: 0,
        filename: 'Pregunta.pdf',
        image: { type: 'jpeg', quality: 0.20 },
        html2canvas: { scale: 2,useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'p' }
    };

    let element = document.getElementById(id);
    html2pdf().set(opt).from(element).save();
}

function getSurveysReport() {
    let element = document.getElementById("surveys-zone-pdf");
    html2pdf().from(element).save();
}