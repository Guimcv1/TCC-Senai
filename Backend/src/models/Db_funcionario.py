from sqlalchemy import Column, Integer, String
from main import Base

class Funcionario(Base):
    __tablename__ = "Funcionario"

    id = Column('id', Integer, autoincrement=True, primary_key=True, unique=True)
    nome = Column('nome', String(255))
    cargo = Column('cargo', String(100))

    def __init__(self, nome, cargo, id=None):
        self.id = id
        self.nome = nome
        self.cargo = cargo