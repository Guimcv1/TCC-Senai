from sqlalchemy import Column, Integer, ForeignKey, String
from main import Base

class Preparo(Base):
    __tablename__ = "Preparo"

    id = Column('id', Integer, autoincrement=True, primary_key=True, unique=True)
    pedido_id = Column('pedido_id', Integer, ForeignKey('Pedido.id'))
    funcionario_id = Column('funcionario_id', Integer, ForeignKey('Funcionario.id'))
    tempo_estimado = Column('tempo_estimado', String(50))

    def __init__(self, pedido_id, funcionario_id, tempo_estimado, id=None):
        self.id = id
        self.pedido_id = pedido_id
        self.funcionario_id = funcionario_id
        self.tempo_estimado = tempo_estimado