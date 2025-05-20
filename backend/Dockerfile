FROM python:3.11-slim

WORKDIR /app

# Set Python path
ENV PYTHONPATH="${PYTHONPATH}:/app"

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
    
# Copy the rest of the application
COPY . .

# Create __init__.py in the app directory if it doesn't exist
RUN touch /app/app/__init__.py

# Expose the port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"] 