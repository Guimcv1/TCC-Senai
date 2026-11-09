from sqlalchemy import Column, Integer, ForeignKey, String
from main import Base

class PedidoStatusHistorico(Base):
    __tablename__ = "PedidoStatusHistorico"

    id = Column('id', Integer, autoincrement=True, primary_key=True, unique=True)
    pedido_id = Column('pedido_id', Integer, ForeignKey('Pedido.id'))
    status_id = Column('status_id', Integer, ForeignKey('Status.id'))
    data_alteracao = Column('data_alteracao', String(50))

    def __init__(self, pedido_id, status_id, data_alteracao, id=None):
        self.id = id
        self.pedido_id = pedido_id
        self.status_id = status_id
        self.data_alteracao = data_alteracao