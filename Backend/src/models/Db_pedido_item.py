from sqlalchemy import Column, Integer, ForeignKey
from main import Base

class PedidoItem(Base):
    __tablename__ = "PedidoItem"

    id = Column('id', Integer, autoincrement=True, primary_key=True, unique=True)
    pedido_id = Column('pedido_id', Integer, ForeignKey('Pedido.id'))
    item_id = Column('item_id', Integer, ForeignKey('Item.id'))
    quantidade = Column('quantidade', Integer)

    def __init__(self, pedido_id, item_id, quantidade, id=None):
        self.id = id
        self.pedido_id = pedido_id
        self.item_id = item_id
        self.quantidade = quantidade