from sqlalchemy import Column, Integer, String, ForeignKey
from main import Base

class Avaliacao(Base):
    __tablename__ = "Avaliacao"

    id = Column('id', Integer, autoincrement=True, primary_key=True, unique=True)
    nota = Column('nota', Integer)
    comentario = Column('comentario', String(500))
    pedido_id = Column('pedido_id', Integer, ForeignKey('Pedido.id'))

    def __init__(self, nota, comentario, pedido_id, id=None):
        self.id = id
        self.nota = nota
        self.comentario = comentario
        self.pedido_id = pedido_id