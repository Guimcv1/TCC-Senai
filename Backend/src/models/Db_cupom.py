from sqlalchemy import Column, Integer, String, DECIMAL
from main import Base

class Cupom(Base):
    __tablename__ = "Cupom"

    id = Column('id', Integer, autoincrement=True, primary_key=True, unique=True)
    codigo = Column('codigo', String(50))
    desconto = Column('desconto', DECIMAL(10,2))

    def __init__(self, codigo, desconto, id=None):
        self.id = id
        self.codigo = codigo
        self.desconto = desconto