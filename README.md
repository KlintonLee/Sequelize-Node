### Criando as configurações do Sequelize
  **1º** Armazenar as configurações e credenciais para a base de dados. 
  > src/config/database.js
  ```
    module.exports = {
      dialect: 'postgres',  // dialeto que estou utilizando, exemplos: 'mysql', 'postgres', 'mssql', ...
      host: 'localhost',    // host da base de dados, exemplo: localhost, NNN.NN.NN.NNN (N = number)
      username: 'postgres', // usuário da base de dados (auth login)
      password: 'postgres', // senha da base de dados   (auth password)
      database: 'sqlnode',  // Nome da base de dados
      define: {
        timestamps: true,   // Define que todas tabelas possuem (created_at e updated_at)
        underscored: true,  // Informa que o nome das tabelas utilizarão formato snake_case
      },
    }
  ```
  **2º** Realizar a conexão com a base de dados.
  > src/database/index.js
  ```
    const Sequelize = require('sequelize');
    const dbConfig = require('../config/database'); // credenciais do DB

    const connection = new Sequelize(dbConfig); // Realizando a conexão

    module.exports = connection;
  ```
  **3º** Utilizar a conexão
  > src/server.js
  ```
    ....
    require('./database/index');
    ....
  ```

### Rodando o primeiro comando do Sequelize
  Antes de rodarmos o primeiro comando devemos orientar o sequelize(criando um arquivo na raiz do projeto) onde ele deve buscar as credenciais, as migrations e os seeders
  > .sequelizerc
  ```
    const path = require('path');  // Permite definir caminho de forma confiável
      // __dirname (diretório onde o arquivo atual está.)

    module.exports = {
      config:  path.resolve(__dirname, 'src', 'config', 'database.js'),
      'migrations-path': path.resolve(__dirname, 'src', 'database', 'migrations'),
      'seeders-path': path.resolve(__dirname, 'src', 'database', 'seeders'),
    };
  ```
  **Criando a tabela**
  > yarn sequelize db:create
  **Criando a migration**, no name é recomendado colocar a função da migration.
  > yarn add sequelize migration:create --name=create-users

### Migrations
  Assim que a migration for criada, virá com dois métodos por padrão: **up** carrega a função da migration, e o método **down** servirá em caso de insucesso para desfazer a alteração da base de dados.
  
  [DataTypes](https://sequelize.org/v5/manual/data-types.html)
  ```
    'use strict';

    module.exports = {
      up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('users', {
          id: {
            type: Sequelize.INTEGER, // Tipo do dado
            primaryKey: true,        // Declara como chave primária
            autoIncrement: true,     // Campo auto-incremental
            allowNull: false,        // Não permite que o campo seja nulo
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          email: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
          }
        });
      },

      down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('users');
      }
    };
  ```
  **Rodando a Migration**, Ao executar o modelo anterior, serão criadas duas tabelas, a de usuário definida por mim e um SequelizeMeta que guarda um histório de migrations.
  > yarn sequelize db:migrate
  **Desfazendo a última Migration**
  >yarn sequelize db:migrate:undo
  **Desfazendo todas Migrations**
  >yarn sequelize db:migrate:undo:all
  A partir do momento que a migration foi para produção, **ela não deve executar a rollback**. O correto é criarmos uma nova migration para realizar a alteração da tabela. Veja um exemplo:
  > yarn sequelize migration:create --name=add-age-field-to-users
  ```
    'use strict';

    module.exports = {
      up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn(
          // Método para adicionar uma coluna na tabela.
          'users',  // Nome da tabela onde será adiciona a coluna
          'age',    // Nome da coluna a ser adicionado
          {
            type: Sequelize.STRING,
          },
        );
      },

      down: (queryInterface, Sequelize) => {
        return queryInterface.removeColumn(
          // Método para remover uma coluna na tabela.
          'users',  // Nome da tabela onde será removida a coluna
          'age',    // Nome da coluna a ser adicionado
        );
      }
    };
  ```
### Models
  O model é a representação de como a nossa aplicação se comunicará com a base de dados.
  > src/models/User.js
  ```
    const { Model, DataTypes } = require('sequelize');

    class User extends Model {
      // No model sempre criamos um método estático 'init()' que é padrão do sequelize.
      // e como parâmetro ele recebe a conexão com a base de dados.
      static init(sequelize) {
        // Esse Model possui um método 'init()' que receberá as colunas da nossa 
        // base de dados e a conexão
        super.init({
          name: DataTypes.STRING,
          email: DataTypes.STRING,
        }, {
          sequelize
        })
      }
    }

    module.exports = User;
  ```
  **Utilizando o Model que acabamos de criar:** Dentro do arquivo de conexão com o banco de dados precisaremos inicia-lo
  > src/database/index.js
  ```
    const Sequelize = require('sequelize');
    const dbConfig = require('../config/database');

    const User = require('../models/User');

    const connection = new Sequelize(dbConfig);

    User.init(connection)

    module.exports = connection;
  ```
### Exemplo da utilização do Sequelize
  > src/routes.js
  ```
    ....
    const UserController = require('./controllers/UserController');

    routes.get('/users', UserController.index);
    routes.post('/users', UserController.store);
    ....
  ```
  > src/controllers/UserController.js
  ```
    const User = require('../models/User');

    module.exports = {
      async index (req, res) {
        const users = await User.findAll();

        return res.json(users);
      },

      async store(req, res) {
        const { name, email } = req.body;

        const user = await User.create({ name, email });
        
        return res.json(user);
      }
    };
  ```
### Relacionamentos
  Para começarmos criaremos uma nova tabela 'addresses' e um model para ver o relacionamento na prática.
  > yarn sequelize migration:create --name=create-addresses
  ```
    'use strict';

    module.exports = {
      up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('addresses', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          // Precisaremos criar uma coluna a mais, porque preciso definir uma forma de
          // relacionar essa tabela de endereço com a tabela de usuários. Ou seja, o
          // dono dessa nova coluna criada.
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
              // references referencia uma outra tabela e a coluna dela (chave estrangeira).
            onUpdate: 'CASCADE',
              // comportamento ao atualizar o campo da chave primária.
            onDelete: 'CASCADE',
              // comportamento ao deletar o campo da chave primária.
              
              // o CASCADE atualiza nas estrageiras também.
              // o SET NULL altera as chaves estrageiras para Null
              // o RESTRICT restringe caso a chave primária esteja na estrangeira.

          },
          zipcode: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          street: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          number: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
          }
        });
      },

      down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('addresses');
      }
    };
  ```
  > src/models/Adress.js
  ```
    const { Model, DataTypes } = require('sequelize');

    class Address extends Model {
      static init(sequelize) {
        super.init({
          zipcode: DataTypes.STRING,
          street: DataTypes.STRING,
          number: DataTypes.INTEGER,
        }, { sequelize })
      }

      // Dentro do modelo precisamos criar a coluna que associa a chave 
      // estrangeira na tabela, para isso criaremos um método estático que 
      // receberá todos os models e um determinado model será parâmetro de um
      // método de relacionamento.
      static associate(models) {
        this.belongsTo(models.User, { foreignKey: 'user_id', as: 'owner' })
          // Dentro do objeto cadastramos algumas configurações.
          // foreignKey: 'user_id' (user da tabela Address)
          // as: 'owner' (como eu quero nomear este relacionamento.)
      }

      // belongsTo: Pertence a um único registro


      // Dentro da tabela de User também preciso criar este relacionamento, porém
      // com o hasMany
      // hasMany: Possui muitos registros
      // hasOne: Possui um único registro

    }

    module.exports = Address;
  ```
  **PS: Lembrar sempre de iniciar o Model na src/database/index.js e realizar o db:migrate para subir a nova tabela da migration na base de dados.**
  
  **Também precisaremos iniciar essa associação dentro do src/database/index.js**
  ```
    ....
      Address.associate(connection.models);

      // Toda vez que dou um Model.init(connection), o model é cadastrado dentro
      // da conexão. Desta forma basta informar a propriedade models.
    ....
  ```
### Join
  Ao invés de realizar dois **find** para buscar a tabela de usuário e a tabela de endereços. É possível utilizar o include do sequelize.
  ```
    /////////// Sem include ///////////
    const user = await User.findByPk(user_id);
    const addresses = await Address.findAll({ where: { user_id } });

    /////////// Com Include ///////////

    const user2 = await User.findByPk(user_id,  {
      include: { association: 'addresses' }
        // inclui uma associação (tabela)
    })

  ```
### Relacionamento N:N
  Começaremos criando uma tabela Techs, digamos que um usuário possui muitas tecnologias e uma tecnologia pertence a muitos usuários. Então será necessário uma tabela de tecnologias e uma tabela que permite o relacionamento.
  > yarn sequelize migration:create --name=create-techs
  ```
    'use strict';

    module.exports = {
      up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('techs', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
        }
      });
      },

      down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('techs');
      }
    };
  ```
  > src/models/Tech.js
  ```
    const { Model, DataTypes } = require('sequelize');

    class Tech extends Model {
      static init(sequelize) {
        super.init({
          name: DataTypes.STRING
        }, { sequelize, tableName: 'techs' });
        // Posso forçar o nome da table ser 'techs', por padrão ele pluralizou para teches.
      }

      static associate(models) {
        this.belongsToMany(models.User, { foreingKey: 'tech_id', through: 'user_techs', as: 'users' });
          // Agora utilizaremos outro tipo de associação, por tratar-se de um
          // relacionamento N:N
          // BelongsToMany: Pertence a muitos registros
          // no *through* informamos qual a tabela que realiza este relacionamento.
          // o *as* define o nome que irá aparece ao listar as informações.


          // O mesmo deverá ser feito no Model de usuários.
      }
    }

    module.exports = Tech;
  ```
  > src/models/TechController.js
  ```
  const Tech = require('../models/Tech');
  const User = require('../models/User');

  module.exports = {
    async index(req, res) {
      
    },

    async store(req, res) {
      const { user_id } = req.params;
      const { name } = req.body;

      const user = await User.findByPk(user_id);

      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      const [ techs, created ] = await Tech.findOrCreate({
        // o findOrCreate vai procurar pela tecnologia que o usuário informou no
        // req.body, se não encontrar ele criará a tecnologia. O retorno desta
        // função é o Model e um booleano se foi criado agora ou não.
        where: { name } 
      });

      // ****** Agora acontece algo muito legal do sequelize ******
      // Sempre que criamos um relacionamento N:N dentro de um model, ele cria 
      // vários métodos auxiliares.

      await user.addTech(tech)
        // E no parâmetro eu preciso passar o Model, não basta passar o id. 
        // Utilizo o await, porque esse método sempre retorna uma Promise

      return res.json(tech);
    },
  }
  ```
  [N:N-Associations](https://sequelize.org/v5/manual/associations.html#belongs-to-many-associations)

  Veja o exemplo, um usuário(**User**) tem muitos projetos, e um projeto(**Project**) pode estar associado a muitos usuários. Aí gera uma terceira tabela pivô, **UserProject**. Toda vez que criamos um relacionamento **belongsToMany**, o sequelize automaticamente cria um **.addProject()** para relacionarmos um projeto com um usuário. Mas existem outros métodos como **.getProjects()**, **.setProjects()**, **.RemoveProjects()**, ...

  No método **get** podemos remover os atributos utilizando o método through: Veja o exemplo:
  ```
    
  ```