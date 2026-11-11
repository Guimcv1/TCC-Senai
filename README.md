# Sabor & Cia

API de gestão de uma lanchonete, implementada com FastAPI, Pydantic e SQLAlchemy.

## Executar com Docker

Na raiz do projeto:

```bash
docker compose -f Compose.yaml up --build
```

Após a inicialização:

- Frontend: http://localhost:3000
- API: http://localhost:8000
- Documentação interativa: http://localhost:8000/docs
- Health check: http://localhost:8000/health

O PostgreSQL usa o volume `postgres_data` e o backend acessa o banco pelo nome
do serviço `db`, sem depender de `localhost` dentro do container.

A ordem de inicialização é: PostgreSQL saudável, backend com as migrações
Alembic concluídas e, por fim, frontend servido pelo Nginx. O Compose constrói
uma imagem própria para cada aplicação (`backend` e `frontend`).

Durante o build da imagem do backend, o Docker cria uma virtualenv em
`/opt/venv`, atualiza o `pip` e instala todas as dependências de
`Backend/requirements.txt`. No frontend, o estágio de build executa `npm ci`
com base no `Frontend/package-lock.json`.

As tabelas são criadas pelo Alembic durante a inicialização do backend. Para
executar migrações manualmente no diretório `Backend`:

```bash
alembic upgrade head
```

Para criar uma nova migração após alterar os modelos:

```bash
alembic revision --autogenerate -m "descreva a alteração"
```

## Funcionalidades

- CRUD de categorias, clientes, produtos, funcionários, fornecedores, ingredientes e adicionais.
- Criação de pedidos com itens, adicionais, pagamentos e entrega.
- Validação de pedidos delivery e conferência do total dos pagamentos.
- Atualização do status do pedido e consulta do histórico de alterações.
