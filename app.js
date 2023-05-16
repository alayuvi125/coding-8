const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data;
  let getTodosQuery = "";
  const { status, priority, search_q = "" } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      getTodosQuery = `SELECT * FROM todo
                             WHERE todo LIKE "%${search_q}%"
                                AND priority = "${priority}"
                                AND status =  "${status}" ;`;
      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `SELECT * FROM todo
                             WHERE todo LIKE "${search_q}%" 
                               AND   priority = "${priority}" ;`;
      break;

    case hasStatusProperty(request.query):
      getTodosQuery = `SELECT * FROM todo
                             WHERE todo LIKE "%${search_q}%"
                                AND status =  "${status}" ;`;
      break;
    default:
      getTodosQuery = `SELECT * FROM todo
                             WHERE todo LIKE "%${search_q}%";`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;

  const responseQuery = await db.get(getTodoQuery);
  response.send(responseQuery);
});

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;

  const { id, todo, priority, status } = todoDetails;

  const postTodoQuery = `insert into todo(id,todo,priority,status) 
                        values (${id},'${todo}','${priority}','${status}') ;`;

  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;

  await db.run(deleteTodoQuery);

  response.send("Todo Deleted");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const { status, todo, priority } = request.body;

  if (status !== undefined) {
    const updateStatusQuery = `UPDATE todo SET status = "${status}" WHERE id = ${todoId} ;`;
    await db.run(updateStatusQuery);
    response.send("Status Updated");
  } else if (todo !== undefined) {
    const updateTodoQuery = `UPDATE todo SET todo = "${todo}" WHERE id = ${todoId} ;`;
    await db.run(updateTodoQuery);
    response.send("Todo Updated");
  } else {
    const updatePriorityQuery = `UPDATE todo SET priority = "${priority}" WHERE id = ${todoId} ;`;
    await db.run(updatePriorityQuery);
    response.send("Priority Updated");
  }
});

module.exports = app;
