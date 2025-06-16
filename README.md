Certifique-se de ter o MySQL em execução.
Criar o banco de dados e a tabela:
Navegue até a pasta checklist-app/ no terminal.
Execute o script SQL: mysql -u seu_usuario -p < database/schema.sql (substitua seu_usuario e sua_senha).
Instale as dependências do Node.js:
No terminal, na pasta checklist-app/, execute: npm install
Configure as credenciais do banco de dados:
Edite src/config/db.js com suas credenciais do MySQL.
Inicie o servidor Node.js:
No terminal, na pasta checklist-app/, execute: node src/app.js
Você deverá ver a mensagem: Servidor rodando em http://localhost:3000
Abra o aplicativo no navegador:
Abra seu navegador e acesse http://localhost:3000.