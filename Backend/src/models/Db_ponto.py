from sqlalchemy import Column, Integer, ForeignKey
from main import Base

class Ponto(Base):
    __tablename__ = "Ponto"

    id = Column('id', Integer, autoincrement=True, primary_key=True, unique=True)
    cliente_id = Column('cliente_id', Integer, ForeignKey('Cliente.id'))
    quantidade = Column('quantidade', Integer)

    def __init__(self, cliente_id, quantidade, id=None):
        self.id = id
        self.cliente_id = cliente_id
        self.quantidade = quantidade