#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting backend setup...${NC}"

# Check if Python 3.12 is installed
if ! command -v python3.12 &> /dev/null; then
    echo "Python 3.12 is required but not installed. Please install it first."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv312" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3.12 -m venv venv312
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv312/bin/activate

# Upgrade pip
echo -e "${YELLOW}Upgrading pip...${NC}"
pip install --upgrade pip

# Install dependencies from requirements.txt
echo -e "${YELLOW}Installing dependencies from requirements.txt...${NC}"
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo "Please update the .env file with your configuration"
fi

echo -e "${GREEN}Setup completed successfully!${NC}" 