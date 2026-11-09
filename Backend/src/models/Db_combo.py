from sqlalchemy import Column, Integer, String, DECIMAL
from main import Base

class Combo(Base):
    __tablename__ = "Combo"

    id = Column('id', Integer, autoincrement=True, primary_key=True, unique=True)
    nome = Column('nome', String(255))
    preco = Column('preco', DECIMAL(10,2))

    def __init__(self, nome, preco, id=None):
        self.id = id
        self.nome = nome
        self.preco = preco