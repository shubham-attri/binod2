#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if virtual environment exists
if [ ! -d "venv312" ]; then
    echo -e "${RED}Virtual environment not found. Please run setup.sh first.${NC}"
    exit 1
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv312/bin/activate

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}.env file not found. Please create one from .env.example${NC}"
    exit 1
fi

# Run the FastAPI server
echo -e "${GREEN}Starting FastAPI server...${NC}"
uvicorn main:app --reload 