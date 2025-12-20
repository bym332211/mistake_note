ARG PYTHON_IMAGE=python:3.11-slim
FROM ${PYTHON_IMAGE}

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /workspace

# opencv-python runtime deps (libGL)
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /workspace/requirements.txt
RUN pip install -r /workspace/requirements.txt -i https://mirrors.aliyun.com/pypi/simple/

COPY . /workspace

EXPOSE 8000

CMD ["uvicorn", "app.app:app", "--host", "0.0.0.0", "--port", "8000"]
