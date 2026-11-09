from sqlalchemy import Column, Integer, ForeignKey, DECIMAL, String
from main import Base

class Pagamento(Base):
    __tablename__ = "Pagamento"

    id = Column('id', Integer, autoincrement=True, primary_key=True, unique=True)
    pedido_id = Column('pedido_id', Integer, ForeignKey('Pedido.id'))
    valor = Column('valor', DECIMAL(10,2))
    metodo = Column('metodo', String(50))

    def __init__(self, pedido_id, valor, metodo, id=None):
        self.id = id
        self.pedido_id = pedido_id
        self.valor = valor
        self.metodo = metodo