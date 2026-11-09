from sqlalchemy import Column, Integer, ForeignKey, DECIMAL, String
from main import Base

class Cliente(Base):
    __tablename__ = "Combo"

    id = Column('id', Integer, autoincrement=True, primary_key=True, unique=True)
    nome = Column('nome', String(255))
    endereco = Column('endereco', String(255))
    contato = Column('contato', String(20))
    cupom_id = Column('cupom_id', Integer('Cupom.id'))
    avaliacao_id = Column('avaliacao_id', Integer('Avaliacao.id'))

    def __init__(self, id, nome, endereco, contato, cupom_id, avaliacao_id):

        self.id = id
        self.nome = nome
        self.endereco = endereco
        self.contato = contato
        self.cupom_id = cupom_id
        self.avaliacao_id = avaliacao_id