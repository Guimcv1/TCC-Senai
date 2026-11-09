from sqlalchemy import Column, Integer, String, DECIMAL
from main import Base

class Promocao(Base):
    __tablename__ = "Promocao"

    id = Column('id', Integer, autoincrement=True, primary_key=True, unique=True)
    nome = Column('nome', String(255))
    desconto = Column('desconto', DECIMAL(10,2))

    def __init__(self, nome, desconto, id=None):
        self.id = id
        self.nome = nome
        self.desconto = desconto