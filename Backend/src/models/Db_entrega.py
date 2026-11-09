from sqlalchemy import Column, Integer, ForeignKey, String
from main import Base

class Entrega(Base):
    __tablename__ = "Entrega"

    id = Column('id', Integer, autoincrement=True, primary_key=True, unique=True)
    pedido_id = Column('pedido_id', Integer, ForeignKey('Pedido.id'))
    endereco_entrega = Column('endereco_entrega', String(255))

    def __init__(self, pedido_id, endereco_entrega, id=None):
        self.id = id
        self.pedido_id = pedido_id
        self.endereco_entrega = endereco_entrega