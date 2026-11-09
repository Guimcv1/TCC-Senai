from sqlalchemy import Column, Integer, ForeignKey, DECIMAL
from main import Base

class Pedido(Base):
    __tablename__ = "Pedido"

    id = Column('id', Integer, autoincrement=True, primary_key=True, unique=True)
    cliente_id = Column('cliente_id', Integer, ForeignKey('Cliente.id'))
    total = Column('total', DECIMAL(10,2))
    status_id = Column('status_id', Integer, ForeignKey('Status.id'))

    def __init__(self, cliente_id, total, status_id, id=None):
        self.id = id
        self.cliente_id = cliente_id
        self.total = total
        self.status_id = status_id