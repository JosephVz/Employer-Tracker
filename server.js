const inquirer = require("inquirer");
const sql = require('mysql2');

const db = sql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    port: 3306,
    database: 'employeeTracker_db',
});

db.connect((err) => {
    if (err) throw err;
    console.log("Connected to the database.");
    go();
})

function go() {
    inquirer
        .prompt({
            type: 'list',
            name: 'choices',
            message: 'What would you like to do?',
            choices: [
                'View All Employees',
                'Add Employee',
                'Update Employee Role',
                'View All Roles',
                'Add Role',
                'View All Departments',
                'Add Department',
            ],
        })
        .then((answer) => {
            switch (answer.choices) {
                case "View All Employees":
                    viewAllEmployees(); //3 Functioning but wont show values
                    break;
                case "Add Employee": //6 Not Functioning
                    addEmployee();
                    break;
                case "Update Employee Role": //7 Not Functioning
                    updateEmployeeRole();
                    break;
                case "View All Roles": //2 Fully Functioning
                    viewAllRoles();
                    break;
                case "Add Role": //5 Slightly Functioning but throwing err
                    addRole();
                    break;
                case "View All Departments": //1 Fully Functioning
                    viewAllDepartments();
                    break;
                case "Add Department": //4 Fully Functioning
                    addDepartment();
                    break;
            }
        });
}

function viewAllDepartments() {
    const query = 'SELECT * FROM departments';
    db.query(query, (err, res) => {
        if (err) throw err;
        console.table(res);
        go();
    });
};

function viewAllRoles() {
    const query = 'SELECT * FROM roles';
    db.query(query, (err, res) => {
        if (err) throw err;
        console.table(res);
        go();
    });
};

function viewAllEmployees() {
    const query = `SELECT * FROM employee`;
    db.query(query, (err, res) => {
        if (err) throw err;
        console.table(res);
        go();
    });
};

function addDepartment() {
    inquirer
        .prompt({
            type: 'input',
            name: 'name',
            message: 'Enter the name of the new department:',
        })
        .then((answer) => {
            console.log(`${answer.name} added to database.`);
            const query = `INSERT INTO departments (department_name) VALUES ('${answer.name}')`;
            db.query(query, (err, res) => {
                if (err) throw err;
                go();
            });
        });
};

function addRole() {
    const query = 'SELECT * FROM departments';
    db.query(query, (err, res) => {
        if (err) throw err;
        inquirer
            .prompt([
                {
                    type: 'input',
                    name: "title",
                    message: 'Enter the title of the new role:',
                },
                {
                    type: 'input',
                    name: 'salary',
                    message: 'Enter the salary of the new role:',
                },
                {
                    type: 'list',
                    name: 'department',
                    message: 'Select the department for the new role:',
                    choices: res.map(
                        (department) => department.department_name
                    ),
                },
            ])
            .then((answers) => {
                const department = res.find(
                    (department) => department.name === answers.department
                );
                const query = 'INSERT INTO roles SET ?';
                db.query(
                    query,
                    {
                        title: answers.title,
                        salary: answers.salary,
                        department_id: department,
                        department_name: department,
                    },
                    (err, res) => {
                        if (err) throw err;
                        console.log(`Added role ${answers.title} with salary ${answers.salary} to the ${answers.department} department in the database.`
                        );
                        go();
                    }
                );
            });
    });
}

function addEmployee() {
    db.query("SELECT title FROM roles", (error, results) => {
        if (error) {
            console.error(error);
            return;
        }

        const roles = results.map(({ id, title }) => ({
            name: title,
            value: id,
        }));

        db.query(
            'SELECT id, CONCAT(first_name, " ", last_name) AS name FROM employee',
            (error, results) => {
                if (error) {
                    console.error(error);
                    return;
                }

                const managers = results.map(({ id, name }) => ({
                    name,
                    value: id,
                }));

                inquirer
                    .prompt([
                        {
                            type: "input",
                            name: "firstName",
                            message: "Enter the employee's first name:",
                        },
                        {
                            type: "input",
                            name: "lastName",
                            message: "Enter the employee's last name:",
                        },
                        {
                            type: "list",
                            name: "roleId",
                            message: "Select the employee role:",
                            choices: roles,
                        },
                        {
                            type: "list",
                            name: "managerId",
                            message: "Select the employee manager:",
                            choices: [
                                { name: "None", value: null },
                                ...managers,
                            ],
                        },
                    ])
                    .then((answers) => {
                        const sql =
                            "INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)";
                        const values = [
                            answers.firstName,
                            answers.lastName,
                            answers.roleId,
                            answers.managerId,
                        ];
                        db.query(sql, values, (error) => {
                            if (error) {
                                console.error(error);
                                return;
                            }

                            console.log("Employee added successfully");
                            go();
                        });
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        );
    });
}

function updateEmployeeRole() {
    const queryEmployees =
        "SELECT employee.id, employee.first_name, employee.last_name, roles.title FROM employee LEFT JOIN roles ON employee.role_id = roles.id";
    const queryRoles = "SELECT * FROM roles";
    db.query(queryEmployees, (err, resEmployees) => {
        if (err) throw err;
        db.query(queryRoles, (err, resRoles) => {
            if (err) throw err;
            inquirer
                .prompt([
                    {
                        type: "list",
                        name: "employee",
                        message: "Select the employee to update:",
                        choices: resEmployees.map(
                            (employee) =>
                                `${employee.first_name} ${employee.last_name}`
                        ),
                    },
                    {
                        type: "list",
                        name: "role",
                        message: "Select the new role:",
                        choices: resRoles.map((role) => role.title),
                    },
                ])
                .then((answers) => {
                    const employee = resEmployees.find(
                        (employee) =>
                            `${employee.first_name} ${employee.last_name}` ===
                            answers.employee
                    );
                    const role = resRoles.find(
                        (role) => role.title === answers.role
                    );
                    const query =
                        "UPDATE employee SET role_id = ? WHERE id = ?";
                    db.query(
                        query,
                        [role.id, employee.id],
                        (err, res) => {
                            if (err) throw err;
                            console.log(
                                `Updated ${employee.first_name} ${employee.last_name}'s role to ${role.title} in the database!`
                            );
                            go();
                        }
                    );
                });
        });
    });
}











