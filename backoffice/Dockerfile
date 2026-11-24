# Point de départ : un Linux léger avec Python
FROM python:3.14-slim

# Dossier de travail dans la boîte
WORKDIR /app

# D'abord la liste des bibliothèques seule, puis leur installation
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Puis tout le code
COPY . .

# Le site écoute sur le port 5000, ouvert à l'extérieur de la boîte
EXPOSE 5000
CMD ["flask", "--app", "app", "run", "--host", "0.0.0.0", "--port", "5000"]
