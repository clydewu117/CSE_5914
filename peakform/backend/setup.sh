#!/bin/bash

echo "Setting up PeakForm Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not installed"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Please edit .env file with your configuration"
fi

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

echo "Setup complete!"
echo ""
echo "To start the development server:"
echo "  source venv/bin/activate  # Activate virtual environment"
echo "  python run_dev.py         # Start development server"
echo ""
echo "API will be available at: http://127.0.0.1:8000"
echo "API Documentation: http://127.0.0.1:8000/docs"