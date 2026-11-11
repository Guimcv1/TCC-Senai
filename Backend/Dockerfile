FROM python:3.13-slim

WORKDIR /app

ENV VIRTUAL_ENV=/opt/venv
ENV PATH="${VIRTUAL_ENV}/bin:${PATH}"

RUN python -m venv "${VIRTUAL_ENV}"

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && python -m uvicorn main:app --host 0.0.0.0 --port 8000"]
