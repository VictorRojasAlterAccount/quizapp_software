const { getData } = require("./action.js");

describe("getEntityName", () => {
    it("Verifique el nombre de la entidad del usuario dado.", () => {
        const response = getData({task: "getEntityName"}, {username: "teacherTest123"}); 
        console.log(response);
        expect(response).toBe("teacher");
    });

    it("Verifique que no existan entidades con un nombre vacio.", () => {
        const response = getData({task: "getEntityName"}, {username: ""});
        console.log(response);
        expect(response).toBeNull();
    });
});

describe("getRandomClassroomCode", () => {
    it("Verifique que el codigo de classroom generado sea de 6 digitos.", () => {
        const response = getData({task: "getRandomClassroomCode"}); 
        console.log(response);
        expect(response).toHaveLength(6);
    });

    it("Verifique que el codigo de classroom generado sea de tipo String.", () => {
        const response = typeof getData({task: "getRandomClassroomCode"}) == 'string'; 
        console.log(response);
        expect(response).toBe(true);
    });
});

describe("getClassroomByCode", () => {
    it("Verifique que el codigo de classroom dado corresponda a uno ya creado o la respuesta es null.", () => {
        const response = getData({task: "getClassroomByCode"}, {code: "452332"}); 
        console.log(response);
        if (!response) expect(response).toBeNull();
        else expect(response).toBeTruthy();
    });

    it("Verifique que la función retorne un objeto.", () => {
        const response = typeof getData({task: "getClassroomByCode"}, {code: "452332"}) == 'object';
        console.log(response);
        expect(response).toBe(true);
    })
});

describe("getClassroomsByTeacherUsername", () => {
    it("Verifique que existan classroom a la propiedad de el usuario dado o la respuesta es null.", () => {
        const response = getData({task: "getClassroomsByTeacherUsername"}, {username: "teacherTest123"}); 
        console.log(response);
        if (!response) expect(response).toBeNull();
        else expect(response).toBeTruthy();
    });
 
    it("Verifique que la función retorne un arreglo o falsy.", () => {
        const response = Array.isArray(getData({task: "getClassroomsByTeacherUsername"}, {username: "teacherTest123"}));
        console.log(response);
        if (!response) expect(response).toBeFalsy();
        else expect(response).toBe(true);
    });
});

describe("getClassroomsByStudentUsername", () => {
    it("Verifique que existan classroom a la participación del usuario dado o la respuesta es null.", () => {
        const response = getData({task: "getClassroomsByStudentUsername"}, {username: "studentTest123"}); 
        console.log(response);
        if (!response) expect(response).toBeNull();
        else expect(response).toBeTruthy();
    });

    it("Verifique que la función retorne un arreglo o falsy.", () => {
        const response = Array.isArray(getData({task: "getClassroomsByStudentUsername"}, {username: "studentTest123"}));
        console.log(response);
        if (!response) expect(response).toBeFalsy();
        else expect(response).toBe(true);
    });
});

describe("getStudentsByClassroomCode", () => {
    it("Verifique que existen estudiantes en la participación del classroom dado o las respuesta es null.", () => {
        const response = getData({task: "getStudentsByClassroomCode"}, {code: "452332"}); 
        console.log(response);
        if (!response) expect(response).toBeNull();
        else expect(response).toBeTruthy();
    });

    it("Verifique que la función retorne un arreglo o falsy.", () => {
        const response = Array.isArray(getData({task: "getStudentsByClassroomCode"}, {code: "452332"}));
        console.log(response);
        if (!response) expect(response).toBeFalsy();
        else expect(response).toBe(true);
    });
});

describe("validateClassroomRegistered", () => {
    it("Verifique que existe el estudiante dado en participación del classroom dado o la respuesta es null.", () => {
        const response = getData({task: "validateClassroomRegistered"}, {data: "studentTest123-452332"}); 
        console.log(response);
        if (!response) expect(response).toBeNull();
        else expect(response).toBeTruthy();
    });

    it("Verifique que la función retorne un objeto.", () => {
        const response = typeof getData({task: "validateClassroomRegistered"}, {data: "studentTest123-452332"}) == 'object'
        console.log(response);
        expect(response).toBe(true);
    });
});

describe("getQuestionsByClassroomCode", () => {
    it("Verifique que existen preguntas para el classroom dado o la respuesta es null.", () => {
        const response = getData({task: "getQuestionsByClassroomCode"}, {code: "452332"});
        console.log(response);
        if (!response) expect(response).toBeNull();
        else expect(response).toBeTruthy();
    });

    it("Verifique que la función retorne un arreglo o falsy.", () => {
        const response = Array.isArray(getData({task: "getQuestionsByClassroomCode"}, {code: "452332"}))
        console.log(response);
        if (!response) expect(response).toBeFalsy();
        else expect(response).toBe(true);
    });
});

describe("getBankCodeByClassroomCode", () => {
    it("Verifique es posible obtener el codigo del banco del classroom dado o la respuesta es null.", () => {
        const response = getData({task: "getBankCodeByClassroomCode"}, {code: "452332"}); 
        console.log(response);
        if (!response) expect(response).toBeNull();
        else expect(response).toBeTruthy();
    });

    it("Verifique que la función retorne un string.", () => {
        const response = typeof getData({task: "getBankCodeByClassroomCode"}, {code: "452332"}) == 'string';
        console.log(response);
        expect(response).toBe(true);
    });
});

describe("getQuestionsByPublicBank", () => {
    it("Verifique que existen preguntas en el banco dado o la respuesta o la respuesta es null.", () => {
        const response = getData({task: "getQuestionsByPublicBank"}); 
        console.log(response);
        if (!response) expect(response).toBeNull();
        else expect(response).toBeTruthy();
    });

    it("Verifique que la función retorne un arreglo o falsy.", () => {
        const response = Array.isArray(getData({task: "getQuestionsByPublicBank"}));
        console.log(response);
        if (!response) expect(response).toBeFalsy();
        else expect(response).toBe(true);        
    });
});

describe("getSurveysByClassroomCode", () => {
    it("Verifique que existen encuestas para el classroom dado.", () => {
        const response = getData({task: "getSurveysByClassroomCode"}, {code: "452332"}); 
        console.log(response);
        if (!response) expect(response).toBeNull();
        else expect(response).toBeTruthy();
    });

    it("Verifique que la función retorne un arreglo o falsy.", () => {
        const response = Array.isArray(getData({task: "getSurveysByClassroomCode"}, {code: "452332"}));
        console.log(response);
        if (!response) expect(response).toBeFalsy();
        else expect(response).toBe(true);      
    });
});

describe("getSurveysByStudentUsernameAndClassroomCode", () => {
    it("Verifique que existen encuestas pendientes para el estudiante y classroom dados o es la respuesta es null.", () => {
        const response = getData({task: "getSurveysByStudentUsernameAndClassroomCode"}, {data: "studentTest123-452332"}); 
        console.log(response);
        if (!response) expect(response).toBeNull();
        else expect(response).toBeTruthy();
    });

    it("Verifique que la función retorne un arreglo o falsy.", () => {
        const response = Array.isArray(getData({task: "getSurveysByStudentUsernameAndClassroomCodes"}, {code: "studentTest123-452332"}));
        console.log(response);
        if (!response) expect(response).toBeFalsy();
        else expect(response).toBe(true);      
    });
});

describe("getSurveyByCode", () => {
    it("Verifique si es posible obtener una encuesta dado su codigo o el resultado es null.", () => {
        const response = getData({task: "getSurveyByCode"}, {code: "812234"}); 
        console.log(response);
        if (!response) expect(response).toBeNull();
        else expect(response).toBeTruthy();
    });

    it("Verifique que la función retorne un objeto.", () => {
        const response = typeof getData({task: "getSurveyByCode"}, {code: "812234"}) == 'object';
        console.log(response);
        expect(response).toBe(true);
    });
});

describe("getQuestionsByClassification", () => {
    it("Verifique si es posible obtener las preguntas dada la clasificación del estudiante o el resultado es null.", () => {
        const response = getData({task: "getQuestionsByClassification"}, {data: "studentTest123-452332-6"}); 
        console.log(response);
        if (!response) expect(response).toBeNull();
        else expect(response).toBeTruthy();
    });

    it("Verifique que la función retorne un arreglo.", () => {
        const response = Array.isArray(getData({task: "getQuestionsByClassification"}, {data: "studentTest123-452332-6"}));
        console.log(response);
        if (!response) expect(response).toBeFalsy();
        else expect(response).toBe(true);
    });
});

describe("getScoresByUsername", () => {
    it("Verifique si es posible obtener los puntajes dado el usuario o el resultado es null.", () => {
        const response = getData({task: "getScoresByUsername"}, {username: "studentTest123"}); 
        console.log(response);
        if (!response) expect(response).toBeNull();
        else expect(response).toBeTruthy();
    });

    it("Verifique que la función retorne un arreglo.", () => {
        const response = Array.isArray(getData({task: "getScoresByUsername"}, {username: "studentTest123"}));
        console.log(response);
        if (!response) expect(response).toBeFalsy();
        else expect(response).toBe(true);
    });
});

describe("getOptionsByQuestionCode", () => {
    it("Verifique si es posible obtener las opciones de respuesta dada la pregunta o el resultado es null.", () => {
        const response = getData({task: "getOptionsByQuestionCode"}, {code: "812234"}); 
        console.log(response);
        if (!response) expect(response).toBeNull();
        else expect(response).toBeTruthy();
    });

    it("Verifique que la función retorne un arreglo.", () => {
        const response = Array.isArray(getData({task: "getOptionsByQuestionCode"}, {code: "812234"}));
        console.log(response);
        if (!response) expect(response).toBeFalsy();
        else expect(response).toBe(true);
    });
});

