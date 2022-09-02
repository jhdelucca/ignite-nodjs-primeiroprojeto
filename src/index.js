const express = require('express');
const res = require('express/lib/response');
const {v4: uuidv4} = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

//Midleware (necessita desses trems params)
function verifyIfExistsAccountCpf(request,response,next) {
    const {cpf} = request.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);

    if(!customer) {
        return response.status(400).send({mensagem:"Não existe extrato"});
    }

    request.customer = customer;

    return next();

}

function getBalance(statement) {
    const balance = statement.reduce((acc,indice) => {
        console.log(indice.amount);
        console.log("Valor" + acc);
        if(indice.type === 'credit') {
            return acc + indice.amount;
        }else{
       
            return acc - indice.amount;
          
        }
    }, 0);
   //console.log(balance);
    return balance;
}
app.get("/account" , verifyIfExistsAccountCpf , (request,response) => {
    const {customer} = request;

    response.json({conta:customer});
})
app.post("/account" , (request,response) => {
    const {cpf,name} = request.body;

    const custmerAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    );

    if(custmerAlreadyExists) {
        response.status(401).send({mensagem:"Erro. Cpf ja existente !"});
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    });

    console.log(customers);

    return response.status(201).send({mensagem: "Deu certo"});
});

//app.use(verifyIfExistsAccountCpf); Caso use assim, todas as funções abaixo vao validar middlweare
app.get("/statement" , verifyIfExistsAccountCpf, (request,response) => {
    //const {cpf} = request.params;
    const {customer} = request;
    
    return response.json({Depositos:customer.statement}); 
});

app.post("/deposit" , verifyIfExistsAccountCpf , (request,response) => {
    const {description, amount} = request.body;
    const {customer} = request;

    const stateOperation = {
        description,
        amount,
        create_at: new Date(),
        type: "credit"
    
    }

    customer.statement.push(stateOperation);

    return response.status(201).send({mensagem:"Deposito Feito"});
});

app.post("/withdraw" , verifyIfExistsAccountCpf , (request,response) => {
    const {amount} = request.body;
    const {customer} = request;

    const balance = getBalance(customer.statement);
    console.log("B - " + balance);

    if(balance < amount) {
        return response.status(400).json({erro: "Saldo Insuficiente"});
    }

    const statementOperation = {
        amount,
        created_at : new Date(),
        type: "debit"
    };

    customer.statement.push(statementOperation);

    return response.status(201).send({mensagem:"Saque feito: " + statementOperation.amount});
});

app.get("/statement/date" , verifyIfExistsAccountCpf , (request,response) => {
    const {customer} = request;
    const {date} = request.query;

    

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => statement.create_at.toDateString() === 
    new Date(dateFormat).toDateString());

    return response.json({mensagem:statement});
});

app.put("/account" , verifyIfExistsAccountCpf , (request, response) => {
    const {customer} = request;
    const {name} = request.body;

    customer.name = name;

    return response.status(201).send({mensagem:"Conta Alterada"});
});

app.delete("/account" , verifyIfExistsAccountCpf , (request,response) => {
    const {customer} = request;

    customers.splice(customer , 1);

    return response.status(200).json(customers);
});

app.get("/balance" , verifyIfExistsAccountCpf, (request,response) => {
    const {customer} = request;

    const balance = getBalance(customer.statement);

    return response.json(balance);

});




app.listen(3333);


