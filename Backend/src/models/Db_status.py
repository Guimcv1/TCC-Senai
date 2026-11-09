from sqlalchemy import Column, Integer, String
from main import Base

class Status(Base):
    __tablename__ = "Status"

    id = Column('id', Integer, autoincrement=True, primary_key=True, unique=True)
    descricao = Column('descricao', String(100))

    def __init__(self, descricao, id=None):
        self.id = id
        self.descricao = descricao